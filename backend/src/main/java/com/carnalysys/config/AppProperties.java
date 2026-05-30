package com.carnalysys.config;

import java.util.Arrays;
import java.util.List;
import org.springframework.boot.context.properties.ConfigurationProperties;

@ConfigurationProperties(prefix = "app")
public record AppProperties(
    Jwt jwt,
    RefreshToken refreshToken,
    Otp otp,
    Delivery delivery,
    Firebase firebase,
    Cors cors,
    Payment payment) {

  public record Jwt(String secret, int accessTtlSeconds) {}

  public record RefreshToken(int ttlSeconds) {}

  public record Otp(String demoCode, int ttlSeconds) {}

  /**
   * Customer delivery OTP (separate from login OTP challenge TTL).
   *
   * @param demoOtpEnabled when true and active profile is local/dev, delivery OTP uses {@code app.otp.demo-code}
   */
  public record Delivery(int otpTtlSeconds, int otpResendCooldownSeconds, boolean demoOtpEnabled) {}

  public record Firebase(
      String projectId,
      String clientEmail,
      String privateKey,
      String serviceAccountPath) {}

  public record Cors(String allowedOrigins) {
    public List<String> originList() {
      return Arrays.stream(allowedOrigins.split(",")).map(String::trim).filter(s -> !s.isEmpty()).toList();
    }
  }

  public record Payment(
      String provider,
      String razorpayKeyId,
      String razorpayKeySecret,
      String webhookSecret,
      long webhookReplayWindowSeconds,
      long reconciliationMs,
      int pendingTimeoutMinutes) {}
}
