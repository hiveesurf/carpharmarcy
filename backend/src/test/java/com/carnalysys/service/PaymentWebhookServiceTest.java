package com.carnalysys.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.verifyNoInteractions;
import static org.mockito.Mockito.when;

import com.carnalysys.api.ApiException;
import com.carnalysys.config.AppProperties;
import com.carnalysys.domain.OrderEntity;
import com.carnalysys.domain.OrderStatus;
import com.carnalysys.domain.PaymentStatus;
import com.carnalysys.domain.PaymentEventEntity;
import com.carnalysys.domain.PaymentMethod;
import com.carnalysys.domain.PaymentTransactionEntity;
import com.carnalysys.domain.UserEntity;
import com.carnalysys.repo.OrderRepository;
import com.carnalysys.repo.PaymentEventRepository;
import com.carnalysys.repo.PaymentTransactionRepository;
import com.fasterxml.jackson.databind.ObjectMapper;
import java.nio.charset.StandardCharsets;
import java.util.HexFormat;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;
import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpStatus;

@ExtendWith(MockitoExtension.class)
class PaymentWebhookServiceTest {

  private static final String SECRET = "unit-test-webhook-secret";

  @Mock private OrderRepository orderRepository;
  @Mock private OrderService orderService;
  @Mock private PaymentEventRepository paymentEventRepository;
  @Mock private PaymentTransactionRepository paymentTransactionRepository;
  @Mock private NotificationService notificationService;
  @Mock private ObjectMapper objectMapper;
  @Mock private AppProperties appProperties;
  @Mock private AppProperties.Payment paymentProperties;

  @InjectMocks private PaymentWebhookService paymentWebhookService;

  @Test
  void processRejectsMissingSignature() {
    assertThatThrownBy(
            () ->
                paymentWebhookService.process(
                    "",
                    "mockpay",
                    "evt-1",
                    0,
                    Map.of("orderId", "ord_1", "status", "paid")))
        .isInstanceOf(ApiException.class)
        .satisfies(
            ex -> {
              ApiException ae = (ApiException) ex;
              assertThat(ae.status()).isEqualTo(HttpStatus.UNAUTHORIZED);
              assertThat(ae.code()).isEqualTo("WEBHOOK_SIGNATURE_INVALID");
            });
  }

  @Test
  void processReturnsReplayWhenEventAlreadyProcessed() throws Exception {
    Map<String, Object> payload = Map.of("orderId", "ord_1", "status", "paid");
    String raw = new ObjectMapper().writeValueAsString(payload);
    String signature = hmacSha256(raw, SECRET);

    when(appProperties.payment()).thenReturn(paymentProperties);
    when(paymentProperties.webhookSecret()).thenReturn(SECRET);
    when(paymentEventRepository.findByProviderAndProviderEventId("mockpay", "evt-1"))
        .thenReturn(Optional.of(new PaymentEventEntity()));
    when(objectMapper.writeValueAsString(payload)).thenReturn(raw);

    Map<String, Object> result =
        paymentWebhookService.process(signature, "mockpay", "evt-1", 0, payload);

    assertThat(result).containsEntry("accepted", true).containsEntry("replayed", true);
    verifyNoInteractions(orderRepository, orderService);
  }

  @Test
  void processTrustedPaidMovesCancelledOrderToConfirmed() {
    OrderEntity order = new OrderEntity();
    order.setId("ord_retry");
    UserEntity user = new UserEntity();
    user.setId(UUID.fromString("bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb"));
    order.setUser(user);
    order.setStatus(OrderStatus.cancelled);
    order.setPaymentStatus(PaymentStatus.pending);
    order.setPaymentMethod(PaymentMethod.upi);
    PaymentTransactionEntity tx = new PaymentTransactionEntity();
    tx.setOrder(order);
    tx.setProvider("razorpay");

    when(paymentEventRepository.findByProviderAndProviderEventId("razorpay", "checkout_pay_1"))
        .thenReturn(Optional.empty());
    when(orderRepository.findByIdForUpdate("ord_retry")).thenReturn(Optional.of(order));
    when(paymentTransactionRepository.findByProviderAndProviderPaymentId("razorpay", "pay_1"))
        .thenReturn(Optional.of(tx));
    when(orderRepository.save(any(OrderEntity.class))).thenAnswer(invocation -> invocation.getArgument(0));
    when(paymentTransactionRepository.save(any(PaymentTransactionEntity.class)))
        .thenAnswer(invocation -> invocation.getArgument(0));
    when(paymentEventRepository.save(any(PaymentEventEntity.class)))
        .thenAnswer(invocation -> invocation.getArgument(0));

    Map<String, Object> result =
        paymentWebhookService.processTrusted(
            "razorpay",
            "checkout_pay_1",
            1710000000L,
            Map.of(
                "orderId", "ord_retry",
                "status", "paid",
                "transactionId", "pay_1",
                "paymentOrderId", "order_1"));

    assertThat(result).containsEntry("accepted", true).containsEntry("orderStatus", "confirmed");
    assertThat(order.getStatus()).isEqualTo(OrderStatus.confirmed);
    assertThat(order.getPaymentStatus()).isEqualTo(PaymentStatus.paid);
  }

  private static String hmacSha256(String value, String secret) throws Exception {
    Mac hmac = Mac.getInstance("HmacSHA256");
    hmac.init(new SecretKeySpec(secret.getBytes(StandardCharsets.UTF_8), "HmacSHA256"));
    return HexFormat.of().formatHex(hmac.doFinal(value.getBytes(StandardCharsets.UTF_8)));
  }
}
