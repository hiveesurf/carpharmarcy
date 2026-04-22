package com.carnalysys.service;

import com.carnalysys.api.ApiException;
import com.carnalysys.config.AppProperties;
import com.carnalysys.domain.AdminUser;
import com.carnalysys.domain.OtpChallenge;
import com.carnalysys.domain.RefreshTokenEntity;
import com.carnalysys.domain.UserEntity;
import com.carnalysys.domain.UserProfile;
import com.carnalysys.repo.OtpChallengeRepository;
import com.carnalysys.repo.RefreshTokenRepository;
import com.carnalysys.repo.AdminUserRepository;
import com.carnalysys.repo.UserProfileRepository;
import com.carnalysys.repo.UserRepository;
import com.carnalysys.security.JwtService;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.security.SecureRandom;
import java.time.Instant;
import java.util.HexFormat;
import java.util.LinkedHashMap;
import java.util.Map;
import java.util.UUID;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class AuthService {

  public record VerifyPayload(Map<String, Object> data, String refreshTokenRaw) {}

  /** Access payload + new refresh raw (rotated on each refresh). */
  public record RefreshPayload(Map<String, Object> data, String newRefreshTokenRaw) {}

  private final AppProperties appProperties;
  private final UserRepository userRepository;
  private final UserProfileRepository userProfileRepository;
  private final OtpChallengeRepository otpChallengeRepository;
  private final RefreshTokenRepository refreshTokenRepository;
  private final AdminUserRepository adminUserRepository;
  private final JwtService jwtService;
  private final PasswordEncoder passwordEncoder;
  private final NotificationService notificationService;
  private final SecureRandom random = new SecureRandom();

  public AuthService(
      AppProperties appProperties,
      UserRepository userRepository,
      UserProfileRepository userProfileRepository,
      OtpChallengeRepository otpChallengeRepository,
      RefreshTokenRepository refreshTokenRepository,
      AdminUserRepository adminUserRepository,
      JwtService jwtService,
      PasswordEncoder passwordEncoder,
      NotificationService notificationService) {
    this.appProperties = appProperties;
    this.userRepository = userRepository;
    this.userProfileRepository = userProfileRepository;
    this.otpChallengeRepository = otpChallengeRepository;
    this.refreshTokenRepository = refreshTokenRepository;
    this.adminUserRepository = adminUserRepository;
    this.jwtService = jwtService;
    this.passwordEncoder = passwordEncoder;
    this.notificationService = notificationService;
  }

  @Transactional
  public Map<String, Object> sendOtp(String phoneDigits) {
    if (phoneDigits == null || phoneDigits.length() < 10) {
      throw new ApiException(HttpStatus.BAD_REQUEST, "VALIDATION_ERROR", "Invalid phone");
    }
    OtpChallenge ch = new OtpChallenge();
    ch.setPhoneE164(phoneDigits);
    ch.setCodeHash(passwordEncoder.encode(appProperties.otp().demoCode()));
    ch.setExpiresAt(Instant.now().plusSeconds(appProperties.otp().ttlSeconds()));
    otpChallengeRepository.save(ch);
    Map<String, Object> data = new LinkedHashMap<>();
    data.put("sent", true);
    data.put("ttlSeconds", appProperties.otp().ttlSeconds());
    data.put("demoOtp", appProperties.otp().demoCode());
    UserEntity existingUser = userRepository.findByPhoneE164(phoneDigits).orElse(null);
    if (existingUser != null) {
      notificationService.notifyUser(
          existingUser.getId(),
          "auth_security",
          "OTP sent",
          "A login OTP was requested for your account.",
          "auth",
          ch.getId().toString(),
          Map.of("phone", phoneDigits));
    }
    return data;
  }

  @Transactional
  public VerifyPayload verifyOtp(String phoneDigits, String otp) {
    if (phoneDigits == null || phoneDigits.length() < 10) {
      throw new ApiException(HttpStatus.BAD_REQUEST, "VALIDATION_ERROR", "Invalid phone");
    }
    var row =
        otpChallengeRepository
            .findTopByPhoneE164AndConsumedAtIsNullOrderByCreatedAtDesc(phoneDigits)
            .orElseThrow(
                () -> new ApiException(HttpStatus.BAD_REQUEST, "OTP_EXPIRED", "Request a new OTP"));
    if (row.getExpiresAt().isBefore(Instant.now())) {
      throw new ApiException(HttpStatus.BAD_REQUEST, "OTP_EXPIRED", "Request a new OTP");
    }
    if (!passwordEncoder.matches(otp, row.getCodeHash())) {
      throw new ApiException(HttpStatus.BAD_REQUEST, "OTP_INVALID", "Wrong OTP");
    }
    row.setConsumedAt(Instant.now());
    otpChallengeRepository.save(row);

    UserEntity user =
        userRepository
            .findByPhoneE164(phoneDigits)
            .orElseGet(
                () -> {
                  UserEntity u = new UserEntity();
                  u.setPhoneE164(phoneDigits);
                  u.setDisplayName("User " + phoneDigits.substring(Math.max(0, phoneDigits.length() - 4)));
                  userRepository.saveAndFlush(u);
                  UserProfile prof = new UserProfile();
                  prof.setUser(u);
                  prof.setFullName(u.getDisplayName());
                  prof.setEmail(null);
                  prof.setPhone(phoneDigits);
                  userProfileRepository.save(prof);
                  return userRepository
                      .findById(u.getId())
                      .orElseThrow(() -> new IllegalStateException("user not persisted"));
                });

    promoteRoleAndActivateEmployeeIfMatched(user, phoneDigits);

    String accessToken = jwtService.createAccessToken(user.getId(), user.getRole());
    String refreshRaw = newRefreshRaw();
    RefreshTokenEntity rt = new RefreshTokenEntity();
    rt.setUser(userRepository.getReferenceById(user.getId()));
    rt.setTokenHash(sha256Hex(refreshRaw));
    rt.setExpiresAt(Instant.now().plusSeconds(appProperties.refreshToken().ttlSeconds()));
    refreshTokenRepository.save(rt);

    Map<String, Object> data = new LinkedHashMap<>();
    data.put("accessToken", accessToken);
    data.put("user", userToMap(user));
    data.put("expiresInSeconds", appProperties.jwt().accessTtlSeconds());
    notificationService.notifyUser(
        user.getId(),
        "auth_security",
        "Login successful",
        "You signed in successfully.",
        "auth",
        row.getId().toString(),
        Map.of("phone", phoneDigits));
    return new VerifyPayload(data, refreshRaw);
  }

  @Transactional
  public RefreshPayload refresh(String refreshRaw) {
    if (refreshRaw == null || refreshRaw.isBlank()) {
      throw new ApiException(HttpStatus.UNAUTHORIZED, "NO_REFRESH", "No refresh token");
    }
    String hash = sha256Hex(refreshRaw.trim());
    RefreshTokenEntity row =
        refreshTokenRepository
            .findByTokenHashAndRevokedAtIsNull(hash)
            .orElseThrow(
                () ->
                    new ApiException(HttpStatus.UNAUTHORIZED, "REFRESH_INVALID", "Refresh expired"));
    if (row.getExpiresAt().isBefore(Instant.now())) {
      throw new ApiException(HttpStatus.UNAUTHORIZED, "REFRESH_INVALID", "Refresh expired");
    }
    row.setRevokedAt(Instant.now());
    refreshTokenRepository.save(row);

    UserEntity user = row.getUser();
    String accessToken = jwtService.createAccessToken(user.getId(), user.getRole());
    String newRefreshRaw = newRefreshRaw();
    RefreshTokenEntity next = new RefreshTokenEntity();
    next.setUser(user);
    next.setTokenHash(sha256Hex(newRefreshRaw));
    next.setExpiresAt(Instant.now().plusSeconds(appProperties.refreshToken().ttlSeconds()));
    refreshTokenRepository.save(next);

    Map<String, Object> data = new LinkedHashMap<>();
    data.put("accessToken", accessToken);
    data.put("user", userToMap(user));
    data.put("expiresInSeconds", appProperties.jwt().accessTtlSeconds());
    notificationService.notifyUser(
        user.getId(),
        "auth_security",
        "Session refreshed",
        "Your session token was refreshed.",
        "auth",
        row.getId().toString(),
        Map.of());
    return new RefreshPayload(data, newRefreshRaw);
  }

  @Transactional(readOnly = true)
  public Map<String, Object> currentUser(UUID userId) {
    UserEntity u =
        userRepository
            .findById(userId)
            .orElseThrow(
                () ->
                    new ApiException(HttpStatus.UNAUTHORIZED, "UNAUTHORIZED", "User not found"));
    Map<String, Object> m = userToMap(u);
    userProfileRepository
        .findById(userId)
        .ifPresent(
            p -> {
              if (p.getAvatarStorageKey() != null && !p.getAvatarStorageKey().isBlank()) {
                m.put("avatarUrl", UserAvatarService.PUBLIC_AVATAR_PREFIX + userId);
              }
              if (p.getSecondaryPhone() != null && !p.getSecondaryPhone().isBlank()) {
                m.put("secondaryPhone", p.getSecondaryPhone());
              }
            });
    return m;
  }

  @Transactional
  public void logout(String refreshRaw) {
    if (refreshRaw != null && !refreshRaw.isBlank()) {
      refreshTokenRepository
          .findByTokenHashAndRevokedAtIsNull(sha256Hex(refreshRaw.trim()))
          .ifPresent(
              r -> {
                r.setRevokedAt(Instant.now());
                refreshTokenRepository.save(r);
                if (r.getUser() != null && r.getUser().getId() != null) {
                  notificationService.notifyUser(
                      r.getUser().getId(),
                      "auth_security",
                      "Logged out",
                      "You logged out from your account.",
                      "auth",
                      r.getId().toString(),
                      Map.of());
                }
              });
    }
  }

  private static Map<String, Object> userToMap(UserEntity u) {
    Map<String, Object> m = new LinkedHashMap<>();
    m.put("id", u.getId().toString());
    m.put("phone", u.getPhoneE164());
    m.put("name", u.getDisplayName());
    m.put("role", u.getRole() != null ? u.getRole() : "user");
    return m;
  }

  private String newRefreshRaw() {
    byte[] b = new byte[32];
    random.nextBytes(b);
    return "rt_" + HexFormat.of().formatHex(b);
  }

  private static String sha256Hex(String s) {
    try {
      byte[] d =
          MessageDigest.getInstance("SHA-256").digest(s.getBytes(StandardCharsets.UTF_8));
      return HexFormat.of().formatHex(d);
    } catch (NoSuchAlgorithmException e) {
      throw new IllegalStateException(e);
    }
  }

  private void promoteRoleAndActivateEmployeeIfMatched(UserEntity user, String phoneDigits) {
    AdminUser employee = adminUserRepository.findByPhoneE164(phoneDigits).orElse(null);
    if (employee == null) return;

    String role = employee.getRole();
    if (role != null && !role.isBlank() && !role.equalsIgnoreCase(user.getRole())) {
      user.setRole(role.toLowerCase());
      userRepository.save(user);
    }

    if (!"success".equalsIgnoreCase(employee.getOnboardingStatus())) {
      employee.setOnboardingStatus("success");
      if (employee.getFirstLoginAt() == null) {
        employee.setFirstLoginAt(Instant.now());
      }
      employee.setLastLoginAt(Instant.now());
      adminUserRepository.save(employee);
    } else if (employee.getLastLoginAt() == null) {
      employee.setLastLoginAt(Instant.now());
      adminUserRepository.save(employee);
    }
  }
}
