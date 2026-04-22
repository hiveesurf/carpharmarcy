package com.carnalysys.repo;

import com.carnalysys.domain.OrderEntity;
import com.carnalysys.domain.PaymentStatus;
import java.time.Instant;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import jakarta.persistence.LockModeType;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface OrderRepository extends JpaRepository<OrderEntity, String> {

  List<OrderEntity> findByUser_IdOrderByPlacedAtDesc(UUID userId);
  Page<OrderEntity> findByUser_IdOrderByPlacedAtDesc(UUID userId, Pageable pageable);

  Optional<OrderEntity> findByIdAndUser_Id(String id, UUID userId);

  @Lock(LockModeType.PESSIMISTIC_WRITE)
  @Query("select o from OrderEntity o where o.id = :id")
  Optional<OrderEntity> findByIdForUpdate(@Param("id") String id);

  List<OrderEntity> findByUser_PhoneE164OrderByPlacedAtDesc(String phoneE164);
  Page<OrderEntity> findByUser_PhoneE164OrderByPlacedAtDesc(String phoneE164, Pageable pageable);

  List<OrderEntity> findByPaymentStatusAndPlacedAtBeforeOrderByPlacedAtAsc(
      PaymentStatus paymentStatus, Instant placedAt);

  List<OrderEntity> findByAssignedDeliveryAdminEmailOrderByPlacedAtDesc(String assignedDeliveryAdminEmail);

  Page<OrderEntity> findAllByOrderByPlacedAtDesc(Pageable pageable);

}
