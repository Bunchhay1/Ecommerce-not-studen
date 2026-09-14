package com.example.order.service;

import com.example.order.dto.OrderResponse;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.stereotype.Service;

import java.time.Duration;

@Service
public class OrderCacheService {

    private static final Logger log = LoggerFactory.getLogger(OrderCacheService.class);
    private static final String CACHE_PREFIX = "order:";

    private final StringRedisTemplate redisTemplate;
    private final ObjectMapper objectMapper;
    private final long ttlSeconds;

    public OrderCacheService(StringRedisTemplate redisTemplate,
                             ObjectMapper objectMapper,
                             @Value("${app.cache.order-ttl-seconds:600}") long ttlSeconds) {
        this.redisTemplate = redisTemplate;
        this.objectMapper = objectMapper;
        this.ttlSeconds = ttlSeconds;
    }

    public OrderResponse get(String orderId) {
        try {
            String key = CACHE_PREFIX + orderId;
            String cached = redisTemplate.opsForValue().get(key);
            if (cached != null) {
                log.debug("Redis cache HIT for order '{}'", orderId);
                return objectMapper.readValue(cached, OrderResponse.class);
            }
        } catch (Exception e) {
            log.warn("Redis GET failed for order '{}': {}", orderId, e.getMessage());
        }
        return null;
    }

    public void put(String orderId, OrderResponse response) {
        try {
            String key = CACHE_PREFIX + orderId;
            String json = objectMapper.writeValueAsString(response);
            redisTemplate.opsForValue().set(key, json, Duration.ofSeconds(ttlSeconds));
            log.debug("Redis cache SET for order '{}'", orderId);
        } catch (Exception e) {
            log.warn("Redis SET failed for order '{}': {}", orderId, e.getMessage());
        }
    }

    public void evict(String orderId) {
        try {
            String key = CACHE_PREFIX + orderId;
            redisTemplate.delete(key);
            log.debug("Redis cache EVICTED for order '{}'", orderId);
        } catch (Exception e) {
            log.warn("Redis EVICT failed for order '{}': {}", orderId, e.getMessage());
        }
    }
}
