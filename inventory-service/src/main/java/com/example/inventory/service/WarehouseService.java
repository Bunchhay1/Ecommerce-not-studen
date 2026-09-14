package com.example.inventory.service;

import com.example.inventory.dto.WarehouseDto;
import com.example.inventory.entity.Warehouse;
import com.example.inventory.entity.WarehouseStock;
import com.example.inventory.exception.ResourceNotFoundException;
import com.example.inventory.repository.WarehouseRepository;
import com.example.inventory.repository.WarehouseStockRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
public class WarehouseService {

    private static final Logger log = LoggerFactory.getLogger(WarehouseService.class);

    private final WarehouseRepository warehouseRepository;
    private final WarehouseStockRepository stockRepository;

    public WarehouseService(WarehouseRepository warehouseRepository, WarehouseStockRepository stockRepository) {
        this.warehouseRepository = warehouseRepository;
        this.stockRepository = stockRepository;
    }

    @Transactional
    public WarehouseDto createWarehouse(WarehouseDto dto) {
        warehouseRepository.findByCode(dto.getCode()).ifPresent(w -> {
            throw new IllegalArgumentException("Warehouse already exists with code: " + dto.getCode());
        });

        Warehouse warehouse = dto.toEntity();
        Warehouse saved = warehouseRepository.save(warehouse);
        log.info("Created warehouse with id '{}' and code '{}'", saved.getId(), saved.getCode());
        return WarehouseDto.fromEntity(saved);
    }

    @Transactional(readOnly = true)
    public List<WarehouseDto> getAllWarehouses() {
        return warehouseRepository.findAll().stream()
                .map(WarehouseDto::fromEntity)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public WarehouseDto getWarehouseById(String id) {
        Warehouse warehouse = warehouseRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Warehouse not found with id: " + id));
        return WarehouseDto.fromEntity(warehouse);
    }

    @Transactional(readOnly = true)
    public WarehouseDto getWarehouseByCode(String code) {
        Warehouse warehouse = warehouseRepository.findByCode(code)
                .orElseThrow(() -> new ResourceNotFoundException("Warehouse not found with code: " + code));
        return WarehouseDto.fromEntity(warehouse);
    }

    @Transactional(readOnly = true)
    public List<WarehouseStock> getStockInWarehouse(String warehouseId) {
        getWarehouseById(warehouseId); // ensure existence
        return stockRepository.findByWarehouseId(warehouseId);
    }

    @Transactional
    public WarehouseStock setStockInWarehouse(String warehouseId, String variantId, int quantity) {
        getWarehouseById(warehouseId);

        WarehouseStock stock = stockRepository.findByWarehouseIdAndVariantId(warehouseId, variantId)
                .orElse(new WarehouseStock(warehouseId, variantId, quantity));

        stock.setQuantity(quantity);
        return stockRepository.save(stock);
    }
}
