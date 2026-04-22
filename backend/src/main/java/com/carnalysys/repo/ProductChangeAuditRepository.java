package com.carnalysys.repo;

import com.carnalysys.domain.ProductChangeAuditEntity;
import java.util.List;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;

public interface ProductChangeAuditRepository extends JpaRepository<ProductChangeAuditEntity, UUID> {
  List<ProductChangeAuditEntity> findByProductIdOrderByCreatedAtDesc(String productId);
}
