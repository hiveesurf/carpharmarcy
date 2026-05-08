package com.carnalysys.repo;

import com.carnalysys.domain.OtpChallenge;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;

public interface OtpChallengeRepository extends JpaRepository<OtpChallenge, UUID> {
  Optional<OtpChallenge> findTopByPhoneE164AndConsumedAtIsNullOrderByCreatedAtDesc(String phone);
}
