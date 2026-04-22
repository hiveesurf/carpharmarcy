package com.carnalysys.web.v1;

import com.carnalysys.api.ApiEnvelope;
import com.carnalysys.config.AppProperties;
import com.carnalysys.security.AdminSessionService;
import com.carnalysys.service.AdminApiService;
import com.carnalysys.service.NotificationService;
import com.carnalysys.web.dto.AdminLoginRequest;
import com.carnalysys.web.support.ApiResponses;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.security.core.context.SecurityContextHolder;
import java.util.Map;
import org.springframework.http.HttpHeaders;
import org.springframework.http.ResponseCookie;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.util.WebUtils;

@RestController
@RequestMapping("/api/v1/admin")
public class AdminV1Controller {

  private final AdminApiService adminApiService;
  private final AppProperties appProperties;
  private final NotificationService notificationService;

  public AdminV1Controller(
      AdminApiService adminApiService,
      AppProperties appProperties,
      NotificationService notificationService) {
    this.adminApiService = adminApiService;
    this.appProperties = appProperties;
    this.notificationService = notificationService;
  }

  @PostMapping("/auth/login")
  public ApiEnvelope<Map<String, Object>> login(
      HttpServletRequest req,
      HttpServletResponse resp,
      @Valid @RequestBody AdminLoginRequest body) {
    String token = adminApiService.loginAndCreateSession(body.email(), body.password());
    ResponseCookie cookie =
        ResponseCookie.from(AdminSessionService.COOKIE_NAME, token)
            .httpOnly(true)
            .sameSite("Lax")
            .path("/")
            .maxAge(appProperties.admin().sessionTtlSeconds())
            .build();
    resp.addHeader(HttpHeaders.SET_COOKIE, cookie.toString());
    return ApiResponses.ok(req, Map.of("ok", true));
  }

  @PostMapping("/auth/logout")
  public ApiEnvelope<Map<String, Object>> logout(HttpServletRequest req, HttpServletResponse resp) {
    var existing = WebUtils.getCookie(req, AdminSessionService.COOKIE_NAME);
    if (existing != null) {
      ResponseCookie clear =
          ResponseCookie.from(AdminSessionService.COOKIE_NAME, "")
              .httpOnly(true)
              .sameSite("Lax")
              .path("/")
              .maxAge(0)
              .build();
      resp.addHeader(HttpHeaders.SET_COOKIE, clear.toString());
    }
    SecurityContextHolder.clearContext();
    return ApiResponses.ok(req, Map.of("ok", true));
  }

  @GetMapping("/dashboard")
  public ApiEnvelope<Map<String, Object>> dashboard(HttpServletRequest req) {
    return ApiResponses.ok(req, adminApiService.dashboard());
  }

  @GetMapping("/products")
  public ApiEnvelope<Map<String, Object>> products(
      HttpServletRequest req,
      @RequestParam(required = false) Integer page,
      @RequestParam(required = false) Integer pageSize,
      @RequestParam(required = false) String sort) {
    int p = page != null ? page : 0;
    int size = pageSize != null ? pageSize : 20;
    String s = sort != null && !sort.isBlank() ? sort : "created_desc";
    return ApiResponses.ok(req, adminApiService.listProductsPage(p, size, s));
  }

  @GetMapping("/cars")
  public ApiEnvelope<Map<String, Object>> cars(
      HttpServletRequest req,
      @RequestParam(name = "published", required = false) Boolean published,
      @RequestParam(name = "brand", required = false) String brand,
      @RequestParam(name = "page", defaultValue = "0") Integer page,
      @RequestParam(name = "size", defaultValue = "5") Integer size) {
    boolean onlyPublished = Boolean.TRUE.equals(published);
    return ApiResponses.ok(req, adminApiService.listCarsAdminPage(onlyPublished, brand, page, size));
  }

  @GetMapping("/cars/{id}")
  public ApiEnvelope<Map<String, Object>> getCar(HttpServletRequest req, @PathVariable String id) {
    return ApiResponses.ok(req, adminApiService.getCarAdmin(id));
  }

  @PostMapping("/cars")
  public ApiEnvelope<Map<String, Object>> createCar(
      HttpServletRequest req, @RequestBody Map<String, Object> body) {
    return ApiResponses.ok(req, adminApiService.upsertCar(null, body));
  }

  @PutMapping("/cars/{id}")
  public ApiEnvelope<Map<String, Object>> updateCar(
      HttpServletRequest req, @PathVariable String id, @RequestBody Map<String, Object> body) {
    return ApiResponses.ok(req, adminApiService.upsertCar(id, body));
  }

  @DeleteMapping("/cars/{id}")
  public ApiEnvelope<Map<String, Object>> deleteCar(HttpServletRequest req, @PathVariable String id) {
    return ApiResponses.ok(req, adminApiService.deleteCar(id));
  }

