package com.carnalysys.repo;

import com.carnalysys.domain.PaymentTransactionEntity;
import com.carnalysys.domain.PaymentTransactionStatus;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;

public interface PaymentTransactionRepository extends JpaRepository<PaymentTransactionEntity, UUID> {
  List<PaymentTransactionEntity> findByOrder_IdOrderByCreatedAtDesc(String orderId);

  Optional<PaymentTransactionEntity> findByProviderAndProviderOrderId(String provider, String providerOrderId);

  Optional<PaymentTransactionEntity> findByProviderAndProviderPaymentId(
      String provider, String providerPaymentId);

  List<PaymentTransactionEntity> findByStatusOrderByCreatedAtAsc(PaymentTransactionStatus status);
}
