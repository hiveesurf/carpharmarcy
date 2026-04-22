package com.carnalysys.web.v1;

import com.carnalysys.api.ApiEnvelope;
import com.carnalysys.api.ApiException;
import com.carnalysys.service.CartService;
import com.carnalysys.service.IdempotencyService;
import com.carnalysys.web.support.ApiResponses;
import com.carnalysys.web.support.AuthSupport;
import com.carnalysys.web.support.GuestRequest;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import java.util.Optional;
import java.util.Objects;
import java.util.Map;
import java.util.UUID;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseCookie;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/cart")
public class CartV1Controller {

  private static final int GUEST_COOKIE_MAX_AGE = 30 * 24 * 3600;

  private final CartService cartService;
  private final IdempotencyService idempotencyService;

  public CartV1Controller(CartService cartService, IdempotencyService idempotencyService) {
    this.cartService = cartService;
    this.idempotencyService = idempotencyService;
  }

  @GetMapping
  public ApiEnvelope<Map<String, Object>> get(HttpServletRequest req) {
    var snap = cartService.resolveCart(AuthSupport.optionalUser(), GuestRequest.guestId(req), false);
    return ApiResponses.ok(req, cartService.getCartView(snap.cart()));
  }

  @PostMapping
  public ApiEnvelope<Map<String, Object>> add(
      HttpServletRequest req,
      HttpServletResponse resp,
      @RequestBody Map<String, Object> body,
      @RequestHeader(name = "Idempotency-Key", required = false) String idempotencyKey) {
    Optional<UUID> userId = AuthSupport.optionalUser();
    Optional<UUID> guestId = GuestRequest.guestId(req);
    String actorKey = idempotencyService.actorKey(userId, guestId);
    String requestHash = idempotencyService.requestHash("cart.add", actorKey, body);
    var access = idempotencyService.begin("cart.add", actorKey, idempotencyKey, requestHash);
    if (access.replayData() != null) {
      return ApiResponses.ok(req, access.replayData());
    }
    String productId = String.valueOf(body.get("productId"));
    int qty = body.get("quantity") instanceof Number n ? n.intValue() : 1;
    boolean guestNeedsCookie = userId.isEmpty();
    try {
      var result = cartService.addItem(userId, guestId, productId, qty);
      UUID newGuest = (UUID) result.get("_newGuest");
      if (guestNeedsCookie && newGuest != null) {
        String guestSessionId = newGuest.toString();
        ResponseCookie cookie =
            ResponseCookie.from("guestSession", Objects.requireNonNull(guestSessionId))
                .httpOnly(true)
                .sameSite("Lax")
                .path("/")
                .maxAge(GUEST_COOKIE_MAX_AGE)
                .build();
        resp.addHeader(HttpHeaders.SET_COOKIE, cookie.toString());
        result.put("guestSessionId", guestSessionId);
      }
      result.remove("_newGuest");
      idempotencyService.complete(access.entity(), HttpStatus.OK.value(), result);
      return ApiResponses.ok(req, result);
    } catch (ApiException ex) {
      idempotencyService.fail(access.entity(), ex.code());
      throw ex;
    } catch (RuntimeException ex) {
      idempotencyService.fail(access.entity(), "INTERNAL_ERROR");
      throw ex;
    }
  }

  @DeleteMapping
  public ApiEnvelope<Map<String, Object>> clear(HttpServletRequest req) {
    cartService.clearCart(AuthSupport.optionalUser(), GuestRequest.guestId(req));
    return ApiResponses.ok(req, Map.of("cleared", true));
  }

  @PutMapping("/{itemId}")
  public ApiEnvelope<Map<String, Object>> update(
      HttpServletRequest req,
      @PathVariable String itemId,
      @RequestBody Map<String, Object> body) {
    int quantity =
        body.get("quantity") instanceof Number n ? n.intValue() : Integer.parseInt(String.valueOf(body.get("quantity")));
    return ApiResponses.ok(
        req,
        cartService.updateLine(
            AuthSupport.optionalUser(), GuestRequest.guestId(req), UUID.fromString(itemId), quantity));
  }

  @DeleteMapping("/{itemId}")
  public ApiEnvelope<Map<String, Object>> remove(
      HttpServletRequest req, @PathVariable String itemId) {
    return ApiResponses.ok(
        req,
        cartService.removeLine(
            AuthSupport.optionalUser(), GuestRequest.guestId(req), UUID.fromString(itemId)));
  }
}
