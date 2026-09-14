package com.example.inventory.repository;

import com.example.inventory.entity.InventoryItem;
import jakarta.persistence.LockModeType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface InventoryItemRepository extends JpaRepository<InventoryItem, String> {

    Optional<InventoryItem> findByVariantId(String variantId);

    Optional<InventoryItem> findBySku(String sku);

    List<InventoryItem> findByProductId(String productId);

    List<InventoryItem> findByVariantIdIn(List<String> variantIds);

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("SELECT i FROM InventoryItem i WHERE i.variantId = :variantId")
    Optional<InventoryItem> findByVariantIdForUpdate(@Param("variantId") String variantId);

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("SELECT i FROM InventoryItem i WHERE i.variantId IN :variantIds")
    List<InventoryItem> findByVariantIdInForUpdate(@Param("variantIds") List<String> variantIds);
}
