package com.example.catalog.service;

import com.example.catalog.dto.*;
import com.example.catalog.entity.*;
import com.example.catalog.exception.DuplicateResourceException;
import com.example.catalog.exception.ResourceNotFoundException;
import com.example.catalog.kafka.CatalogEventProducer;
import com.example.catalog.repository.*;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@Transactional
public class ProductServiceImpl implements ProductService {

    private final ProductRepository productRepository;
    private final CategoryRepository categoryRepository;
    private final BrandRepository brandRepository;
    private final ProductVariantRepository variantRepository;
    private final CatalogEventProducer eventProducer;

    public ProductServiceImpl(ProductRepository productRepository,
                              CategoryRepository categoryRepository,
                              BrandRepository brandRepository,
                              ProductVariantRepository variantRepository,
                              CatalogEventProducer eventProducer) {
        this.productRepository = productRepository;
        this.categoryRepository = categoryRepository;
        this.brandRepository = brandRepository;
        this.variantRepository = variantRepository;
        this.eventProducer = eventProducer;
    }

    @Override
    @Transactional(readOnly = true)
    public Page<ProductResponse> getProducts(ProductStatus status, String categoryId, String brandId, Pageable pageable) {
        Specification<Product> spec = Specification.where(null);

        if (status != null) {
            spec = spec.and((root, query, cb) -> cb.equal(root.get("status"), status));
        }
        if (categoryId != null && !categoryId.isBlank()) {
            spec = spec.and((root, query, cb) -> cb.equal(root.get("category").get("id"), categoryId));
        }
        if (brandId != null && !brandId.isBlank()) {
            spec = spec.and((root, query, cb) -> cb.equal(root.get("brand").get("id"), brandId));
        }

        return productRepository.findAll(spec, pageable).map(this::mapToResponse);
    }

    @Override
    @Transactional(readOnly = true)
    @Cacheable(value = "products", key = "#id")
    public ProductResponse getProductById(String id) {
        Product product = productRepository.findWithDetailsById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Product not found with id: " + id));
        return mapToResponse(product);
    }

    @Override
    @Transactional(readOnly = true)
    @Cacheable(value = "products", key = "#slug")
    public ProductResponse getProductBySlug(String slug) {
        Product product = productRepository.findWithDetailsBySlug(slug)
                .orElseThrow(() -> new ResourceNotFoundException("Product not found with slug: " + slug));
        return mapToResponse(product);
    }

    @Override
    @CacheEvict(value = "products", allEntries = true)
    public ProductResponse createProduct(ProductRequest request) {
        String slug = (request.getSlug() != null && !request.getSlug().isBlank())
                ? request.getSlug()
                : generateSlug(request.getName());

        if (productRepository.existsBySlug(slug)) {
            throw new DuplicateResourceException("Product already exists with slug: " + slug);
        }

        Brand brand = null;
        if (request.getBrandId() != null && !request.getBrandId().isBlank()) {
            brand = brandRepository.findById(request.getBrandId())
                    .orElseThrow(() -> new ResourceNotFoundException("Brand not found with id: " + request.getBrandId()));
        }

        Category category = null;
        if (request.getCategoryId() != null && !request.getCategoryId().isBlank()) {
            category = categoryRepository.findById(request.getCategoryId())
                    .orElseThrow(() -> new ResourceNotFoundException("Category not found with id: " + request.getCategoryId()));
        }

        Product product = Product.builder()
                .id(UUID.randomUUID().toString())
                .name(request.getName())
                .slug(slug)
                .description(request.getDescription())
                .brand(brand)
                .category(category)
                .status(request.getStatus() != null ? request.getStatus() : ProductStatus.DRAFT)
                .build();

        // Add Attributes
        if (request.getAttributes() != null) {
            List<ProductAttribute> attributes = request.getAttributes().stream()
                    .map(attrReq -> ProductAttribute.builder()
                            .id(UUID.randomUUID().toString())
                            .product(product)
                            .name(attrReq.getName())
                            .value(attrReq.getValue())
                            .build())
                    .collect(Collectors.toList());
            product.setAttributes(attributes);
        }

        // Add Images
        if (request.getImages() != null) {
            List<ProductImage> images = request.getImages().stream()
                    .map(imgReq -> ProductImage.builder()
                            .id(UUID.randomUUID().toString())
                            .product(product)
                            .url(imgReq.getUrl())
                            .altText(imgReq.getAltText())
                            .sortOrder(imgReq.getSortOrder() != null ? imgReq.getSortOrder() : 0)
                            .isPrimary(imgReq.getIsPrimary() != null ? imgReq.getIsPrimary() : false)
                            .build())
                    .collect(Collectors.toList());
            product.setImages(images);
        }

        // Add Variants
        if (request.getVariants() != null) {
            List<ProductVariant> variants = new ArrayList<>();
            for (ProductVariantRequest varReq : request.getVariants()) {
                if (variantRepository.existsBySku(varReq.getSku())) {
                    throw new DuplicateResourceException("Variant already exists with SKU: " + varReq.getSku());
                }
                ProductVariant variant = ProductVariant.builder()
                        .id(UUID.randomUUID().toString())
                        .product(product)
                        .sku(varReq.getSku())
                        .status(varReq.getStatus() != null ? varReq.getStatus() : "ACTIVE")
                        .build();

                if (varReq.getAttributes() != null) {
                    List<VariantAttribute> varAttrs = varReq.getAttributes().entrySet().stream()
                            .map(entry -> VariantAttribute.builder()
                                    .id(UUID.randomUUID().toString())
                                    .variant(variant)
                                    .name(entry.getKey())
                                    .value(entry.getValue())
                                    .build())
                            .collect(Collectors.toList());
                    variant.setAttributes(varAttrs);
                }
                variants.add(variant);
            }
            product.setVariants(variants);
        }

        Product savedProduct = productRepository.save(product);
        eventProducer.publishEvent("ProductCreated", "Product", savedProduct.getId(), mapToResponse(savedProduct));
        return mapToResponse(savedProduct);
    }

