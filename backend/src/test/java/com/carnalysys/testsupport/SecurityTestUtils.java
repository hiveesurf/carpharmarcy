package com.carnalysys.testsupport;

import java.util.UUID;
import org.springframework.security.core.userdetails.User;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors;
import org.springframework.test.web.servlet.request.RequestPostProcessor;

/**
 * Per-request authentication for MockMvc. Use with {@code @AutoConfigureMockMvc(addFilters = true)} and
 * {@link WebMvcSliceTestConfiguration}'s permit-all / CSRF-off chain so Spring Security test support
 * wires the context correctly.
 */
public final class SecurityTestUtils {

  private SecurityTestUtils() {}

  /** Principal name is the user UUID string (see {@link com.carnalysys.web.support.AuthSupport}). */
  public static RequestPostProcessor asUser(UUID userId) {
    UserDetails u =
        User.withUsername(userId.toString())
            .password("n/a")
            .roles("USER")
            .build();
    return SecurityMockMvcRequestPostProcessors.user(u);
  }

  public static RequestPostProcessor asAdmin() {
    UserDetails u =
        User.withUsername("admin@carnalysys.test")
            .password("n/a")
            .roles("ADMIN")
            .build();
    return SecurityMockMvcRequestPostProcessors.user(u);
  }

  public static RequestPostProcessor asSuperAdmin() {
    UserDetails u =
        User.withUsername("admin@carnalysys.test")
            .password("n/a")
            .roles("ADMIN", "SUPER_ADMIN")
            .build();
    return SecurityMockMvcRequestPostProcessors.user(u);
  }
}
