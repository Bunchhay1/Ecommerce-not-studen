package com.example.catalog.service;

import com.example.catalog.dto.BrandRequest;
import com.example.catalog.dto.BrandResponse;

import java.util.List;

public interface BrandService {
    List<BrandResponse> getAllBrands();
    BrandResponse getBrandById(String id);
    BrandResponse getBrandBySlug(String slug);
    BrandResponse createBrand(BrandRequest request);
    BrandResponse updateBrand(String id, BrandRequest request);
    void deleteBrand(String id);
}