    @Override
    @CacheEvict(value = "products", allEntries = true)
    public ProductResponse updateProduct(String id, ProductRequest request) {
        Product product = productRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Product not found with id: " + id));

        if (request.getSlug() != null && !request.getSlug().isBlank() && !request.getSlug().equals(product.getSlug())) {
            if (productRepository.existsBySlug(request.getSlug())) {
                throw new DuplicateResourceException("Product already exists with slug: " + request.getSlug());
            }
            product.setSlug(request.getSlug());
        }

        if (request.getBrandId() != null) {
            if (!request.getBrandId().isBlank()) {
                Brand brand = brandRepository.findById(request.getBrandId())
                        .orElseThrow(() -> new ResourceNotFoundException("Brand not found with id: " + request.getBrandId()));
                product.setBrand(brand);
            } else {
                product.setBrand(null);
            }
        }

        if (request.getCategoryId() != null) {
            if (!request.getCategoryId().isBlank()) {
                Category category = categoryRepository.findById(request.getCategoryId())
                        .orElseThrow(() -> new ResourceNotFoundException("Category not found with id: " + request.getCategoryId()));
                product.setCategory(category);
            } else {
                product.setCategory(null);
            }
        }

        product.setName(request.getName());
        product.setDescription(request.getDescription());
        if (request.getStatus() != null) {
            product.setStatus(request.getStatus());
        }

        Product updatedProduct = productRepository.save(product);
        eventProducer.publishEvent("ProductUpdated", "Product", updatedProduct.getId(), mapToResponse(updatedProduct));
        return mapToResponse(updatedProduct);
    }

    @Override
    @CacheEvict(value = "products", allEntries = true)
    public ProductResponse updateProductStatus(String id, ProductStatus status) {
        Product product = productRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Product not found with id: " + id));

        product.setStatus(status);
        Product updatedProduct = productRepository.save(product);
        eventProducer.publishEvent("ProductStatusChanged", "Product", id, mapToResponse(updatedProduct));
        return mapToResponse(updatedProduct);
    }

    @Override
    @CacheEvict(value = "products", allEntries = true)
    public void deleteProduct(String id) {
        Product product = productRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Product not found with id: " + id));

        productRepository.delete(product);
        eventProducer.publishEvent("ProductDeleted", "Product", id, null);
    }

    @Override
    @Transactional(readOnly = true)
    public List<ProductVariantResponse> getProductVariants(String productId) {
        return variantRepository.findByProductId(productId).stream()
                .map(this::mapVariantToResponse)
                .collect(Collectors.toList());
    }

    @Override
    @CacheEvict(value = "products", allEntries = true)
    public ProductVariantResponse addProductVariant(String productId, ProductVariantRequest request) {
        Product product = productRepository.findById(productId)
                .orElseThrow(() -> new ResourceNotFoundException("Product not found with id: " + productId));

        if (variantRepository.existsBySku(request.getSku())) {
            throw new DuplicateResourceException("Variant already exists with SKU: " + request.getSku());
        }

        ProductVariant variant = ProductVariant.builder()
                .id(UUID.randomUUID().toString())
                .product(product)
                .sku(request.getSku())
                .status(request.getStatus() != null ? request.getStatus() : "ACTIVE")
                .build();

        if (request.getAttributes() != null) {
            List<VariantAttribute> varAttrs = request.getAttributes().entrySet().stream()
                    .map(entry -> VariantAttribute.builder()
                            .id(UUID.randomUUID().toString())
                            .variant(variant)
                            .name(entry.getKey())
                            .value(entry.getValue())
                            .build())
                    .collect(Collectors.toList());
            variant.setAttributes(varAttrs);
        }

        ProductVariant savedVariant = variantRepository.save(variant);
        eventProducer.publishEvent("VariantCreated", "ProductVariant", savedVariant.getId(), mapVariantToResponse(savedVariant));
        return mapVariantToResponse(savedVariant);
    }

