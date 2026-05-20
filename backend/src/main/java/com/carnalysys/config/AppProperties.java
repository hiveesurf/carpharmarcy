package com.carnalysys.config;

import java.util.Arrays;
import java.util.List;
import org.springframework.boot.context.properties.ConfigurationProperties;

@ConfigurationProperties(prefix = "app")
public record AppProperties(
    Jwt jwt,
    RefreshToken refreshToken,
    Otp otp,
    Cors cors,
    Payment payment) {

  public record Jwt(String secret, int accessTtlSeconds) {}

  public record RefreshToken(int ttlSeconds) {}

  public record Otp(String demoCode, int ttlSeconds) {}

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
