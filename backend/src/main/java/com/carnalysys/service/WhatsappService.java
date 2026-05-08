package com.carnalysys.service;

import com.carnalysys.domain.OrderStatus;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import java.io.IOException;
import java.net.URI;
import java.net.URLEncoder;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.nio.charset.StandardCharsets;
import java.util.ArrayList;
import java.util.Base64;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.core.env.Environment;
import org.springframework.stereotype.Service;

@Service
public class WhatsappService {
  private static final Logger log = LoggerFactory.getLogger(WhatsappService.class);
  private static final ObjectMapper OBJECT_MAPPER = new ObjectMapper();
  private static final String DEFAULT_ORDER_DATE_TEXT = "Date to be confirmed";

  private final Environment environment;
  private final HttpClient httpClient = HttpClient.newHttpClient();

  public WhatsappService(Environment environment) {
    this.environment = environment;
  }

  public boolean isEnabled() {
    return bool("WHATSAPP_ENABLED", false) && hasText(env("TWILIO_ACCOUNT_SID")) && hasText(env("TWILIO_AUTH_TOKEN"));
  }

  public void sendOtp(String phoneDigits, String otp) {
    if (!isEnabled()) return;
    if (!hasText(phoneDigits) || !hasText(otp)) return;
    String templateSid = trim(env("TWILIO_WHATSAPP_TEMPLATE_OTP_SID"));
    String body = "Your login OTP is " + otp + ". It expires in 5 minutes.";
    String to = normalizeTo(phoneDigits);
    try {
      if (hasText(templateSid)) {
        sendTemplate(to, fromNumber(), templateSid, jsonOf(Map.of("1", otp, "otp", otp)));
      } else {
        sendText(to, fromNumber(), body);
      }
      log.info("WhatsApp OTP destination normalized to {}", to);
      log.info("WhatsApp OTP sent successfully to {}", phoneDigits);
    } catch (RuntimeException ex) {
      log.error("WhatsApp OTP send failed for {}", phoneDigits, ex);
      throw ex;
    }
  }

  public boolean sendOrderStatusUpdateBestEffort(String phoneDigits, String orderId, OrderStatus status) {
    if (!isEnabled()) return false;
    if (!hasText(phoneDigits) || status == null) return false;
    String text = orderStatusMessage(orderId, status, orderViewLink(orderId));
    if (!hasText(text)) return false;
    try {
      String sid = orderStatusTemplateSid(status);
      if (hasText(sid)) {
        sendTemplate(normalizeTo(phoneDigits), fromNumber(), sid, contentVariables(orderId, orderViewLink(orderId)));
      } else {
        sendText(normalizeTo(phoneDigits), fromNumber(), text);
      }
      return true;
    } catch (RuntimeException ex) {
      log.error(
          "WhatsApp order status send failed (ignored): phone={}, orderId={}, status={}",
          phoneDigits,
          orderId,
          status.name(),
          ex);
      return false;
    }
  }

  private void sendText(String to, String from, String body) {
    Map<String, String> fields = new LinkedHashMap<>();
    fields.put("To", to);
    fields.put("From", from);
    fields.put("Body", body);
    twilioMessagePost(fields);
  }

  private void sendTemplate(String to, String from, String contentSid, String contentVariables) {
    Map<String, String> fields = new LinkedHashMap<>();
    fields.put("To", to);
    fields.put("From", from);
    fields.put("ContentSid", contentSid);
    fields.put("ContentVariables", contentVariables);
    log.debug("Sending WhatsApp template payload: contentSid={}, contentVariables={}", contentSid, contentVariables);
    twilioMessagePost(fields);
  }

