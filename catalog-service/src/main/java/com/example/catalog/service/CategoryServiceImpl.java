package com.example.catalog.service;

import com.example.catalog.dto.CategoryRequest;
import com.example.catalog.dto.CategoryResponse;
import com.example.catalog.entity.Category;
import com.example.catalog.exception.DuplicateResourceException;
import com.example.catalog.exception.ResourceNotFoundException;
import com.example.catalog.kafka.CatalogEventProducer;
import com.example.catalog.repository.CategoryRepository;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@Transactional
public class CategoryServiceImpl implements CategoryService {

    private final CategoryRepository categoryRepository;
    private final CatalogEventProducer eventProducer;

    public CategoryServiceImpl(CategoryRepository categoryRepository, CatalogEventProducer eventProducer) {
        this.categoryRepository = categoryRepository;
        this.eventProducer = eventProducer;
    }

    @Override
    @Transactional(readOnly = true)
    @Cacheable(value = "categories", key = "'all'")
    public List<CategoryResponse> getAllCategories() {
        return categoryRepository.findAll().stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    @Cacheable(value = "categories", key = "'roots'")
    public List<CategoryResponse> getRootCategories() {
        return categoryRepository.findByParentIsNull().stream()
                .map(this::mapToResponseTree)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    @Cacheable(value = "categories", key = "#id")
    public CategoryResponse getCategoryById(String id) {
        Category category = categoryRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Category not found with id: " + id));
        return mapToResponseTree(category);
    }

    @Override
    @Transactional(readOnly = true)
    @Cacheable(value = "categories", key = "#slug")
    public CategoryResponse getCategoryBySlug(String slug) {
        Category category = categoryRepository.findBySlug(slug)
                .orElseThrow(() -> new ResourceNotFoundException("Category not found with slug: " + slug));
        return mapToResponseTree(category);
    }

    @Override
    @CacheEvict(value = "categories", allEntries = true)
    public CategoryResponse createCategory(CategoryRequest request) {
        String slug = (request.getSlug() != null && !request.getSlug().isBlank())
                ? request.getSlug()
                : generateSlug(request.getName());

        if (categoryRepository.existsBySlug(slug)) {
            throw new DuplicateResourceException("Category already exists with slug: " + slug);
        }

        Category parent = null;
        if (request.getParentId() != null && !request.getParentId().isBlank()) {
            parent = categoryRepository.findById(request.getParentId())
                    .orElseThrow(() -> new ResourceNotFoundException("Parent category not found with id: " + request.getParentId()));
        }

        Category category = Category.builder()
                .id(UUID.randomUUID().toString())
                .name(request.getName())
                .slug(slug)
                .description(request.getDescription())
                .parent(parent)
                .status(request.getStatus() != null ? request.getStatus() : "ACTIVE")
                .build();

        Category savedCategory = categoryRepository.save(category);
        eventProducer.publishEvent("CategoryCreated", "Category", savedCategory.getId(), mapToResponse(savedCategory));
        return mapToResponse(savedCategory);
    }

    @Override
    @CacheEvict(value = "categories", allEntries = true)
    public CategoryResponse updateCategory(String id, CategoryRequest request) {
        Category category = categoryRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Category not found with id: " + id));

        if (request.getSlug() != null && !request.getSlug().isBlank() && !request.getSlug().equals(category.getSlug())) {
            if (categoryRepository.existsBySlug(request.getSlug())) {
                throw new DuplicateResourceException("Category already exists with slug: " + request.getSlug());
            }
            category.setSlug(request.getSlug());
        }

        if (request.getParentId() != null && !request.getParentId().isBlank()) {
            if (request.getParentId().equals(id)) {
                throw new IllegalArgumentException("Category cannot be its own parent");
            }
            Category parent = categoryRepository.findById(request.getParentId())
                    .orElseThrow(() -> new ResourceNotFoundException("Parent category not found with id: " + request.getParentId()));
            category.setParent(parent);
        } else if (request.getParentId() != null && request.getParentId().isBlank()) {
            category.setParent(null);
        }

        category.setName(request.getName());
        category.setDescription(request.getDescription());
        if (request.getStatus() != null) {
            category.setStatus(request.getStatus());
        }

        Category updatedCategory = categoryRepository.save(category);
        eventProducer.publishEvent("CategoryUpdated", "Category", updatedCategory.getId(), mapToResponse(updatedCategory));
        return mapToResponse(updatedCategory);
    }

    @Override
    @CacheEvict(value = "categories", allEntries = true)
    public void deleteCategory(String id) {
        Category category = categoryRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Category not found with id: " + id));

        categoryRepository.delete(category);
        eventProducer.publishEvent("CategoryDeleted", "Category", id, null);
    }

    private CategoryResponse mapToResponse(Category category) {
        return CategoryResponse.builder()
                .id(category.getId())
                .parentId(category.getParent() != null ? category.getParent().getId() : null)
                .name(category.getName())
                .slug(category.getSlug())
                .description(category.getDescription())
                .status(category.getStatus())
                .createdAt(category.getCreatedAt())
                .updatedAt(category.getUpdatedAt())
                .build();
    }

    private CategoryResponse mapToResponseTree(Category category) {
        List<CategoryResponse> subCategories = category.getSubCategories() != null
                ? category.getSubCategories().stream().map(this::mapToResponseTree).collect(Collectors.toList())
                : List.of();

        return CategoryResponse.builder()
                .id(category.getId())
                .parentId(category.getParent() != null ? category.getParent().getId() : null)
                .name(category.getName())
                .slug(category.getSlug())
                .description(category.getDescription())
                .status(category.getStatus())
                .subCategories(subCategories)
                .createdAt(category.getCreatedAt())
                .updatedAt(category.getUpdatedAt())
                .build();
    }

    private String generateSlug(String name) {
        return name.toLowerCase()
                .replaceAll("[^a-z0-9\\s-]", "")
                .replaceAll("\\s+", "-")
                .replaceAll("-+", "-");
    }
}