  @GetMapping("/products/{id}")
  public ApiEnvelope<Map<String, Object>> getProduct(
      HttpServletRequest req, @PathVariable String id) {
    return ApiResponses.ok(req, adminApiService.getProductAdmin(id));
  }

  @PostMapping("/products")
  public ApiEnvelope<Map<String, Object>> createProduct(
      HttpServletRequest req, @RequestBody Map<String, Object> body) {
    return ApiResponses.ok(req, adminApiService.upsertProduct(body, null));
  }

  @PutMapping("/products/{id}")
  public ApiEnvelope<Map<String, Object>> updateProduct(
      HttpServletRequest req, @PathVariable String id, @RequestBody Map<String, Object> body) {
    return ApiResponses.ok(req, adminApiService.upsertProduct(body, id));
  }

  @DeleteMapping("/products/{id}")
  public ApiEnvelope<Map<String, Object>> deleteProduct(HttpServletRequest req, @PathVariable String id) {
    return ApiResponses.ok(req, adminApiService.deleteProduct(id));
  }

  @PatchMapping("/products/{id}/publish")
  public ApiEnvelope<Map<String, Object>> publish(
      HttpServletRequest req, @PathVariable String id, @RequestBody Map<String, Object> body) {
    boolean published = body == null || body.get("published") == null || Boolean.TRUE.equals(body.get("published"));
    return ApiResponses.ok(req, adminApiService.patchPublish(id, published));
  }

  @GetMapping("/categories")
  public ApiEnvelope<Map<String, Object>> categories(
      HttpServletRequest req,
      @RequestParam(name = "page", defaultValue = "0") Integer page,
      @RequestParam(name = "size", defaultValue = "5") Integer size) {
    return ApiResponses.ok(req, adminApiService.listCategoriesPage(page, size));
  }

  @GetMapping("/categories/overview")
  public ApiEnvelope<Map<String, Object>> categoriesOverview(HttpServletRequest req) {
    return ApiResponses.ok(req, adminApiService.categoriesOverview());
  }

  @PostMapping("/categories")
  public ApiEnvelope<Map<String, Object>> createCategory(
      HttpServletRequest req, @RequestBody Map<String, Object> body) {
    String name = body != null ? String.valueOf(body.get("name")) : "";
    return ApiResponses.ok(req, adminApiService.createCategory(name));
  }

  @PutMapping("/categories/{id}")
  public ApiEnvelope<Map<String, Object>> updateCategory(
      HttpServletRequest req, @PathVariable String id, @RequestBody Map<String, Object> body) {
    return ApiResponses.ok(req, adminApiService.updateCategory(id, body));
  }

  @DeleteMapping("/categories/{id}")
  public ApiEnvelope<Map<String, Object>> deleteCategory(HttpServletRequest req, @PathVariable String id) {
    return ApiResponses.ok(req, adminApiService.deleteCategory(id));
  }

  @GetMapping("/orders")
  public ApiEnvelope<Map<String, Object>> orders(
      HttpServletRequest req,
      @RequestParam(required = false) String phone,
      @RequestParam(name = "page", defaultValue = "0") Integer page,
      @RequestParam(name = "size", defaultValue = "5") Integer size) {
    return ApiResponses.ok(req, adminApiService.listOrdersAdminPage(phone, page, size));
  }

  @PatchMapping("/orders/{id}/status")
  public ApiEnvelope<Map<String, Object>> orderStatus(
      HttpServletRequest req, @PathVariable String id, @RequestBody Map<String, Object> body) {
    String status = String.valueOf(body.getOrDefault("status", ""));
    return ApiResponses.ok(req, adminApiService.patchOrderStatus(id, status));
  }

  @PatchMapping("/orders/{id}/assign-delivery")
  public ApiEnvelope<Map<String, Object>> assignDelivery(
      HttpServletRequest req, @PathVariable String id, @RequestBody Map<String, Object> body) {
    String email = body == null ? "" : String.valueOf(body.getOrDefault("deliveryAdminEmail", ""));
    return ApiResponses.ok(req, adminApiService.assignDelivery(id, email));
  }

  @GetMapping("/delivery/orders")
  public ApiEnvelope<Map<String, Object>> deliveryOrders(HttpServletRequest req) {
    return ApiResponses.ok(req, Map.of("items", adminApiService.listDeliveryOrdersForCurrent()));
  }

  @GetMapping("/users")
  public ApiEnvelope<Map<String, Object>> users(
      HttpServletRequest req,
      @RequestParam(name = "page", defaultValue = "0") Integer page,
      @RequestParam(name = "size", defaultValue = "5") Integer size) {
    return ApiResponses.ok(req, adminApiService.listUsersPage(page, size));
  }

  @GetMapping("/users/{id}")
  public ApiEnvelope<Map<String, Object>> user(HttpServletRequest req, @PathVariable String id) {
    return ApiResponses.ok(req, adminApiService.getUserAdmin(id));
  }

