package com.carnalysys.repo;

import com.carnalysys.domain.AdminUser;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

public interface AdminUserRepository extends JpaRepository<AdminUser, UUID> {

  Optional<AdminUser> findByEmailIgnoreCase(String email);
  Optional<AdminUser> findByPhoneE164(String phoneE164);

  java.util.List<AdminUser> findByRoleIgnoreCaseOrderByEmailAsc(String role);

  Page<AdminUser> findByRoleIgnoreCase(String role, Pageable pageable);
}
