package com.carnalysys.repo;

import com.carnalysys.domain.AddressEntity;
import java.util.List;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;

public interface AddressRepository extends JpaRepository<AddressEntity, UUID> {

  List<AddressEntity> findByUser_IdAndDeletedAtIsNullOrderByCreatedAtDesc(UUID userId);
}
