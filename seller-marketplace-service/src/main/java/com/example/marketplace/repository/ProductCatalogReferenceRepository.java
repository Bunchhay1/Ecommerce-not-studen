package com.example.marketplace.repository;

import com.example.marketplace.entity.ProductCatalogReference;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface ProductCatalogReferenceRepository extends JpaRepository<ProductCatalogReference, String> {
}
