package com.example.catalog.service;

import com.example.catalog.dto.CategoryRequest;
import com.example.catalog.dto.CategoryResponse;

import java.util.List;

public interface CategoryService {
    List<CategoryResponse> getAllCategories();
    List<CategoryResponse> getRootCategories();
    CategoryResponse getCategoryById(String id);
    CategoryResponse getCategoryBySlug(String slug);
    CategoryResponse createCategory(CategoryRequest request);
    CategoryResponse updateCategory(String id, CategoryRequest request);
    void deleteCategory(String id);
}
