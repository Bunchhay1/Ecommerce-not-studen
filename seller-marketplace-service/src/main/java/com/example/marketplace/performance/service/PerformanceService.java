package com.example.marketplace.performance.service;

import com.example.marketplace.cache.RedisCacheService;
import com.example.marketplace.dto.SellerPerformanceResponse;
import com.example.marketplace.entity.SellerPerformance;
import com.example.marketplace.repository.SellerPerformanceRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.Duration;
import java.util.UUID;

@Service
public class PerformanceService {

    private final SellerPerformanceRepository performanceRepository;
    private final RedisCacheService cacheService;

    public PerformanceService(SellerPerformanceRepository performanceRepository,
                              RedisCacheService cacheService) {
        this.performanceRepository = performanceRepository;
        this.cacheService = cacheService;
    }

    @Transactional(readOnly = true)
    public SellerPerformanceResponse getPerformance(UUID sellerId) {
        return cacheService.get("seller:performance:" + sellerId, SellerPerformanceResponse.class)
                .orElseGet(() -> {
                    SellerPerformance perf = performanceRepository.findBySellerId(sellerId)
                            .orElseGet(() -> {
                                SellerPerformance np = new SellerPerformance();
                                np.setSellerId(sellerId);
                                return performanceRepository.save(np);
                            });
                    SellerPerformanceResponse response = SellerPerformanceResponse.fromEntity(perf);
                    cacheService.set("seller:performance:" + sellerId, response, Duration.ofMinutes(30));
                    return response;
                });
    }

    @Transactional
    public void recordOrderCompleted(UUID sellerId) {
        SellerPerformance perf = getOrCreate(sellerId);
        perf.setTotalOrders(perf.getTotalOrders() + 1);
        perf.setCompletedOrders(perf.getCompletedOrders() + 1);
        performanceRepository.save(perf);
        cacheService.delete("seller:performance:" + sellerId);
    }

    @Transactional
    public void recordOrderCancelled(UUID sellerId) {
        SellerPerformance perf = getOrCreate(sellerId);
        perf.setTotalOrders(perf.getTotalOrders() + 1);
        perf.setCancelledOrders(perf.getCancelledOrders() + 1);
        performanceRepository.save(perf);
        cacheService.delete("seller:performance:" + sellerId);
    }

    @Transactional
    public void updateRating(UUID sellerId, BigDecimal rating) {
        SellerPerformance perf = getOrCreate(sellerId);
        perf.setAverageRating(rating);
        performanceRepository.save(perf);
        cacheService.delete("seller:performance:" + sellerId);
    }

    private SellerPerformance getOrCreate(UUID sellerId) {
        return performanceRepository.findBySellerId(sellerId)
                .orElseGet(() -> {
                    SellerPerformance np = new SellerPerformance();
                    np.setSellerId(sellerId);
                    return performanceRepository.save(np);
                });
    }
}
