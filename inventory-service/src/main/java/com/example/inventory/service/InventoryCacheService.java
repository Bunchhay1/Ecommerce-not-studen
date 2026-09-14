package com.example.inventory.service;

import com.example.inventory.dto.InventoryResponse;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.stereotype.Service;

import java.time.Duration;

@Service
public class InventoryCacheService {

    private static final Logger log = LoggerFactory.getLogger(InventoryCacheService.class);
    private static final String CACHE_PREFIX = "inventory:variant:";

    private final StringRedisTemplate redisTemplate;
    private final ObjectMapper objectMapper;
    private final long ttlSeconds;

    public InventoryCacheService(StringRedisTemplate redisTemplate,
                                 ObjectMapper objectMapper,
                                 @Value("${app.cache.inventory-ttl-seconds:300}") long ttlSeconds) {
        this.redisTemplate = redisTemplate;
        this.objectMapper = objectMapper;
        this.ttlSeconds = ttlSeconds;
    }

    public InventoryResponse get(String variantId) {
        try {
            String key = CACHE_PREFIX + variantId;
            String cached = redisTemplate.opsForValue().get(key);
            if (cached != null) {
                log.debug("Redis cache HIT for key '{}'", key);
                return objectMapper.readValue(cached, InventoryResponse.class);
            }
        } catch (Exception e) {
            log.warn("Redis GET failed for variant '{}': {}", variantId, e.getMessage());
        }
        return null;
    }

    public void put(String variantId, InventoryResponse response) {
        try {
            String key = CACHE_PREFIX + variantId;
            String json = objectMapper.writeValueAsString(response);
            redisTemplate.opsForValue().set(key, json, Duration.ofSeconds(ttlSeconds));
            log.debug("Redis cache SET for key '{}'", key);
        } catch (Exception e) {
            log.warn("Redis SET failed for variant '{}': {}", variantId, e.getMessage());
        }
    }

    public void evict(String variantId) {
        try {
            String key = CACHE_PREFIX + variantId;
            redisTemplate.delete(key);
            log.debug("Redis cache EVICTED for key '{}'", key);
        } catch (Exception e) {
            log.warn("Redis EVICT failed for variant '{}': {}", variantId, e.getMessage());
        }
    }
}
