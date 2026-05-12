package com.carnalysys.repo;

import com.carnalysys.domain.UserEntity;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;

public interface UserRepository
    extends JpaRepository<UserEntity, UUID>, JpaSpecificationExecutor<UserEntity> {

  Optional<UserEntity> findByPhoneE164(String phoneE164);
}
