package com.carnalysys.security;

import com.carnalysys.api.ApiErrorEnvelope;
import com.carnalysys.api.ApiMeta;
import com.carnalysys.repo.AdminUserRepository;
import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import java.io.IOException;
import java.util.List;
import org.springframework.http.HttpMethod;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.filter.OncePerRequestFilter;
import org.springframework.web.util.WebUtils;

public class AdminSessionAuthenticationFilter extends OncePerRequestFilter {

  private final AdminSessionService adminSessionService;
  private final ObjectMapper objectMapper;
  private final AdminUserRepository adminUserRepository;

  public AdminSessionAuthenticationFilter(
      AdminSessionService adminSessionService, ObjectMapper objectMapper, AdminUserRepository adminUserRepository) {
    this.adminSessionService = adminSessionService;
    this.objectMapper = objectMapper;
    this.adminUserRepository = adminUserRepository;
  }

  @Override
  protected void doFilterInternal(
      HttpServletRequest request, HttpServletResponse response, FilterChain filterChain)
      throws ServletException, IOException {
    try {
      if (isLoginPost(request)) {
        filterChain.doFilter(request, response);
        return;
      }
      var existing = SecurityContextHolder.getContext().getAuthentication();

      /*
       * Prefer a valid admin_session cookie over JWT identity. Otherwise a storefront Bearer token
       * (subject = user UUID) wins first in JwtAuthenticationFilter and this filter used to skip
       * cookie resolution whenever ROLE_ADMIN was present — leaving getName() as UUID and breaking
       * services that resolve AdminUser by email or phone only.
       */
      var cookie = WebUtils.getCookie(request, AdminSessionService.COOKIE_NAME);
      String token = cookie != null ? cookie.getValue() : null;
      var sessionEmailOpt = adminSessionService.resolveSessionEmail(token);
      if (sessionEmailOpt.isPresent()) {
        String emailKey = sessionEmailOpt.get().trim().toLowerCase();
        var adminFromSession = adminUserRepository.findByEmailIgnoreCase(emailKey);
        if (adminFromSession.isPresent()) {
          String principalEmail = adminFromSession.get().getEmail().trim().toLowerCase();
          SecurityContextHolder.getContext()
              .setAuthentication(
                  new UsernamePasswordAuthenticationToken(
                      principalEmail, null, authoritiesFor(principalEmail)));
          filterChain.doFilter(request, response);
          return;
        }
      }

      if (existing != null
          && existing.isAuthenticated()
          && hasAdminAuthority(existing.getAuthorities())) {
        filterChain.doFilter(request, response);
        return;
      }

      response.setStatus(HttpServletResponse.SC_FORBIDDEN);
      response.setContentType("application/json;charset=UTF-8");
      var meta = ApiMeta.of(null);
      objectMapper.writeValue(
          response.getOutputStream(),
          ApiErrorEnvelope.of(
              "FORBIDDEN",
              "Admin access: sign in with phone (admin role) or admin email login",
              null,
              meta));
      return;
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

  private List<SimpleGrantedAuthority> authoritiesFor(String email) {
    String role =
        adminUserRepository
            .findByEmailIgnoreCase(email)
            .map(a -> a.getRole())
            .orElse("super_admin");
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

  private static boolean isLoginPost(HttpServletRequest request) {
    return HttpMethod.POST.matches(request.getMethod())
        && request.getRequestURI().endsWith("/admin/auth/login");
  }
}
