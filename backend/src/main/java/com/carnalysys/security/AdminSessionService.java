package com.carnalysys.security;

import com.carnalysys.config.AppProperties;
import java.time.Instant;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;
import java.util.concurrent.ConcurrentHashMap;
import org.springframework.stereotype.Service;

@Service
public class AdminSessionService {

  public static final String COOKIE_NAME = "adminSession";

  private record SessionEntry(Instant expiresAt, String adminEmail) {}

  private final AppProperties appProperties;
  private final Map<String, SessionEntry> sessions = new ConcurrentHashMap<>();

  public AdminSessionService(AppProperties appProperties) {
    this.appProperties = appProperties;
  }

  /** @param adminEmail normalized admin login email (stored for audit on category creation, etc.) */
  public String createSession(String adminEmail) {
    purgeExpired();
    String token = UUID.randomUUID().toString();
    String email =
        adminEmail != null && !adminEmail.isBlank() ? adminEmail.trim().toLowerCase() : "admin";
    sessions.put(
        token,
        new SessionEntry(
            Instant.now().plusSeconds(appProperties.admin().sessionTtlSeconds()), email));
    return token;
  }

  public Optional<String> resolveSessionEmail(String token) {
    purgeExpired();
    if (token == null || token.isBlank()) return Optional.empty();
    SessionEntry s = sessions.get(token);
    if (s == null || s.expiresAt.isBefore(Instant.now())) return Optional.empty();
    return Optional.of(s.adminEmail);
  }

  public boolean isValid(String token) {
    return resolveSessionEmail(token).isPresent();
  }

  public void invalidate(String token) {
    if (token != null) {
      sessions.remove(token);
    }
  }

  private void purgeExpired() {
    Instant now = Instant.now();
    sessions.entrySet().removeIf(e -> e.getValue().expiresAt.isBefore(now));
  }
}
