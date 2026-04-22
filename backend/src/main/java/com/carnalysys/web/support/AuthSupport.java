package com.carnalysys.web.support;

import com.carnalysys.api.ApiException;
import java.util.Optional;
import java.util.UUID;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;

public final class AuthSupport {

  private AuthSupport() {}

  public static UUID requireUser() {
    return optionalUser()
        .orElseThrow(
            () ->
                new ApiException(
                    HttpStatus.UNAUTHORIZED, "UNAUTHORIZED", "Valid access token required"));
  }

  public static Optional<UUID> optionalUser() {
    Authentication a = SecurityContextHolder.getContext().getAuthentication();
    if (a == null || !a.isAuthenticated()) {
      return Optional.empty();
    }
    try {
      return Optional.of(UUID.fromString(a.getName()));
    } catch (Exception e) {
      return Optional.empty();
    }
  }
}
