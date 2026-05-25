package com.carnalysys.repo;

import com.carnalysys.domain.AdminUser;
import java.time.Instant;
import java.util.Collection;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.repository.JpaRepository;

public interface AdminUserRepository extends JpaRepository<AdminUser, UUID> {

  Optional<AdminUser> findByEmailIgnoreCase(String email);
  Optional<AdminUser> findByPhoneE164(String phoneE164);

  List<AdminUser> findByRoleIgnoreCaseOrderByEmailAsc(String role);

  Page<AdminUser> findByRoleIgnoreCase(String role, Pageable pageable);

  List<AdminUser> findByRoleIn(Collection<String> roles, Sort sort);

  Page<AdminUser> findByRoleIn(Collection<String> roles, Pageable pageable);

  List<AdminUser> findByRoleInAndDeletedAtIsNull(Collection<String> roles, Sort sort);

  Page<AdminUser> findByRoleInAndDeletedAtIsNull(Collection<String> roles, Pageable pageable);

  List<AdminUser> findByRoleInAndDeletedAtIsNotNull(Collection<String> roles, Sort sort);

  Page<AdminUser> findByRoleInAndDeletedAtIsNotNull(Collection<String> roles, Pageable pageable);

  long countByRoleIn(Collection<String> roles);

  long countByRoleInAndDeletedAtIsNull(Collection<String> roles);

  long countByRoleInAndOnboardingStatus(Collection<String> roles, String onboardingStatus);

  long countByRoleInAndDeletedAtIsNullAndOnboardingStatus(
      Collection<String> roles, String onboardingStatus);

  long countByRoleInAndDeletedAtIsNullAndCreatedAtGreaterThanEqual(
      Collection<String> roles, Instant createdAt);
}
