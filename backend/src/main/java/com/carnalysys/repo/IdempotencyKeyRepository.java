package com.carnalysys.repo;

import com.carnalysys.domain.IdempotencyKeyEntity;
import java.time.Instant;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;

public interface IdempotencyKeyRepository extends JpaRepository<IdempotencyKeyEntity, UUID> {

  Optional<IdempotencyKeyEntity> findByScopeAndActorKeyAndIdempotencyKey(
      String scope, String actorKey, String idempotencyKey);

  @Modifying
  @Query("delete from IdempotencyKeyEntity i where i.expiresAt < :expiry")
  int deleteExpired(Instant expiry);
}
