package com.carnalysys.repo;

import com.carnalysys.domain.PaymentEventEntity;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;

public interface PaymentEventRepository extends JpaRepository<PaymentEventEntity, UUID> {
  Optional<PaymentEventEntity> findByProviderAndProviderEventId(String provider, String providerEventId);

  Optional<PaymentEventEntity> findByProviderAndProviderEventIdAndTransaction_Id(
      String provider, String providerEventId, UUID transactionId);
}
