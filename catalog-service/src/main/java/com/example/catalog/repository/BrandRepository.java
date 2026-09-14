package com.example.catalog.repository;

import com.example.catalog.entity.Brand;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface BrandRepository extends JpaRepository<Brand, String> {
    Optional<Brand> findBySlug(String slug);
    boolean existsBySlug(String slug);
}
