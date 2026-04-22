package com.carnalysys.web.v1;

import com.carnalysys.api.ApiEnvelope;
import com.carnalysys.service.PaymentGatewayService;
import com.carnalysys.service.PaymentWebhookService;
import com.carnalysys.web.support.ApiResponses;
import com.carnalysys.web.support.AuthSupport;
import jakarta.servlet.http.HttpServletRequest;
import java.util.Map;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/payments")
public class PaymentV1Controller {

  private final PaymentWebhookService paymentWebhookService;
  private final PaymentGatewayService paymentGatewayService;

  public PaymentV1Controller(
      PaymentWebhookService paymentWebhookService, PaymentGatewayService paymentGatewayService) {
    this.paymentWebhookService = paymentWebhookService;
    this.paymentGatewayService = paymentGatewayService;
  }

  @PostMapping("/initiate")
  public ApiEnvelope<Map<String, Object>> initiate(
      HttpServletRequest req, @RequestBody Map<String, Object> body) {
    String orderId = body.get("orderId") != null ? String.valueOf(body.get("orderId")) : null;
    return ApiResponses.ok(req, paymentGatewayService.initiateRazorpay(AuthSupport.requireUser(), orderId));
  }

  @PostMapping("/confirm")
  public ApiEnvelope<Map<String, Object>> confirm(
      HttpServletRequest req, @RequestBody Map<String, Object> body) {
    return ApiResponses.ok(
        req, paymentGatewayService.confirmRazorpayCheckout(AuthSupport.requireUser(), body));
  }

  @PostMapping("/webhook")
  public ApiEnvelope<Map<String, Object>> webhook(
      HttpServletRequest req,
      @RequestBody Map<String, Object> body,
      @RequestHeader(name = "X-Signature") String signature,
      @RequestHeader(name = "X-Provider", required = false) String provider,
      @RequestHeader(name = "X-Event-Id", required = false) String eventId,
      @RequestHeader(name = "X-Event-Timestamp", required = false) Long eventTs) {
    String resolvedEventId =
        eventId != null && !eventId.isBlank()
            ? eventId
            : (body.get("eventId") != null ? String.valueOf(body.get("eventId")) : null);
    long ts =
        eventTs != null
            ? eventTs
            : (body.get("timestamp") instanceof Number n ? n.longValue() : 0L);
    return ApiResponses.ok(
        req, paymentWebhookService.process(signature, provider, resolvedEventId, ts, body));
  }
}
