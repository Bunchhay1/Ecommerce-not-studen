package com.example.inventory.repository;

import com.example.inventory.entity.InventoryReservation;
import com.example.inventory.enums.ReservationStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.OffsetDateTime;
import java.util.List;
import java.util.Optional;

@Repository
public interface ReservationRepository extends JpaRepository<InventoryReservation, String> {

    Optional<InventoryReservation> findByIdempotencyKey(String idempotencyKey);

    List<InventoryReservation> findByOrderId(String orderId);

    List<InventoryReservation> findByStatus(ReservationStatus status);

    List<InventoryReservation> findByStatusAndExpiresAtBefore(ReservationStatus status, OffsetDateTime time);
}