    @Override
    @CacheEvict(value = "products", allEntries = true)
    public ProductVariantResponse updateVariant(String variantId, ProductVariantRequest request) {
        ProductVariant variant = variantRepository.findById(variantId)
                .orElseThrow(() -> new ResourceNotFoundException("Variant not found with id: " + variantId));

        if (request.getSku() != null && !request.getSku().equals(variant.getSku())) {
            if (variantRepository.existsBySku(request.getSku())) {
                throw new DuplicateResourceException("Variant already exists with SKU: " + request.getSku());
            }
            variant.setSku(request.getSku());
        }

        if (request.getStatus() != null) {
            variant.setStatus(request.getStatus());
        }

        if (request.getAttributes() != null) {
            variant.getAttributes().clear();
            List<VariantAttribute> varAttrs = request.getAttributes().entrySet().stream()
                    .map(entry -> VariantAttribute.builder()
                            .id(UUID.randomUUID().toString())
                            .variant(variant)
                            .name(entry.getKey())
                            .value(entry.getValue())
                            .build())
                    .collect(Collectors.toList());
            variant.getAttributes().addAll(varAttrs);
        }

        ProductVariant updatedVariant = variantRepository.save(variant);
        eventProducer.publishEvent("VariantUpdated", "ProductVariant", updatedVariant.getId(), mapVariantToResponse(updatedVariant));
        return mapVariantToResponse(updatedVariant);
    }

    @Override
    @CacheEvict(value = "products", allEntries = true)
    public void deleteVariant(String variantId) {
        ProductVariant variant = variantRepository.findById(variantId)
                .orElseThrow(() -> new ResourceNotFoundException("Variant not found with id: " + variantId));

        variantRepository.delete(variant);
        eventProducer.publishEvent("VariantDeleted", "ProductVariant", variantId, null);
    }

    private ProductResponse mapToResponse(Product product) {
        BrandResponse brandResponse = product.getBrand() != null
                ? BrandResponse.builder()
                .id(product.getBrand().getId())
                .name(product.getBrand().getName())
                .slug(product.getBrand().getSlug())
                .description(product.getBrand().getDescription())
                .logoUrl(product.getBrand().getLogoUrl())
                .websiteUrl(product.getBrand().getWebsiteUrl())
                .createdAt(product.getBrand().getCreatedAt())
                .updatedAt(product.getBrand().getUpdatedAt())
                .build()
                : null;

        CategoryResponse categoryResponse = product.getCategory() != null
                ? CategoryResponse.builder()
                .id(product.getCategory().getId())
                .parentId(product.getCategory().getParent() != null ? product.getCategory().getParent().getId() : null)
                .name(product.getCategory().getName())
                .slug(product.getCategory().getSlug())
                .description(product.getCategory().getDescription())
                .status(product.getCategory().getStatus())
                .createdAt(product.getCategory().getCreatedAt())
                .updatedAt(product.getCategory().getUpdatedAt())
                .build()
                : null;

        List<ProductAttributeResponse> attributeResponses = product.getAttributes() != null
                ? product.getAttributes().stream()
                .map(attr -> ProductAttributeResponse.builder()
                        .id(attr.getId())
                        .name(attr.getName())
                        .value(attr.getValue())
                        .build())
                .collect(Collectors.toList())
                : List.of();

        List<ProductImageResponse> imageResponses = product.getImages() != null
                ? product.getImages().stream()
                .map(img -> ProductImageResponse.builder()
                        .id(img.getId())
                        .url(img.getUrl())
                        .altText(img.getAltText())
                        .sortOrder(img.getSortOrder())
                        .isPrimary(img.getIsPrimary())
                        .build())
                .collect(Collectors.toList())
                : List.of();

        List<ProductVariantResponse> variantResponses = product.getVariants() != null
                ? product.getVariants().stream()
                .map(this::mapVariantToResponse)
                .collect(Collectors.toList())
                : List.of();

        return ProductResponse.builder()
                .id(product.getId())
                .brand(brandResponse)
                .category(categoryResponse)
                .name(product.getName())
                .slug(product.getSlug())
                .description(product.getDescription())
                .status(product.getStatus())
                .attributes(attributeResponses)
                .images(imageResponses)
                .variants(variantResponses)
                .createdAt(product.getCreatedAt())
                .updatedAt(product.getUpdatedAt())
                .build();
    }

    private ProductVariantResponse mapVariantToResponse(ProductVariant variant) {
        java.util.Map<String, String> attributesMap = new java.util.HashMap<>();
        if (variant.getAttributes() != null) {
            for (VariantAttribute attr : variant.getAttributes()) {
                attributesMap.put(attr.getName(), attr.getValue());
            }
        }

        return ProductVariantResponse.builder()
                .id(variant.getId())
                .productId(variant.getProduct() != null ? variant.getProduct().getId() : null)
                .sku(variant.getSku())
                .status(variant.getStatus())
                .attributes(attributesMap)
                .createdAt(variant.getCreatedAt())
                .updatedAt(variant.getUpdatedAt())
                .build();
    }

    private String generateSlug(String name) {
        return name.toLowerCase()
                .replaceAll("[^a-z0-9\\s-]", "")
                .replaceAll("\\s+", "-")
                .replaceAll("-+", "-");
    }
}
