package com.example.inventory.service;

import com.example.inventory.dto.*;
import com.example.inventory.entity.InventoryItem;
import com.example.inventory.entity.InventoryMovement;
import com.example.inventory.enums.InventoryStatus;
import com.example.inventory.enums.MovementType;
import com.example.inventory.exception.ResourceNotFoundException;
import com.example.inventory.kafka.InventoryEventProducer;
import com.example.inventory.repository.InventoryItemRepository;
import com.example.inventory.repository.MovementRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
public class InventoryServiceTest {

    @Mock
    private InventoryItemRepository itemRepository;

    @Mock
    private MovementRepository movementRepository;

    @Mock
    private InventoryCacheService cacheService;

    @Mock
    private InventoryEventProducer eventProducer;

    @InjectMocks
    private InventoryService inventoryService;

    private InventoryItem sampleItem;

    @BeforeEach
    void setUp() {
        sampleItem = new InventoryItem("prod-123", "var-456", "SKU-IPH-100", 100, 10);
        sampleItem.setId("inv-uuid-1");
    }

    @Test
    void testCreateInventoryItem_Success() {
        CreateInventoryItemRequest req = new CreateInventoryItemRequest("prod-123", "var-456", "SKU-IPH-100", 100, 10);

        when(itemRepository.findByVariantId("var-456")).thenReturn(Optional.empty());
        when(itemRepository.findBySku("SKU-IPH-100")).thenReturn(Optional.empty());
        when(itemRepository.save(any(InventoryItem.class))).thenReturn(sampleItem);
        when(movementRepository.save(any(InventoryMovement.class))).thenReturn(new InventoryMovement());

        InventoryResponse res = inventoryService.createItem(req);

        assertNotNull(res);
        assertEquals("var-456", res.getVariantId());
        assertEquals(100, res.getTotalQuantity());
        assertEquals(100, res.getAvailableQuantity());
        assertEquals(0, res.getReservedQuantity());
        assertEquals(InventoryStatus.IN_STOCK, res.getStatus());

        verify(eventProducer).publishEvent(eq("var-456"), eq("InventoryCreated"), any());
        verify(cacheService).put(eq("var-456"), any(InventoryResponse.class));
    }

    @Test
    void testCreateInventoryItem_AlreadyExists_ThrowsException() {
        CreateInventoryItemRequest req = new CreateInventoryItemRequest("prod-123", "var-456", "SKU-IPH-100", 100, 10);
        when(itemRepository.findByVariantId("var-456")).thenReturn(Optional.of(sampleItem));

        assertThrows(IllegalArgumentException.class, () -> inventoryService.createItem(req));
        verify(itemRepository, never()).save(any());
    }

    @Test
    void testGetByVariantId_CacheHit() {
        InventoryResponse cached = InventoryResponse.fromEntity(sampleItem);
        when(cacheService.get("var-456")).thenReturn(cached);

        InventoryResponse res = inventoryService.getByVariantId("var-456");

        assertNotNull(res);
        assertEquals("var-456", res.getVariantId());
        verify(itemRepository, never()).findByVariantId(any());
    }

    @Test
    void testGetByVariantId_CacheMiss_FoundInDb() {
        when(cacheService.get("var-456")).thenReturn(null);
        when(itemRepository.findByVariantId("var-456")).thenReturn(Optional.of(sampleItem));

        InventoryResponse res = inventoryService.getByVariantId("var-456");

        assertNotNull(res);
        assertEquals("var-456", res.getVariantId());
        verify(cacheService).put(eq("var-456"), any(InventoryResponse.class));
    }

    @Test
    void testGetByVariantId_NotFound_ThrowsException() {
        when(cacheService.get("non-existent")).thenReturn(null);
        when(itemRepository.findByVariantId("non-existent")).thenReturn(Optional.empty());

        assertThrows(ResourceNotFoundException.class, () -> inventoryService.getByVariantId("non-existent"));
    }

    @Test
    void testAddStock_Success() {
        AddStockRequest addReq = new AddStockRequest(50, "Restock shipment arrival");
        when(itemRepository.findByVariantIdForUpdate("var-456")).thenReturn(Optional.of(sampleItem));
        when(itemRepository.save(any(InventoryItem.class))).thenAnswer(inv -> inv.getArgument(0));

        InventoryResponse res = inventoryService.addStock("var-456", addReq);

        assertNotNull(res);
        assertEquals(150, res.getTotalQuantity());
        assertEquals(150, res.getAvailableQuantity());
        verify(cacheService).evict("var-456");
        verify(eventProducer).publishEvent(eq("var-456"), eq("StockAdded"), any());
        verify(movementRepository).save(argThat(m -> m.getType() == MovementType.RECEIVE && m.getQuantity() == 50));
    }

    @Test
    void testAdjustStock_Success() {
        AdjustStockRequest adjustReq = new AdjustStockRequest();
        adjustReq.setTotalQuantity(8);
        adjustReq.setLowStockThreshold(10);

        when(itemRepository.findByVariantIdForUpdate("var-456")).thenReturn(Optional.of(sampleItem));
        when(itemRepository.save(any(InventoryItem.class))).thenAnswer(inv -> inv.getArgument(0));

        InventoryResponse res = inventoryService.adjustStock("var-456", adjustReq);

        assertNotNull(res);
        assertEquals(8, res.getTotalQuantity());
        assertEquals(8, res.getAvailableQuantity());
        assertEquals(InventoryStatus.LOW_STOCK, res.getStatus());
        verify(eventProducer).publishEvent(eq("var-456"), eq("StockAdjusted"), any());
        verify(eventProducer).publishEvent(eq("var-456"), eq("StockLow"), any());
    }

    @Test
    void testCheckStock_MultipleItems() {
        InventoryItem item1 = new InventoryItem("p1", "v1", "s1", 10, 2);
        InventoryItem item2 = new InventoryItem("p2", "v2", "s2", 1, 1);

        CheckStockRequest req = new CheckStockRequest(List.of(
                new CheckStockRequest.CheckItem("v1", 5),
                new CheckStockRequest.CheckItem("v2", 2)
        ));

        when(itemRepository.findByVariantIdIn(List.of("v1", "v2"))).thenReturn(List.of(item1, item2));

        CheckStockResponse res = inventoryService.checkStock(req);

        assertNotNull(res);
        assertFalse(res.isAvailable()); // v2 only has 1 available but 2 requested
        assertEquals(2, res.getItems().size());
        assertTrue(res.getItems().get(0).isInStock());
        assertFalse(res.getItems().get(1).isInStock());
    }
}
