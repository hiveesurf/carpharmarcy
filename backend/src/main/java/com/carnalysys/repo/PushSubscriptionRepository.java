package com.carnalysys.repo;

import com.carnalysys.domain.PushSubscriptionEntity;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;

public interface PushSubscriptionRepository extends JpaRepository<PushSubscriptionEntity, UUID> {

  Optional<PushSubscriptionEntity> findByRecipientTypeAndRecipientIdAndEndpoint(
      String recipientType, String recipientId, String endpoint);

  List<PushSubscriptionEntity> findByRecipientTypeAndRecipientId(String recipientType, String recipientId);

  long deleteByRecipientTypeAndRecipientIdAndEndpoint(
      String recipientType, String recipientId, String endpoint);
}
