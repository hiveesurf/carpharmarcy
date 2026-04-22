package com.carnalysys.web.support;

import jakarta.servlet.http.HttpServletRequest;
import java.util.Optional;
import java.util.UUID;
import org.springframework.web.util.WebUtils;

public final class GuestRequest {

  private GuestRequest() {}

  /**
   * Prefer {@code guestSession} cookie over {@code X-Guest-Session}. The cookie is issued by the
   * server on first cart write; the header often holds a client-generated UUID that was never
   * persisted, which would otherwise shadow the real guest and show an empty cart.
   */
  public static Optional<UUID> guestId(HttpServletRequest request) {
    var c = WebUtils.getCookie(request, "guestSession");
    if (c != null && c.getValue() != null && !c.getValue().isBlank()) {
      try {
        return Optional.of(UUID.fromString(c.getValue().trim()));
      } catch (IllegalArgumentException ignored) {
        // fall through to header
      }
    }
    String h = request.getHeader("X-Guest-Session");
    if (h != null && !h.isBlank()) {
      try {
        return Optional.of(UUID.fromString(h.trim()));
      } catch (IllegalArgumentException ignored) {
        return Optional.empty();
      }
    }
    return Optional.empty();
  }
}
