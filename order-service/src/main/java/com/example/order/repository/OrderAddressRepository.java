package com.example.order.repository;

import com.example.order.entity.OrderAddress;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface OrderAddressRepository extends JpaRepository<OrderAddress, String> {
    List<OrderAddress> findByOrderId(String orderId);
}
