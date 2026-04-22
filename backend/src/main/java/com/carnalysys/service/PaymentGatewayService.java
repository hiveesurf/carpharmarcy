package com.carnalysys.service;

import com.carnalysys.api.ApiException;
import com.carnalysys.domain.PaymentTransactionEntity;
import java.util.LinkedHashMap;
import java.util.Map;
import java.util.UUID;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class PaymentGatewayService {

  private final OrderService orderService;
  private final RazorpayPaymentService razorpayPaymentService;
  private final PaymentWebhookService paymentWebhookService;

  public PaymentGatewayService(
      OrderService orderService,
      RazorpayPaymentService razorpayPaymentService,
      PaymentWebhookService paymentWebhookService) {
    this.orderService = orderService;
    this.razorpayPaymentService = razorpayPaymentService;
    this.paymentWebhookService = paymentWebhookService;
  }

  @Transactional
  public Map<String, Object> initiateRazorpay(UUID userId, String orderId) {
    if (orderId == null || orderId.isBlank()) {
      throw new ApiException(HttpStatus.BAD_REQUEST, "VALIDATION_ERROR", "orderId is required");
    }
    PaymentTransactionEntity transaction =
        orderService.createPaymentTransactionForOrder(userId, orderId, "razorpay");
    Map<String, Object> providerOrder =
        razorpayPaymentService.createOrder(orderId, transaction.getAmountInr(), transaction.getCurrency());
    String razorpayOrderId = asString(providerOrder.get("id"));
    if (razorpayOrderId == null) {
      throw new ApiException(
          HttpStatus.BAD_GATEWAY, "PAYMENT_PROVIDER_ERROR", "Razorpay response missing order id");
    }
    orderService.attachProviderOrderToTransaction(
        transaction, razorpayOrderId, "rzp_order_" + transaction.getId());

    Map<String, Object> response = new LinkedHashMap<>();
    response.put("provider", "razorpay");
    response.put("orderId", orderId);
    response.put("transactionId", transaction.getId().toString());
    response.put("razorpayOrderId", razorpayOrderId);
    response.put("amount", providerOrder.getOrDefault("amount", transaction.getAmountInr()));
    response.put("currency", providerOrder.getOrDefault("currency", transaction.getCurrency()));
    response.put("keyId", razorpayPaymentService.keyId());
    response.put("status", "created");
    return response;
  }

  @Transactional
  public Map<String, Object> confirmRazorpayCheckout(UUID userId, Map<String, Object> body) {
    String orderId = asString(body.get("orderId"));
    String razorpayOrderId = asString(body.get("razorpayOrderId"));
    String razorpayPaymentId = asString(body.get("razorpayPaymentId"));
    String razorpaySignature = asString(body.get("razorpaySignature"));
    if (orderId == null || razorpayOrderId == null || razorpayPaymentId == null || razorpaySignature == null) {
      throw new ApiException(
          HttpStatus.BAD_REQUEST,
          "VALIDATION_ERROR",
          "orderId, razorpayOrderId, razorpayPaymentId and razorpaySignature are required");
    }
    orderService.getMine(userId, orderId);
    if (!razorpayPaymentService.verifyCheckoutSignature(
        razorpayOrderId, razorpayPaymentId, razorpaySignature)) {
      throw new ApiException(
          HttpStatus.UNAUTHORIZED, "PAYMENT_SIGNATURE_INVALID", "Razorpay signature verification failed");
    }
    // Reuse webhook transition path for consistent status handling and auditing.
    Map<String, Object> internalPayload =
        Map.of(
            "orderId", orderId,
            "status", "paid",
            "transactionId", razorpayPaymentId,
            "paymentOrderId", razorpayOrderId);
    long now = System.currentTimeMillis() / 1000;
    return paymentWebhookService.processTrusted(
        "razorpay", "checkout_" + razorpayPaymentId, now, internalPayload);
  }

  private static String asString(Object value) {
    if (value == null) return null;
    String str = String.valueOf(value).trim();
    return str.isEmpty() ? null : str;
  }

}
