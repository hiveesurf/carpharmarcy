package com.carnalysys.web.v1;

import com.carnalysys.api.ApiEnvelope;
import com.carnalysys.service.WishlistService;
import com.carnalysys.web.support.ApiResponses;
import com.carnalysys.web.support.AuthSupport;
import jakarta.servlet.http.HttpServletRequest;
import java.util.Map;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/wishlist")
public class WishlistV1Controller {

  private final WishlistService wishlistService;

  public WishlistV1Controller(WishlistService wishlistService) {
    this.wishlistService = wishlistService;
  }

  @GetMapping
  public ApiEnvelope<Map<String, Object>> list(HttpServletRequest req) {
    return ApiResponses.ok(req, Map.of("items", wishlistService.list(AuthSupport.requireUser())));
  }

  @PostMapping("/toggle")
  public ApiEnvelope<Map<String, Object>> toggle(
      HttpServletRequest req, @RequestBody Map<String, Object> body) {
    String productId = String.valueOf(body.get("productId"));
    return ApiResponses.ok(req, wishlistService.toggle(AuthSupport.requireUser(), productId));
  }
}
