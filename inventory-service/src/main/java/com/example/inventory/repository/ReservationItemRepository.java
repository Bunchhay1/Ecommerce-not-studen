package com.example.inventory.repository;

import com.example.inventory.entity.ReservationItem;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ReservationItemRepository extends JpaRepository<ReservationItem, String> {

    List<ReservationItem> findByReservationId(String reservationId);

    List<ReservationItem> findByVariantId(String variantId);
}
