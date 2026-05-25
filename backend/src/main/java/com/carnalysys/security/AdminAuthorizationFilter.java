package com.carnalysys.security;

import com.carnalysys.api.ApiErrorEnvelope;
import com.carnalysys.api.ApiMeta;
import com.carnalysys.domain.UserEntity;
import com.carnalysys.repo.AdminUserRepository;
import com.carnalysys.repo.UserRepository;
import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import java.io.IOException;
import java.util.List;
import java.util.UUID;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.filter.OncePerRequestFilter;

/**
 * Protects {@code /api/v1/admin/**}: requires a valid storefront JWT whose user phone matches an
 * {@code admin_users.phone_e164} row. Roles are taken from {@code admin_users.role} on each request.
 */
public class AdminAuthorizationFilter extends OncePerRequestFilter {

  private final ObjectMapper objectMapper;
  private final AdminUserRepository adminUserRepository;
  private final UserRepository userRepository;

  public AdminAuthorizationFilter(
      ObjectMapper objectMapper, AdminUserRepository adminUserRepository, UserRepository userRepository) {
    this.objectMapper = objectMapper;
    this.adminUserRepository = adminUserRepository;
    this.userRepository = userRepository;
  }

  @Override
  protected void doFilterInternal(
      HttpServletRequest request, HttpServletResponse response, FilterChain filterChain)
      throws ServletException, IOException {
    try {
      var existing = SecurityContextHolder.getContext().getAuthentication();
      if (existing == null || !existing.isAuthenticated() || !hasAdminAuthority(existing.getAuthorities())) {
        forbidden(response);
        return;
      }

      UUID userId;
      try {
        userId = UUID.fromString(String.valueOf(existing.getName()).trim());
      } catch (IllegalArgumentException ex) {
        forbidden(response);
        return;
      }

      UserEntity user =
          userRepository
              .findById(userId)
              .orElse(null);
      if (user == null || user.getPhoneE164() == null || user.getPhoneE164().isBlank()) {
        forbidden(response);
        return;
      }

      var adminOpt = adminUserRepository.findByPhoneE164(user.getPhoneE164().trim());
      if (adminOpt.isEmpty() || adminOpt.get().getDeletedAt() != null) {
        forbidden(response);
        return;
      }

      String role = adminOpt.get().getRole();
      SecurityContextHolder.getContext()
          .setAuthentication(
              new UsernamePasswordAuthenticationToken(
                  userId.toString(), null, authoritiesFor(role)));
      filterChain.doFilter(request, response);
    } finally {
      SecurityContextHolder.clearContext();
    }
  }

  private static boolean hasAdminAuthority(Iterable<? extends GrantedAuthority> authorities) {
    for (GrantedAuthority g : authorities) {
      if ("ROLE_ADMIN".equals(g.getAuthority())) {
        return true;
      }
    }
    return false;
  }

  private static List<SimpleGrantedAuthority> authoritiesFor(String role) {
    String r = role == null ? "super_admin" : role.trim().toLowerCase();
    return switch (r) {
      case "sales" ->
          List.of(
              new SimpleGrantedAuthority("ROLE_ADMIN"),
              new SimpleGrantedAuthority("ROLE_SALES"));
      case "delivery" ->
          List.of(
              new SimpleGrantedAuthority("ROLE_ADMIN"),
              new SimpleGrantedAuthority("ROLE_DELIVERY"));
      default ->
          List.of(
              new SimpleGrantedAuthority("ROLE_ADMIN"),
              new SimpleGrantedAuthority("ROLE_SUPER_ADMIN"));
    };
  }

  private void forbidden(HttpServletResponse response) throws IOException {
    response.setStatus(HttpServletResponse.SC_FORBIDDEN);
    response.setContentType("application/json;charset=UTF-8");
    objectMapper.writeValue(
        response.getOutputStream(),
        ApiErrorEnvelope.of(
            "FORBIDDEN",
            "Admin access requires sign-in with a phone number linked to an admin account",
            null,
            ApiMeta.of(null)));
  }
}
