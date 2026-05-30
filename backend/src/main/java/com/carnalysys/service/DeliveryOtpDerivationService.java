package com.carnalysys.service;

import com.carnalysys.config.AppProperties;
import java.math.BigInteger;
import java.nio.charset.StandardCharsets;
import java.util.UUID;
import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import org.springframework.stereotype.Service;

/** Derives a 6-digit delivery OTP from order id + nonce (nothing stored in plaintext). */
@Service
public class DeliveryOtpDerivationService {

  private static final int OTP_MOD = 1_000_000;

  private final byte[] secretBytes;

  public DeliveryOtpDerivationService(AppProperties appProperties) {
    String secret = appProperties.jwt().secret();
    if (secret == null || secret.isBlank()) {
      throw new IllegalStateException("app.jwt.secret is required for delivery OTP derivation");
    }
    this.secretBytes = secret.trim().getBytes(StandardCharsets.UTF_8);
  }

  public String newNonce() {
    return UUID.randomUUID().toString();
  }

  public String deriveOtp(String orderId, String nonce) {
    if (orderId == null || orderId.isBlank() || nonce == null || nonce.isBlank()) {
      throw new IllegalArgumentException("orderId and nonce are required");
    }
    try {
      Mac mac = Mac.getInstance("HmacSHA256");
      mac.init(new SecretKeySpec(secretBytes, "HmacSHA256"));
      mac.update((orderId.trim() + ":" + nonce.trim()).getBytes(StandardCharsets.UTF_8));
      byte[] digest = mac.doFinal();
      int val = new BigInteger(1, digest).mod(BigInteger.valueOf(OTP_MOD)).intValue();
      return String.format("%06d", val);
    } catch (Exception ex) {
      throw new IllegalStateException("Delivery OTP derivation failed", ex);
    }
  }
}
