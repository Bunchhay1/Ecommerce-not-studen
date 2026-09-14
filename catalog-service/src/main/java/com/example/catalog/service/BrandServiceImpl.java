package com.example.catalog.service;

import com.example.catalog.dto.BrandRequest;
import com.example.catalog.dto.BrandResponse;
import com.example.catalog.entity.Brand;
import com.example.catalog.exception.DuplicateResourceException;
import com.example.catalog.exception.ResourceNotFoundException;
import com.example.catalog.kafka.CatalogEventProducer;
import com.example.catalog.repository.BrandRepository;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@Transactional
public class BrandServiceImpl implements BrandService {

    private final BrandRepository brandRepository;
    private final CatalogEventProducer eventProducer;

    public BrandServiceImpl(BrandRepository brandRepository, CatalogEventProducer eventProducer) {
        this.brandRepository = brandRepository;
        this.eventProducer = eventProducer;
    }

    @Override
    @Transactional(readOnly = true)
    @Cacheable(value = "brands", key = "'all'")
    public List<BrandResponse> getAllBrands() {
        return brandRepository.findAll().stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    @Cacheable(value = "brands", key = "#id")
    public BrandResponse getBrandById(String id) {
        Brand brand = brandRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Brand not found with id: " + id));
        return mapToResponse(brand);
    }

    @Override
    @Transactional(readOnly = true)
    @Cacheable(value = "brands", key = "#slug")
    public BrandResponse getBrandBySlug(String slug) {
        Brand brand = brandRepository.findBySlug(slug)
                .orElseThrow(() -> new ResourceNotFoundException("Brand not found with slug: " + slug));
        return mapToResponse(brand);
    }

    @Override
    @CacheEvict(value = "brands", allEntries = true)
    public BrandResponse createBrand(BrandRequest request) {
        String slug = (request.getSlug() != null && !request.getSlug().isBlank())
                ? request.getSlug()
                : generateSlug(request.getName());

        if (brandRepository.existsBySlug(slug)) {
            throw new DuplicateResourceException("Brand already exists with slug: " + slug);
        }

        Brand brand = Brand.builder()
                .id(UUID.randomUUID().toString())
                .name(request.getName())
                .slug(slug)
                .description(request.getDescription())
                .logoUrl(request.getLogoUrl())
                .websiteUrl(request.getWebsiteUrl())
                .build();

        Brand savedBrand = brandRepository.save(brand);
        eventProducer.publishEvent("BrandCreated", "Brand", savedBrand.getId(), mapToResponse(savedBrand));
        return mapToResponse(savedBrand);
    }

    @Override
    @CacheEvict(value = "brands", allEntries = true)
    public BrandResponse updateBrand(String id, BrandRequest request) {
        Brand brand = brandRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Brand not found with id: " + id));

        if (request.getSlug() != null && !request.getSlug().isBlank() && !request.getSlug().equals(brand.getSlug())) {
            if (brandRepository.existsBySlug(request.getSlug())) {
                throw new DuplicateResourceException("Brand already exists with slug: " + request.getSlug());
            }
            brand.setSlug(request.getSlug());
        }

        brand.setName(request.getName());
        brand.setDescription(request.getDescription());
        brand.setLogoUrl(request.getLogoUrl());
        brand.setWebsiteUrl(request.getWebsiteUrl());

        Brand updatedBrand = brandRepository.save(brand);
        eventProducer.publishEvent("BrandUpdated", "Brand", updatedBrand.getId(), mapToResponse(updatedBrand));
        return mapToResponse(updatedBrand);
    }

    @Override
    @CacheEvict(value = "brands", allEntries = true)
    public void deleteBrand(String id) {
        Brand brand = brandRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Brand not found with id: " + id));

        brandRepository.delete(brand);
        eventProducer.publishEvent("BrandDeleted", "Brand", id, null);
    }

    private BrandResponse mapToResponse(Brand brand) {
        return BrandResponse.builder()
                .id(brand.getId())
                .name(brand.getName())
                .slug(brand.getSlug())
                .description(brand.getDescription())
                .logoUrl(brand.getLogoUrl())
                .websiteUrl(brand.getWebsiteUrl())
                .createdAt(brand.getCreatedAt())
                .updatedAt(brand.getUpdatedAt())
                .build();
    }

    private String generateSlug(String name) {
        return name.toLowerCase()
                .replaceAll("[^a-z0-9\\s-]", "")
                .replaceAll("\\s+", "-")
                .replaceAll("-+", "-");
    }
}
