package com.carnalysys.service;

import com.carnalysys.api.ApiException;
import com.carnalysys.config.AppProperties;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import java.io.IOException;
import java.math.BigDecimal;
import java.math.RoundingMode;
import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.util.Base64;
import java.util.HexFormat;
import java.util.Map;
import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;

@Service
public class RazorpayPaymentService {

  private static final TypeReference<Map<String, Object>> MAP_TYPE = new TypeReference<>() {};

  private final AppProperties appProperties;
  private final ObjectMapper objectMapper;
  private final HttpClient httpClient = HttpClient.newHttpClient();

  public RazorpayPaymentService(AppProperties appProperties, ObjectMapper objectMapper) {
    this.appProperties = appProperties;
    this.objectMapper = objectMapper;
  }

  public boolean isEnabled() {
    return "razorpay".equalsIgnoreCase(appProperties.payment().provider());
  }

  public String keyId() {
    return appProperties.payment().razorpayKeyId();
  }

  public Map<String, Object> createOrder(String receiptId, BigDecimal amountInr, String currency) {
    ensureConfigured();
    try {
      long amountPaise = amountInr.multiply(BigDecimal.valueOf(100)).setScale(0, RoundingMode.HALF_UP).longValue();
      Map<String, Object> body =
          Map.of("amount", amountPaise, "currency", currency, "receipt", receiptId, "payment_capture", 1);
      String payload = objectMapper.writeValueAsString(body);
      String basicAuth =
          Base64.getEncoder()
              .encodeToString(
                  (appProperties.payment().razorpayKeyId() + ":" + appProperties.payment().razorpayKeySecret())
                      .getBytes(StandardCharsets.UTF_8));
      HttpRequest request =
          HttpRequest.newBuilder()
              .uri(URI.create("https://api.razorpay.com/v1/orders"))
              .header("Authorization", "Basic " + basicAuth)
              .header("Content-Type", "application/json")
              .POST(HttpRequest.BodyPublishers.ofString(payload))
              .build();
      HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());
      if (response.statusCode() < 200 || response.statusCode() >= 300) {
        throw new ApiException(
            HttpStatus.BAD_GATEWAY,
            "PAYMENT_PROVIDER_ERROR",
            "Razorpay order create failed with status " + response.statusCode());
      }
      return objectMapper.readValue(response.body(), MAP_TYPE);
    } catch (IOException | InterruptedException e) {
      if (e instanceof InterruptedException) {
        Thread.currentThread().interrupt();
      }
      throw new ApiException(HttpStatus.BAD_GATEWAY, "PAYMENT_PROVIDER_ERROR", "Unable to create Razorpay order");
    }
  }

  public boolean verifyCheckoutSignature(String razorpayOrderId, String razorpayPaymentId, String signature) {
    ensureConfigured();
    if (razorpayOrderId == null
        || razorpayOrderId.isBlank()
        || razorpayPaymentId == null
        || razorpayPaymentId.isBlank()
        || signature == null
        || signature.isBlank()) {
      return false;
    }
    String signedPayload = razorpayOrderId + "|" + razorpayPaymentId;
    String computed = hmacSha256Hex(signedPayload, appProperties.payment().razorpayKeySecret());
    return MessageDigest.isEqual(
        computed.getBytes(StandardCharsets.UTF_8), signature.trim().getBytes(StandardCharsets.UTF_8));
  }

  private void ensureConfigured() {
    if (!isEnabled()) {
      return;
    }
    if (appProperties.payment().razorpayKeyId() == null || appProperties.payment().razorpayKeyId().isBlank()) {
      throw new ApiException(HttpStatus.INTERNAL_SERVER_ERROR, "PAYMENT_PROVIDER_MISCONFIGURED", "Missing Razorpay key id");
    }
    if (appProperties.payment().razorpayKeySecret() == null
        || appProperties.payment().razorpayKeySecret().isBlank()) {
      throw new ApiException(
          HttpStatus.INTERNAL_SERVER_ERROR, "PAYMENT_PROVIDER_MISCONFIGURED", "Missing Razorpay key secret");
    }
  }

  private static String hmacSha256Hex(String value, String secret) {
    try {
      Mac hmac = Mac.getInstance("HmacSHA256");
      hmac.init(new SecretKeySpec(secret.getBytes(StandardCharsets.UTF_8), "HmacSHA256"));
      return HexFormat.of().formatHex(hmac.doFinal(value.getBytes(StandardCharsets.UTF_8)));
    } catch (Exception e) {
      throw new IllegalStateException("Could not compute HMAC", e);
    }
  }
}