  private void twilioMessagePost(Map<String, String> fields) {
    String accountSid = trim(env("TWILIO_ACCOUNT_SID"));
    String authToken = trim(env("TWILIO_AUTH_TOKEN"));
    if (!hasText(accountSid) || !hasText(authToken)) {
      throw new IllegalStateException("Twilio credentials are missing");
    }
    String form = toFormUrlEncoded(fields);
    String auth = Base64.getEncoder().encodeToString((accountSid + ":" + authToken).getBytes(StandardCharsets.UTF_8));
    HttpRequest request =
        HttpRequest.newBuilder()
            .uri(URI.create("https://api.twilio.com/2010-04-01/Accounts/" + accountSid + "/Messages.json"))
            .header("Authorization", "Basic " + auth)
            .header("Content-Type", "application/x-www-form-urlencoded")
            .POST(HttpRequest.BodyPublishers.ofString(form))
            .build();
    try {
      HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());
      int code = response.statusCode();
      if (code < 200 || code >= 300) {
        throw new IllegalStateException("Twilio API rejected request (" + code + "): " + response.body());
      }
    } catch (IOException | InterruptedException ex) {
      Thread.currentThread().interrupt();
      throw new IllegalStateException("Twilio API call failed", ex);
    }
  }

  private String orderStatusTemplateSid(OrderStatus status) {
    return switch (status) {
      case placed -> trim(env("TWILIO_WHATSAPP_TEMPLATE_PLACED_SID"));
      case confirmed -> trim(env("TWILIO_WHATSAPP_TEMPLATE_CONFIRMED_SID"));
      case processing -> trim(env("TWILIO_WHATSAPP_TEMPLATE_PROCESSING_SID"));
      case shipped -> trim(env("TWILIO_WHATSAPP_TEMPLATE_SHIPPED_SID"));
      case delivered -> trim(env("TWILIO_WHATSAPP_TEMPLATE_DELIVERED_SID"));
      case cancelled -> trim(env("TWILIO_WHATSAPP_TEMPLATE_CANCELLED_SID"));
      default -> "";
    };
  }

  private static String orderStatusMessage(String orderId, OrderStatus status, String orderLink) {
    String oid = hasText(orderId) ? orderId : "your order";
    String link = hasText(orderLink) ? orderLink : "/orders/" + oid;
    return switch (status) {
      case placed ->
          "Order update: placed\nOrder: " + oid + "\nView order: " + link;
      case confirmed ->
          "Order update: confirmed\nOrder: " + oid + "\nView order: " + link;
      case processing ->
          "Order update: processing\nOrder: " + oid + "\nView order: " + link;
      case shipped ->
          "Order update: shipped\nOrder: " + oid + "\nView order: " + link;
      case delivered ->
          "Order update: delivered\nOrder: " + oid + "\nView order: " + link;
      case cancelled ->
          "Order update: cancelled\nOrder: " + oid + "\nView order: " + link;
      default -> null;
    };
  }

  private static String contentVariables(String orderId, String orderLink) {
    String oid = orderId != null ? orderId : "";
    String link = hasText(orderLink) ? orderLink : "/orders/" + oid;
    return jsonOf(Map.of("order_number", oid, "date", DEFAULT_ORDER_DATE_TEXT, "order_link", link));
  }

  private String orderViewLink(String orderId) {
    String oid = orderId != null ? orderId.trim() : "";
    String base =
        firstNonBlank(
            env("APP_PUBLIC_WEB_URL"),
            env("APP_FRONTEND_BASE_URL"),
            firstCsvValue(env("APP_CORS_ALLOWED_ORIGINS")));
    if (!hasText(base)) {
      return "/orders/" + oid;
    }
    String normalized = trim(base).replaceAll("/+$", "");
    return normalized + "/orders/" + oid;
  }

  private static String firstCsvValue(String csv) {
    if (!hasText(csv)) return "";
    String[] parts = csv.split(",");
    for (String p : parts) {
      if (hasText(p)) return p.trim();
    }
    return "";
  }

  private static String firstNonBlank(String... values) {
    for (String v : values) {
      if (hasText(v)) return v.trim();
    }
    return "";
  }

  private static String jsonOf(Map<String, String> values) {
    try {
      return OBJECT_MAPPER.writeValueAsString(values);
    } catch (JsonProcessingException ex) {
      throw new IllegalStateException("Failed to serialize WhatsApp content variables", ex);
    }
  }

  private String fromNumber() {
    String from = trim(env("TWILIO_WHATSAPP_FROM"));
    if (!hasText(from)) {
      throw new IllegalStateException("TWILIO_WHATSAPP_FROM is missing");
    }
    return from;
  }

  private String normalizeTo(String phoneDigits) {
    String raw = phoneDigits == null ? "" : phoneDigits.trim();
    if (raw.isBlank()) {
      throw new IllegalArgumentException("Phone number is empty");
    }
    // Accept +91xxxxxxxxxx / 91xxxxxxxxxx / xxxxxxxxxx and normalize to E.164 India.
    String digits = raw.startsWith("+") ? raw.substring(1) : raw;
    digits = digits.replaceAll("\\D", "");
    if (digits.length() == 10) {
      digits = "91" + digits;
    } else if (digits.length() == 12 && digits.startsWith("91")) {
      // Already normalized for India.
    } else {
      throw new IllegalArgumentException("Unsupported phone number format");
    }
    return "whatsapp:+" + digits;
  }

  private String env(String key) {
    String value = environment.getProperty(key);
    if (value == null || value.isBlank()) {
      value = System.getenv(key);
    }
    return value;
  }

  private boolean bool(String key, boolean fallback) {
    String v = env(key);
    if (!hasText(v)) return fallback;
    return "true".equalsIgnoreCase(v.trim()) || "1".equals(v.trim()) || "yes".equalsIgnoreCase(v.trim());
  }

  private static String toFormUrlEncoded(Map<String, String> fields) {
    List<String> pairs = new ArrayList<>();
    for (Map.Entry<String, String> e : fields.entrySet()) {
      String k = URLEncoder.encode(e.getKey(), StandardCharsets.UTF_8);
      String v = URLEncoder.encode(e.getValue() == null ? "" : e.getValue(), StandardCharsets.UTF_8);
      pairs.add(k + "=" + v);
    }
    return String.join("&", pairs);
  }

  private static String trim(String value) {
    return value == null ? "" : value.trim();
  }

  private static boolean hasText(String value) {
    return value != null && !value.trim().isEmpty();
  }
}