  @GetMapping("/employees")
  public ApiEnvelope<Map<String, Object>> employees(
      HttpServletRequest req,
      @RequestParam(name = "page", defaultValue = "0") Integer page,
      @RequestParam(name = "size", defaultValue = "5") Integer size) {
    return ApiResponses.ok(req, adminApiService.listEmployeesPage(page, size));
  }

  @PostMapping("/employees")
  public ApiEnvelope<Map<String, Object>> createEmployee(
      HttpServletRequest req, @RequestBody Map<String, Object> body) {
    return ApiResponses.ok(req, adminApiService.createEmployee(body));
  }

  @PatchMapping("/employees/{phone}/availability")
  public ApiEnvelope<Map<String, Object>> setAvailability(
      HttpServletRequest req, @PathVariable String phone, @RequestBody Map<String, Object> body) {
    String value = body == null ? "" : String.valueOf(body.getOrDefault("availability", ""));
    return ApiResponses.ok(req, adminApiService.setEmployeeAvailability(phone, value));
  }

  @GetMapping("/products/{id}/audit")
  public ApiEnvelope<Map<String, Object>> productAudit(HttpServletRequest req, @PathVariable String id) {
    return ApiResponses.ok(req, Map.of("items", adminApiService.productAuditHistory(id)));
  }

  @GetMapping("/notifications")
  public ApiEnvelope<Map<String, Object>> notifications(
      HttpServletRequest req,
      @RequestParam(name = "cursor", required = false) String cursor,
      @RequestParam(name = "limit", defaultValue = "20") int limit,
      @RequestParam(name = "unreadOnly", defaultValue = "false") boolean unreadOnly) {
    String adminEmail = currentAdminEmail();
    java.time.Instant c = null;
    if (cursor != null && !cursor.isBlank()) {
      try {
        c = java.time.Instant.parse(cursor.trim());
      } catch (java.time.format.DateTimeParseException ignored) {
        c = null;
      }
    }
    try {
      return ApiResponses.ok(
          req,
          notificationService.list(
              NotificationService.RECIPIENT_ADMIN, adminEmail, c, limit, unreadOnly));
    } catch (RuntimeException ex) {
      return ApiResponses.ok(
          req, Map.of("items", java.util.List.of(), "nextCursor", null, "unreadCount", 0, "hasMore", false));
    }
  }

  @PostMapping("/notifications/read")
  public ApiEnvelope<Map<String, Object>> markRead(
      HttpServletRequest req, @RequestBody(required = false) Map<String, Object> body) {
    String adminEmail = currentAdminEmail();
    boolean all = body != null && Boolean.TRUE.equals(body.get("all"));
    @SuppressWarnings("unchecked")
    java.util.List<String> ids =
        body != null && body.get("ids") instanceof java.util.List<?> list
            ? list.stream().map(String::valueOf).toList()
            : java.util.List.of();
    int changed =
        notificationService.markRead(
            NotificationService.RECIPIENT_ADMIN, adminEmail, ids, all);
    return ApiResponses.ok(req, Map.of("updated", changed));
  }

  @PostMapping("/notifications/push/subscribe")
  public ApiEnvelope<Map<String, Object>> subscribePush(
      HttpServletRequest req,
      @RequestBody(required = false) Map<String, Object> body,
      @RequestHeader(name = "User-Agent", required = false) String userAgent) {
    String adminEmail = currentAdminEmail();
    Map<String, Object> b = body != null ? body : Map.of();
    String endpoint = b.get("endpoint") != null ? String.valueOf(b.get("endpoint")) : null;
    @SuppressWarnings("unchecked")
    Map<String, Object> keys =
        b.get("keys") instanceof Map<?, ?> km
            ? (Map<String, Object>) km
            : Map.of();
    String p256dh = keys.get("p256dh") != null ? String.valueOf(keys.get("p256dh")) : null;
    String auth = keys.get("auth") != null ? String.valueOf(keys.get("auth")) : null;
    notificationService.upsertPushSubscription(
        NotificationService.RECIPIENT_ADMIN, adminEmail, endpoint, p256dh, auth, userAgent);
    return ApiResponses.ok(req, Map.of("subscribed", true));
  }

  @PostMapping("/notifications/push/unsubscribe")
  public ApiEnvelope<Map<String, Object>> unsubscribePush(
      HttpServletRequest req, @RequestBody(required = false) Map<String, Object> body) {
    String adminEmail = currentAdminEmail();
    String endpoint = body != null && body.get("endpoint") != null ? String.valueOf(body.get("endpoint")) : null;
    long removed =
        notificationService.removePushSubscription(
            NotificationService.RECIPIENT_ADMIN, adminEmail, endpoint);
    return ApiResponses.ok(req, Map.of("removed", removed));
  }

  private static String currentAdminEmail() {
    var auth = SecurityContextHolder.getContext().getAuthentication();
    if (auth == null || !auth.isAuthenticated()) {
      return "";
    }
    return String.valueOf(auth.getName()).trim().toLowerCase();
  }
}
