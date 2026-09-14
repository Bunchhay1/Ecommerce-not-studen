package com.example.inventory.repository;

import com.example.inventory.entity.WarehouseStock;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface WarehouseStockRepository extends JpaRepository<WarehouseStock, String> {

    Optional<WarehouseStock> findByWarehouseIdAndVariantId(String warehouseId, String variantId);

    List<WarehouseStock> findByWarehouseId(String warehouseId);

    List<WarehouseStock> findByVariantId(String variantId);
}
