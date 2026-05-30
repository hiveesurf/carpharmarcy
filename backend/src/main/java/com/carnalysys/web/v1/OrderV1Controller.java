package com.carnalysys.web.v1;

import com.carnalysys.api.ApiEnvelope;
import com.carnalysys.api.ApiException;
import com.carnalysys.service.IdempotencyService;
import com.carnalysys.service.OrderService;
import com.carnalysys.web.support.ApiResponses;
import com.carnalysys.web.support.AuthSupport;
import jakarta.servlet.http.HttpServletRequest;
import java.util.Map;
import java.util.Optional;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/orders")
public class OrderV1Controller {

  private final OrderService orderService;
  private final IdempotencyService idempotencyService;

  public OrderV1Controller(OrderService orderService, IdempotencyService idempotencyService) {
    this.orderService = orderService;
    this.idempotencyService = idempotencyService;
  }

  @PostMapping
  public ApiEnvelope<Map<String, Object>> place(
      HttpServletRequest req,
      @RequestBody(required = false) Map<String, Object> body,
      @RequestHeader(name = "Idempotency-Key", required = false) String idempotencyKey) {
    final Map<String, Object> bodyMap = body != null ? body : Map.of();
    var userId = AuthSupport.requireUser();
    String actorKey = idempotencyService.actorKey(Optional.of(userId), Optional.empty());
    String requestHash = idempotencyService.requestHash("orders.place", actorKey, bodyMap);
    var access = idempotencyService.begin("orders.place", actorKey, idempotencyKey, requestHash);
    if (access.replayData() != null) {
      return ApiResponses.ok(req, access.replayData());
    }
    String addressId =
        bodyMap.get("addressId") != null ? String.valueOf(bodyMap.get("addressId")) : null;
    String paymentMethod =
        bodyMap.get("paymentMethod") != null ? String.valueOf(bodyMap.get("paymentMethod")) : null;
    String paymentTxnId =
        bodyMap.get("paymentTxnId") != null ? String.valueOf(bodyMap.get("paymentTxnId")) : null;
    String demoPaymentOutcome =
        bodyMap.get("demoPaymentOutcome") != null
            ? String.valueOf(bodyMap.get("demoPaymentOutcome"))
            : null;
    try {
      Map<String, Object> data =
          orderService.placeOrder(
              userId, addressId, paymentMethod, paymentTxnId, demoPaymentOutcome);
      idempotencyService.complete(access.entity(), HttpStatus.OK.value(), data);
      return ApiResponses.ok(req, data);
    } catch (ApiException ex) {
      idempotencyService.fail(access.entity(), ex.code());
      throw ex;
    } catch (RuntimeException ex) {
      idempotencyService.fail(access.entity(), "INTERNAL_ERROR");
      throw ex;
    }
  }

  @GetMapping
  public ApiEnvelope<Map<String, Object>> list(
      HttpServletRequest req,
      @RequestParam(name = "phone", required = false) String phone,
      @RequestParam(name = "page", defaultValue = "0") int page,
      @RequestParam(name = "size", defaultValue = "3") int size) {
    var userId = AuthSupport.requireUser();
    if (phone != null && !phone.isBlank()) {
      Map<String, Object> payload = orderService.listMineByPhonePage(userId, phone, page, size);
      Object items = payload.get("items");
      if (!(items instanceof java.util.List<?> list) || list.isEmpty()) {
        throw new ApiException(HttpStatus.NOT_FOUND, "NOT_FOUND", "No orders for this phone");
      }
      return ApiResponses.ok(req, payload);
    }
    return ApiResponses.ok(req, orderService.listMinePage(userId, page, size));
  }

  @GetMapping("/{id}")
  public ApiEnvelope<Map<String, Object>> one(HttpServletRequest req, @PathVariable String id) {
    return ApiResponses.ok(req, orderService.getMine(AuthSupport.requireUser(), id));
  }

  @GetMapping("/{id}/delivery-otp")
  public ApiEnvelope<Map<String, Object>> deliveryOtp(HttpServletRequest req, @PathVariable String id) {
    return ApiResponses.ok(req, orderService.getDeliveryOtpForOwner(AuthSupport.requireUser(), id));
  }
}
