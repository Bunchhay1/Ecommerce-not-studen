package com.example.catalog.repository;

import com.example.catalog.entity.Product;
import com.example.catalog.entity.ProductStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface ProductRepository extends JpaRepository<Product, String>, JpaSpecificationExecutor<Product> {
    Optional<Product> findBySlug(String slug);
    boolean existsBySlug(String slug);

    Page<Product> findByStatus(ProductStatus status, Pageable pageable);
    Page<Product> findByCategoryId(String categoryId, Pageable pageable);
    Page<Product> findByBrandId(String brandId, Pageable pageable);

    @EntityGraph(attributePaths = {"brand", "category", "variants"})
    Optional<Product> findWithDetailsById(String id);

    @EntityGraph(attributePaths = {"brand", "category", "variants"})
    Optional<Product> findWithDetailsBySlug(String slug);
}
