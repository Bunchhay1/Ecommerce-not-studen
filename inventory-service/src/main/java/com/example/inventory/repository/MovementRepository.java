package com.example.inventory.repository;

import com.example.inventory.entity.InventoryMovement;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface MovementRepository extends JpaRepository<InventoryMovement, String> {

    List<InventoryMovement> findByInventoryId(String inventoryId);

    List<InventoryMovement> findByVariantId(String variantId);

    Page<InventoryMovement> findByVariantIdOrderByCreatedAtDesc(String variantId, Pageable pageable);
}
