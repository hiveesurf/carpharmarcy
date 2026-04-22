package com.carnalysys.service;

import com.carnalysys.api.ApiException;
import com.carnalysys.domain.Category;
import com.carnalysys.domain.CarModelEntity;
import com.carnalysys.domain.AdminUser;
import com.carnalysys.domain.OrderEntity;
import com.carnalysys.domain.OrderStatus;
import com.carnalysys.domain.Product;
import com.carnalysys.domain.ProductChangeAuditEntity;
import com.carnalysys.domain.ProductFitmentCar;
import com.carnalysys.domain.ProductFitmentLabel;
import com.carnalysys.domain.ProductType;
import com.carnalysys.domain.ProductVehicleSpec;
import com.carnalysys.domain.UserEntity;
import com.carnalysys.domain.UserRole;
import com.carnalysys.repo.CategoryRepository;
import com.carnalysys.repo.CarModelRepository;
import com.carnalysys.repo.OrderRepository;
import com.carnalysys.repo.OrderStatusAuditRepository;
import com.carnalysys.repo.ProductChangeAuditRepository;
import com.carnalysys.repo.ProductFitmentCarRepository;
import com.carnalysys.repo.ProductFitmentLabelRepository;
import com.carnalysys.repo.ProductRepository;
import com.carnalysys.repo.ProductVehicleSpecRepository;
import com.carnalysys.repo.AdminUserRepository;
import com.carnalysys.repo.UserProfileRepository;
import com.carnalysys.repo.UserRepository;
import com.carnalysys.repo.OrderLineRepository;
import com.carnalysys.security.AdminSessionService;
import com.carnalysys.util.SlugUtil;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ObjectNode;
import java.math.BigDecimal;
import java.time.Instant;
import java.time.ZoneOffset;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.HashMap;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.stream.Collectors;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class AdminApiService {

  private final AdminUserRepository adminUserRepository;
  private final PasswordEncoder passwordEncoder;
  private final AdminSessionService adminSessionService;
  private final UserRepository userRepository;
  private final UserProfileRepository userProfileRepository;
  private final OrderRepository orderRepository;
  private final CategoryRepository categoryRepository;
  private final OrderLineRepository orderLineRepository;
  private final OrderStatusAuditRepository orderStatusAuditRepository;
  private final ProductRepository productRepository;
  private final ProductChangeAuditRepository productChangeAuditRepository;
  private final ProductFitmentLabelRepository fitmentLabelRepository;
  private final ProductFitmentCarRepository fitmentCarRepository;
  private final CarModelRepository carModelRepository;
  private final ProductVehicleSpecRepository vehicleSpecRepository;
  private final CatalogService catalogService;
  private final OrderService orderService;
  private final ObjectMapper objectMapper;
  private final ProductPresenter productPresenter;
  private final UploadStorageService uploadStorageService;
  private final UserAvatarService userAvatarService;
  private final NotificationService notificationService;

  public AdminApiService(
      AdminUserRepository adminUserRepository,
      PasswordEncoder passwordEncoder,
      AdminSessionService adminSessionService,
      UserRepository userRepository,
      UserProfileRepository userProfileRepository,
      OrderRepository orderRepository,
      CategoryRepository categoryRepository,
      OrderLineRepository orderLineRepository,
      OrderStatusAuditRepository orderStatusAuditRepository,
      ProductRepository productRepository,
      ProductChangeAuditRepository productChangeAuditRepository,
      ProductFitmentLabelRepository fitmentLabelRepository,
      ProductFitmentCarRepository fitmentCarRepository,
      CarModelRepository carModelRepository,
      ProductVehicleSpecRepository vehicleSpecRepository,
      CatalogService catalogService,
      OrderService orderService,
      ObjectMapper objectMapper,
      ProductPresenter productPresenter,
      UploadStorageService uploadStorageService,
      UserAvatarService userAvatarService,
      NotificationService notificationService) {
    this.adminUserRepository = adminUserRepository;
    this.passwordEncoder = passwordEncoder;
    this.adminSessionService = adminSessionService;
    this.userRepository = userRepository;
    this.userProfileRepository = userProfileRepository;
    this.orderRepository = orderRepository;
    this.categoryRepository = categoryRepository;
    this.orderLineRepository = orderLineRepository;
    this.orderStatusAuditRepository = orderStatusAuditRepository;
    this.productRepository = productRepository;
    this.productChangeAuditRepository = productChangeAuditRepository;
    this.fitmentLabelRepository = fitmentLabelRepository;
    this.fitmentCarRepository = fitmentCarRepository;
    this.carModelRepository = carModelRepository;
    this.vehicleSpecRepository = vehicleSpecRepository;
    this.catalogService = catalogService;
    this.orderService = orderService;
    this.objectMapper = objectMapper;
    this.productPresenter = productPresenter;
    this.uploadStorageService = uploadStorageService;
    this.userAvatarService = userAvatarService;
    this.notificationService = notificationService;
  }

  @Transactional
  public String loginAndCreateSession(String email, String password) {
    var admin =
        adminUserRepository
            .findByEmailIgnoreCase(email)
            .orElseThrow(
                () -> new ApiException(HttpStatus.UNAUTHORIZED, "AUTH_FAILED", "Invalid credentials"));
    if (!passwordEncoder.matches(password, admin.getPasswordHash())) {
      throw new ApiException(HttpStatus.UNAUTHORIZED, "AUTH_FAILED", "Invalid credentials");
    }
    admin.setLastLoginAt(Instant.now());
    adminUserRepository.save(admin);
    notificationService.notifyAdminEmail(
        admin.getEmail(),
        "auth_security",
        "Admin login",
        "You logged into admin dashboard.",
        "admin_auth",
        admin.getId().toString(),
        Map.of("email", admin.getEmail()));
    return adminSessionService.createSession(admin.getEmail());
  }

  @Transactional(readOnly = true)
  public Map<String, Object> dashboard() {
    long users = userRepository.count();
    var orders = orderRepository.findAll();
    long totalOrders = orders.size();
    BigDecimal revenueAmount =
        orders.stream()
            .map(o -> o.getTotalInr())
            .reduce(BigDecimal.ZERO, BigDecimal::add);
    long revenue = revenueAmount.longValue();
    long purchaseCount = totalOrders;
    long purchaseValue = revenue;
    var top = catalogService.listAllForAdmin().stream().filter(m -> Boolean.TRUE.equals(m.get("published"))).limit(5).toList();
    var revenueVsPurchases = buildRevenueVsPurchasesSeries(orders);
    Map<String, Object> d = new LinkedHashMap<>();
    d.put("totalUsers", users);
    d.put("totalOrders", totalOrders);
    d.put("revenue", revenue);
    d.put("purchaseCount", purchaseCount);
    d.put("purchaseValue", purchaseValue);
    d.put("revenueVsPurchases", revenueVsPurchases);
    d.put("topProducts", top);
    d.put("salesPerformance", listSalesPerformance());
    return d;
  }

  private List<Map<String, Object>> buildRevenueVsPurchasesSeries(List<OrderEntity> orders) {
    Map<String, BigDecimal> revenueByMonth = new LinkedHashMap<>();
    Map<String, Long> purchasesByMonth = new LinkedHashMap<>();
    DateTimeFormatter monthKeyFmt = DateTimeFormatter.ofPattern("yyyy-MM");

    for (var order : orders) {
      if (order.getPlacedAt() == null) continue;
      String monthKey = monthKeyFmt.format(order.getPlacedAt().atOffset(ZoneOffset.UTC));
      revenueByMonth.merge(monthKey, order.getTotalInr() != null ? order.getTotalInr() : BigDecimal.ZERO, BigDecimal::add);
      purchasesByMonth.put(monthKey, purchasesByMonth.getOrDefault(monthKey, 0L) + 1L);
    }

    List<String> keys = revenueByMonth.keySet().stream().sorted().toList();
    List<Map<String, Object>> series = new ArrayList<>();
    for (String key : keys) {
      Map<String, Object> row = new LinkedHashMap<>();
      row.put("period", key);
      row.put("periodEndUtc", key + "-01T00:00:00Z");
      row.put("revenue", revenueByMonth.getOrDefault(key, BigDecimal.ZERO).longValue());
      row.put("purchases", purchasesByMonth.getOrDefault(key, 0L));
      series.add(row);
    }
    return series;
  }

  @Transactional(readOnly = true)
  public List<Map<String, Object>> listUsers() {
    return userRepository.findAll().stream()
        .map(
            u -> {
              Map<String, Object> m = new LinkedHashMap<>();
              m.put("id", u.getId().toString());
              m.put("phone", u.getPhoneE164());
              m.put("name", u.getDisplayName());
              m.put("role", u.getRole() != null ? u.getRole() : "user");
              m.put(
                  "avatarUrl",
                  userAvatarService.hasAvatar(u.getId())
                      ? userAvatarService.publicAvatarUrl(u.getId())
                      : "");
              return m;
            })
        .toList();
  }

  @Transactional(readOnly = true)
  public Map<String, Object> listUsersPage(int page, int size) {
    Pageable pageable =
        PageRequest.of(Math.max(0, page), Math.max(1, Math.min(50, size)), Sort.by("id").descending());
    Page<UserEntity> result = userRepository.findAll(pageable);
    List<Map<String, Object>> items = result.getContent().stream().map(this::toUserMap).toList();
    return pagedResponse(items, result.getNumber(), result.getSize(), result.hasNext());
  }

  @Transactional(readOnly = true)
  public Map<String, Object> getUserAdmin(String userId) {
    UUID id = UUID.fromString(userId);
    UserEntity u =
        userRepository
            .findById(id)
            .orElseThrow(
                () -> new ApiException(HttpStatus.NOT_FOUND, "NOT_FOUND", "User not found"));
    var prof =
        userProfileRepository
            .findById(id)
            .map(
                p -> {
                  Map<String, Object> m = new LinkedHashMap<>();
                  m.put("name", p.getFullName());
                  m.put("email", p.getEmail());
                  m.put("phone", p.getPhone());
                  return m;
                })
            .orElse(Map.of());
    Map<String, Object> um = new LinkedHashMap<>();
    um.put("id", u.getId().toString());
    um.put("phone", u.getPhoneE164());
    um.put("name", u.getDisplayName());
    um.put("role", u.getRole() != null ? u.getRole() : "user");
    um.put(
        "avatarUrl",
        userAvatarService.hasAvatar(u.getId()) ? userAvatarService.publicAvatarUrl(u.getId()) : "");
    return Map.of("user", um, "profile", prof);
  }

  @Transactional(readOnly = true)
  public List<Map<String, Object>> listCategories() {
    return categoryRepository.findAllActive().stream()
        .map(
            c -> {
              Map<String, Object> row = new LinkedHashMap<>();
              row.put("id", c.getSlug());
              row.put("name", c.getName());
              row.put("createdByAdminEmail", c.getCreatedByAdminEmail());
              row.put("deleted", false);
              row.put("deletedAt", null);
              return row;
            })
        .toList();
  }

  @Transactional(readOnly = true)
  public Map<String, Object> listCategoriesPage(int page, int size) {
    Pageable pageable =
        PageRequest.of(Math.max(0, page), Math.max(1, Math.min(50, size)), Sort.by("name").ascending());
    Page<Category> result = categoryRepository.findAll(pageable);
    List<Map<String, Object>> items =
        result.getContent().stream()
            .map(
                c -> {
                  Map<String, Object> row = new LinkedHashMap<>();
                  row.put("id", c.getSlug());
                  row.put("name", c.getName());
                  row.put("createdByAdminEmail", c.getCreatedByAdminEmail());
                  row.put("deleted", c.getDeletedAt() != null);
                  row.put("deletedAt", c.getDeletedAt() != null ? c.getDeletedAt().toString() : null);
                  return row;
                })
            .toList();
    return pagedResponse(items, result.getNumber(), result.getSize(), result.hasNext());
  }

  @Transactional(readOnly = true)
  public Map<String, Object> categoriesOverview() {
    List<Product> allProducts =
        productRepository.findAllWithCategory().stream()
            .filter(p -> p.getDeletedAt() == null)
            .filter(p -> p.getCategory() != null && p.getCategory().getDeletedAt() == null)
            .toList();
    Map<String, List<Product>> bySlug =
        allProducts.stream().collect(Collectors.groupingBy(p -> p.getCategory().getSlug()));

    Map<String, BigDecimal> revenueBySlug = new HashMap<>();
    for (Object[] row : orderLineRepository.sumLineTotalsInrByCategorySlug()) {
      if (row[0] == null) continue;
      revenueBySlug.put(String.valueOf(row[0]), (BigDecimal) row[1]);
    }

    BigDecimal totalPurchased =
        revenueBySlug.values().stream().reduce(BigDecimal.ZERO, BigDecimal::add);

    List<Category> cats =
        categoryRepository.findAll().stream()
            .sorted(Comparator.comparing(Category::getName, String.CASE_INSENSITIVE_ORDER))
            .toList();

    List<Map<String, Object>> items = new ArrayList<>();
    for (Category c : cats) {
      List<Product> plist = bySlug.getOrDefault(c.getSlug(), List.of());
      Map<String, Object> m = new LinkedHashMap<>();
      m.put("id", c.getSlug());
      m.put("name", c.getName());
      m.put("createdByAdminEmail", c.getCreatedByAdminEmail());
      m.put("deleted", c.getDeletedAt() != null);
      m.put("deletedAt", c.getDeletedAt() != null ? c.getDeletedAt().toString() : null);
      m.put("productCount", plist.size());
      m.put(
          "purchasedValueInr",
          revenueBySlug.getOrDefault(c.getSlug(), BigDecimal.ZERO).longValue());
      m.put("products", plist.stream().map(this::productBriefForOverview).toList());
      items.add(m);
    }

    Map<String, Object> summary = new LinkedHashMap<>();
    summary.put("totalCategories", cats.size());
    summary.put("totalProducts", allProducts.size());
    summary.put("totalPurchasedValueInr", totalPurchased.longValue());

    return Map.of("summary", summary, "categories", items);
  }

  private Map<String, Object> productBriefForOverview(Product p) {
    Map<String, Object> m = new LinkedHashMap<>();
    m.put("id", p.getId());
    m.put("name", p.getName());
    m.put("sku", p.getSku());
    m.put("priceInr", p.getPriceInr().longValue());
    m.put("published", p.isPublished());
    return m;
  }

  private static String currentAdminEmailOrNull() {
    Authentication a = SecurityContextHolder.getContext().getAuthentication();
    if (a == null || !a.isAuthenticated()) return null;
    String n = a.getName();
    if (n == null || n.isBlank()) return null;
    return n.contains("@") ? n : null;
  }

  @Transactional
  public Map<String, Object> createCategory(String name) {
    if (name == null || name.isBlank()) {
      throw new ApiException(HttpStatus.BAD_REQUEST, "VALIDATION_ERROR", "name required");
    }
    String slug = SlugUtil.slug(name);
    Category c;
    var existing = categoryRepository.findById(slug).orElse(null);
    if (existing != null) {
      if (existing.getDeletedAt() == null) {
        throw new ApiException(HttpStatus.BAD_REQUEST, "VALIDATION_ERROR", "Category exists");
      }
      existing.setDeletedAt(null);
      existing.setName(name.trim());
      existing.setCreatedByAdminEmail(currentAdminEmailOrNull());
      c = categoryRepository.save(existing);
    } else {
      c = new Category();
      c.setSlug(slug);
      c.setName(name.trim());
      c.setCreatedByAdminEmail(currentAdminEmailOrNull());
      int maxOrder =
          categoryRepository.findAll().stream().mapToInt(Category::getDisplayOrder).max().orElse(0);
      c.setDisplayOrder(maxOrder + 1);
      categoryRepository.save(c);
    }
    Map<String, Object> catPayload = new LinkedHashMap<>();
    catPayload.put("id", slug);
    catPayload.put("name", c.getName());
    catPayload.put("createdByAdminEmail", c.getCreatedByAdminEmail());
    return Map.of("category", catPayload);
  }

  @Transactional
  public Map<String, Object> updateCategory(String id, Map<String, Object> body) {
    Category c =
        categoryRepository
            .findById(id)
            .orElseThrow(
                () -> new ApiException(HttpStatus.NOT_FOUND, "NOT_FOUND", "Not found"));
    if (body.containsKey("name")) c.setName(String.valueOf(body.get("name")));
    categoryRepository.save(c);
    return Map.of("category", Map.of("id", c.getSlug(), "name", c.getName()));
  }

  @Transactional
  public Map<String, Object> deleteCategory(String id) {
    Category c =
        categoryRepository
            .findById(id)
            .orElseThrow(
                () -> new ApiException(HttpStatus.NOT_FOUND, "NOT_FOUND", "Category not found"));
    c.setDeletedAt(Instant.now());
    categoryRepository.save(c);
    return Map.of("removed", id);
  }

  @Transactional(readOnly = true)
  public Map<String, Object> listProductsPage(int page, int pageSize, String sort) {
    return catalogService.listProductsPageForAdmin(page, pageSize, sort);
  }

  @Transactional(readOnly = true)
  public Map<String, Object> getProductAdmin(String id) {
    Product p =
        productRepository
            .findById(id)
            .orElseThrow(
                () -> new ApiException(HttpStatus.NOT_FOUND, "NOT_FOUND", "Product not found"));
    var fits =
        fitmentLabelRepository.findByProductIdIn(List.of(id)).stream()
            .map(ProductFitmentLabel::getLabel)
            .toList();
    var fitCarIds =
        fitmentCarRepository.findByProductIdIn(List.of(id)).stream()
            .map(ProductFitmentCar::getCarId)
            .toList();
    var carsById =
        carModelRepository.findAllById(fitCarIds).stream()
            .collect(Collectors.toMap(CarModelEntity::getId, c -> c, (a, b) -> a));
    var spec = vehicleSpecRepository.findById(id).orElse(null);
    return productPresenter.toAdminMap(p, fits, fitCarIds, carsById, spec);
  }

  @Transactional(rollbackFor = Exception.class)
  public Map<String, Object> upsertProduct(Map<String, Object> body, String idOrNull) {
    String id =
        idOrNull != null
            ? idOrNull
            : (body.get("id") != null ? String.valueOf(body.get("id")) : "prd_" + UUID.randomUUID());
    boolean isNew = !productRepository.existsById(id);
    Product p = productRepository.findById(id).orElseGet(Product::new);
    p.setId(id);
    String catName = String.valueOf(body.getOrDefault("category", "Misc"));
    Category cat = resolveOrCreateCategoryForProduct(catName);
    p.setCategory(cat);
    String typeStr = String.valueOf(body.getOrDefault("type", "part"));
    p.setType(ProductType.valueOf(typeStr));
    p.setSku(String.valueOf(body.getOrDefault("sku", p.getSku() != null ? p.getSku() : id)));
    p.setName(String.valueOf(body.getOrDefault("name", p.getName() != null ? p.getName() : "Product")));
    int price = intFrom(body.get("price"), 0);
    p.setPriceInr(BigDecimal.valueOf(price));
    int purchasePrice = intFrom(body.get("purchasePrice"), 0);
    p.setPurchasePriceInr(BigDecimal.valueOf(purchasePrice));
    Integer discountedPrice = intFrom(body.get("discountedPrice"), (Integer) null);
    p.setDiscountedPriceInr(discountedPrice != null ? BigDecimal.valueOf(discountedPrice) : null);
    int stock = intFrom(body.get("totalStock"), intFrom(body.get("stock_quantity"), 1));
    p.setStockQuantity(stock);
    if (body.containsKey("published")) {
      p.setPublished(Boolean.TRUE.equals(body.get("published")));
    } else if (isNew) {
      p.setPublished(true);
    }
    if (body.containsKey("imageKey")) p.setImageKey(strOrNull(body.get("imageKey")));
    if (body.containsKey("description")) p.setDescription(strOrNull(body.get("description")));
    if (p.getType() == ProductType.part) {
      p.setMetadata(mergePartImageMetadata(p.getMetadata(), body));
    } else {
      p.setMetadata(objectMapper.createObjectNode());
    }
    Product savedProduct = productRepository.save(p);
    p = savedProduct;
    if (p.getType() == ProductType.part) {
      if (body.containsKey("compatibleCars")) {
        fitmentLabelRepository.deleteByProductId(p.getId());
        @SuppressWarnings("unchecked")
        List<String> cars = (List<String>) body.get("compatibleCars");
        if (cars != null) {
          for (String label : cars) {
            if (label == null || label.isBlank()) continue;
            ProductFitmentLabel f = new ProductFitmentLabel();
            f.setProductId(p.getId());
            f.setLabel(label.trim());
            fitmentLabelRepository.save(f);
          }
        }
      }
      if (body.containsKey("compatibleCarIds")) {
        fitmentCarRepository.deleteByProductId(p.getId());
        @SuppressWarnings("unchecked")
        List<String> carIds = (List<String>) body.get("compatibleCarIds");
        if (carIds != null) {
          for (String carId : carIds) {
            if (carId == null || carId.isBlank() || !carModelRepository.existsById(carId.trim())) continue;
            ProductFitmentCar fc = new ProductFitmentCar();
            fc.setProductId(p.getId());
            fc.setCarId(carId.trim());
            fitmentCarRepository.save(fc);
          }
        }
      }
      vehicleSpecRepository.findById(p.getId()).ifPresent(vehicleSpecRepository::delete);
    } else {
      fitmentLabelRepository.deleteByProductId(p.getId());
      ProductVehicleSpec spec = vehicleSpecRepository.findById(savedProduct.getId()).orElse(null);
      if (spec == null) {
        spec = new ProductVehicleSpec();
        // @MapsId uses the Product id as PK; avoid setting detached ids manually.
        spec.setProduct(savedProduct);
      } else {
        spec.setProduct(savedProduct);
      }
      @SuppressWarnings("unchecked")
      Map<String, Object> meta = (Map<String, Object>) body.get("carMeta");
      if (meta != null) {
        if (meta.get("year") != null) spec.setModelYear(Short.valueOf(String.valueOf(meta.get("year"))));
        if (meta.get("condition") != null) spec.setCondition(String.valueOf(meta.get("condition")));
        if (meta.get("km") != null) spec.setOdometerKm(intFrom(meta.get("km"), null));
        if (meta.get("fuel") != null) spec.setFuel(String.valueOf(meta.get("fuel")));
        if (meta.get("transmission") != null) spec.setTransmission(String.valueOf(meta.get("transmission")));
        if (meta.get("location") != null) spec.setLocation(String.valueOf(meta.get("location")));
      }
      if (body.get("image") != null) {
        spec.setPrimaryImageUrl(
            uploadStorageService.persistVehicleImageIfDataUrl(
                p.getId(), String.valueOf(body.get("image"))));
      }
      if (body.get("imageAlt") != null) spec.setImageAlt(String.valueOf(body.get("imageAlt")));
      List<Object> persistedGallery =
          body.get("gallery") instanceof List<?> galleryRaw
              ? uploadStorageService.persistGalleryIfDataUrls(
                  p.getId(), galleryRaw.stream().map(x -> (Object) x).toList())
              : List.of();
      JsonNode gallery = objectMapper.valueToTree(persistedGallery);
      spec.setGallery(gallery);
      if (spec.getCondition() == null) spec.setCondition("second-hand");
      vehicleSpecRepository.save(spec);
    }
    Product saved = productRepository.findById(p.getId()).orElseThrow();
    var fits =
        fitmentLabelRepository.findByProductIdIn(List.of(saved.getId())).stream()
            .map(ProductFitmentLabel::getLabel)
            .toList();
    var fitCarIds =
        fitmentCarRepository.findByProductIdIn(List.of(saved.getId())).stream()
            .map(ProductFitmentCar::getCarId)
            .toList();
    var carsById =
        carModelRepository.findAllById(fitCarIds).stream()
            .collect(Collectors.toMap(CarModelEntity::getId, c -> c, (a, b) -> a));
    var spec = vehicleSpecRepository.findById(saved.getId()).orElse(null);
    recordProductAudit(saved.getId(), isNew ? "created" : "updated");
    return Map.of("product", productPresenter.toAdminMap(saved, fits, fitCarIds, carsById, spec));
  }

  /** Preserves existing JSON; stores optional primary image URL + gallery for catalog parts. */
  private ObjectNode mergePartImageMetadata(JsonNode existing, Map<String, Object> body) {
    ObjectNode meta =
        existing != null && existing.isObject()
            ? (ObjectNode) existing.deepCopy()
            : objectMapper.createObjectNode();
    if (body.containsKey("primaryImageUrl")) {
      String u = strOrNull(body.get("primaryImageUrl"));
      if (u != null && !u.isBlank()) {
        meta.put("primaryImageUrl", uploadStorageService.persistVehicleImageIfDataUrl("parts", u));
      } else {
        meta.remove("primaryImageUrl");
      }
    } else if (body.containsKey("image")) {
      String u = strOrNull(body.get("image"));
      if (u != null && !u.isBlank()) {
        meta.put("primaryImageUrl", u);
      }
    }
    if (body.containsKey("galleryExtras")) {
      List<Object> persistedGallery =
          body.get("galleryExtras") instanceof List<?> galleryRaw
              ? uploadStorageService.persistGalleryIfDataUrls(
                  "parts", galleryRaw.stream().map(x -> (Object) x).toList())
              : List.of();
      meta.set("galleryExtras", objectMapper.valueToTree(persistedGallery));
    }
    return meta;
  }

  private static Integer intFrom(Object o, Integer def) {
    if (o == null) return def;
    if (o instanceof Number n) return n.intValue();
    try {
      return Integer.parseInt(String.valueOf(o));
    } catch (NumberFormatException e) {
      return def;
    }
  }

  private static int intFrom(Object o, int def) {
    Integer x = intFrom(o, (Integer) null);
    return x != null ? x : def;
  }

  private static String strOrNull(Object o) {
    return o == null ? null : String.valueOf(o);
  }

  /**
   * Match existing category by slug or case-insensitive name; otherwise insert a new row (same
   * transaction as product save).
   */
  private Category resolveOrCreateCategoryForProduct(String catName) {
    String trimmed =
        catName == null || catName.isBlank() ? "Misc" : catName.trim();
    String slug = SlugUtil.slug(trimmed);
    Category category =
        categoryRepository
        .findById(slug)
        .or(
            () ->
                categoryRepository.findAll().stream()
                    .filter(c -> c.getName().equalsIgnoreCase(trimmed))
                    .findFirst())
        .orElseGet(() -> createCategoryRow(trimmed, slug));
    if (category.getDeletedAt() != null) {
      category.setDeletedAt(null);
      category = categoryRepository.save(category);
    }
    return category;
  }

  private Category createCategoryRow(String displayName, String slug) {
    Category c = new Category();
    c.setSlug(slug);
    c.setName(displayName);
    c.setCreatedByAdminEmail(currentAdminEmailOrNull());
    int maxOrder =
        categoryRepository.findAll().stream().mapToInt(Category::getDisplayOrder).max().orElse(0);
    c.setDisplayOrder(maxOrder + 1);
    return categoryRepository.save(c);
  }

  @Transactional(rollbackFor = Exception.class)
  public Map<String, Object> deleteProduct(String id) {
    Product p =
        productRepository
            .findById(id)
            .orElseThrow(
                () -> new ApiException(HttpStatus.NOT_FOUND, "NOT_FOUND", "Product not found"));
    p.setDeletedAt(Instant.now());
    p.setPublished(false);
    productRepository.save(p);
    recordProductAudit(id, "deleted");
    return Map.of("removed", id);
  }

  @Transactional(rollbackFor = Exception.class)
  public Map<String, Object> patchPublish(String id, boolean published) {
    Product p =
        productRepository
            .findById(id)
            .orElseThrow(
                () -> new ApiException(HttpStatus.NOT_FOUND, "NOT_FOUND", "Not found"));
    p.setPublished(published);
    productRepository.save(p);
    var fits =
        fitmentLabelRepository.findByProductIdIn(List.of(id)).stream()
            .map(ProductFitmentLabel::getLabel)
            .toList();
    var fitCarIds =
        fitmentCarRepository.findByProductIdIn(List.of(id)).stream()
            .map(ProductFitmentCar::getCarId)
            .toList();
    var carsById =
        carModelRepository.findAllById(fitCarIds).stream()
            .collect(Collectors.toMap(CarModelEntity::getId, c -> c, (a, b) -> a));
    var spec = vehicleSpecRepository.findById(id).orElse(null);
    recordProductAudit(id, published ? "published" : "unpublished");
    return Map.of("product", productPresenter.toAdminMap(p, fits, fitCarIds, carsById, spec));
  }

  @Transactional(readOnly = true)
  public Map<String, Object> listOrdersAdminPage(String phone, int page, int size) {
    int safePage = Math.max(0, page);
    int safeSize = Math.max(1, Math.min(50, size));
    if (phone != null && !phone.isBlank()) {
      var rows = orderService.listAllAdminByPhonePage(phone, safePage, safeSize);
      if (((List<?>) rows.getOrDefault("items", List.of())).isEmpty()) {
        throw new ApiException(HttpStatus.NOT_FOUND, "NOT_FOUND", "No orders for this phone");
      }
      return rows;
    }
    var pageResult = orderRepository.findAllByOrderByPlacedAtDesc(PageRequest.of(safePage, safeSize));
    List<Map<String, Object>> rows =
        pageResult.getContent().stream()
            .map(
                o ->
                    orderService.toAdminOrderMap(
                        o, orderLineRepository.findByOrder_Id(o.getId())))
            .toList();
    return Map.of(
        "items", rows,
        "page", safePage,
        "size", safeSize,
        "hasMore", pageResult.hasNext(),
        "nextPage", pageResult.hasNext() ? safePage + 1 : safePage);
  }

  @Transactional
  public Map<String, Object> patchOrderStatus(String id, String status) {
    try {
      OrderStatus.valueOf(status);
    } catch (Exception e) {
      throw new ApiException(HttpStatus.BAD_REQUEST, "VALIDATION_ERROR", "Invalid status");
    }
    return orderService.patchStatusAdmin(id, status);
  }

  @Transactional
  public Map<String, Object> assignDelivery(String orderId, String deliveryAdminEmail) {
    String email = deliveryAdminEmail == null ? "" : deliveryAdminEmail.trim().toLowerCase();
    if (email.isBlank()) {
      throw new ApiException(HttpStatus.BAD_REQUEST, "VALIDATION_ERROR", "deliveryAdminEmail required");
    }
    var delivery =
        adminUserRepository
            .findByEmailIgnoreCase(email)
            .orElseThrow(
                () -> new ApiException(HttpStatus.NOT_FOUND, "NOT_FOUND", "Delivery admin not found"));
    if (!"delivery".equalsIgnoreCase(delivery.getRole())) {
      throw new ApiException(HttpStatus.BAD_REQUEST, "VALIDATION_ERROR", "Assignee must be delivery role");
    }
    if (!"free".equalsIgnoreCase(delivery.getAvailabilityStatus())) {
      throw new ApiException(HttpStatus.BAD_REQUEST, "VALIDATION_ERROR", "Delivery admin is not free");
    }
    OrderEntity order =
        orderRepository
            .findById(orderId)
            .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "NOT_FOUND", "Order not found"));
    order.setAssignedDeliveryAdminEmail(email);
    order.setAssignedDeliveryAt(Instant.now());
    orderRepository.save(order);
    notificationService.notifyAdminEmail(
        email,
        "admin_alerts",
        "Order assigned",
        "Order " + orderId + " has been assigned to you.",
        "order",
        orderId,
        Map.of("orderId", orderId));
    return Map.of("assigned", true, "orderId", orderId, "deliveryAdminEmail", email);
  }

  @Transactional(readOnly = true)
  public List<Map<String, Object>> listDeliveryOrdersForCurrent() {
    String email = currentAdminEmailOrNull();
    if (email == null) return List.of();
    return orderService.listAllAdmin().stream()
        .filter(o -> email.equalsIgnoreCase(String.valueOf(o.getOrDefault("assignedDeliveryAdminEmail", ""))))
        .toList();
  }

  @Transactional(readOnly = true)
  public List<Map<String, Object>> listEmployees() {
    return adminUserRepository.findAll().stream()
        .sorted(Comparator.comparing(a -> String.valueOf(a.getPhoneE164())))
        .map(this::toEmployeeMap)
        .toList();
  }

  @Transactional(readOnly = true)
  public Map<String, Object> listEmployeesPage(int page, int size) {
    Pageable pageable =
        PageRequest.of(Math.max(0, page), Math.max(1, Math.min(50, size)), Sort.by("phoneE164").ascending());
    Page<AdminUser> result = adminUserRepository.findAll(pageable);
    List<Map<String, Object>> items = result.getContent().stream().map(this::toEmployeeMap).toList();
    return pagedResponse(items, result.getNumber(), result.getSize(), result.hasNext());
  }

  @Transactional
  public Map<String, Object> createEmployee(Map<String, Object> body) {
    String phone = String.valueOf(body.getOrDefault("phone", "")).trim();
    String roleRaw = String.valueOf(body.getOrDefault("role", "sales"));
    UserRole role = UserRole.from(roleRaw);
    if (phone.isBlank()) {
      throw new ApiException(HttpStatus.BAD_REQUEST, "VALIDATION_ERROR", "phone required");
    }
    if (!(role == UserRole.sales || role == UserRole.delivery || role == UserRole.super_admin)) {
      throw new ApiException(HttpStatus.BAD_REQUEST, "VALIDATION_ERROR", "invalid employee role");
    }
    if (adminUserRepository.findByPhoneE164(phone).isPresent()) {
      throw new ApiException(HttpStatus.BAD_REQUEST, "VALIDATION_ERROR", "Employee already exists");
    }
    String syntheticEmail = "emp_" + phone.replaceAll("[^0-9]", "") + "@carnalysys.local";
    AdminUser a = new AdminUser();
    a.setEmail(syntheticEmail);
    a.setPasswordHash(passwordEncoder.encode(UUID.randomUUID().toString()));
    a.setPhoneE164(phone);
    a.setRole(role.name());
    a.setFullName(strOrNull(body.get("name")));
    String photoDataUrl = strOrNull(body.get("photo"));
    a.setPhotoUrl(
        photoDataUrl != null && !photoDataUrl.isBlank()
            ? uploadStorageService.persistVehicleImageIfDataUrl("employees", photoDataUrl)
            : null);
    a.setOnboardingStatus("pending");
    a.setAvailabilityStatus(role == UserRole.delivery ? "offline" : "busy");
    adminUserRepository.save(a);
    return Map.of("employee", toEmployeeMap(a));
  }

  @Transactional
  public Map<String, Object> setEmployeeAvailability(String phone, String availability) {
    String normalizedPhone = phone == null ? "" : phone.trim();
    String value = availability == null ? "" : availability.trim().toLowerCase();
    if (!(value.equals("free") || value.equals("busy") || value.equals("offline"))) {
      throw new ApiException(HttpStatus.BAD_REQUEST, "VALIDATION_ERROR", "availability must be free/busy/offline");
    }
    AdminUser a =
        adminUserRepository
            .findByPhoneE164(normalizedPhone)
            .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "NOT_FOUND", "Employee not found"));
    a.setAvailabilityStatus(value);
    adminUserRepository.save(a);
    notificationService.notifyAdminEmail(
        a.getEmail(),
        "admin_alerts",
        "Availability updated",
        "Your availability is now " + value + ".",
        "employee",
        a.getId().toString(),
        Map.of("availability", value));
    return Map.of("employee", toEmployeeMap(a));
  }

  @Transactional(readOnly = true)
  public List<Map<String, Object>> productAuditHistory(String productId) {
    return productChangeAuditRepository.findByProductIdOrderByCreatedAtDesc(productId).stream()
        .map(
            a -> {
              Map<String, Object> row = new LinkedHashMap<>();
              row.put("id", a.getId().toString());
              row.put("action", a.getAction());
              row.put("actorRole", a.getActorRole());
              row.put("actorId", a.getActorId());
              row.put("actorName", a.getActorName());
              row.put("createdAt", a.getCreatedAt().toString());
              return row;
            })
        .toList();
  }

  @Transactional(readOnly = true)
  public List<Map<String, Object>> listCarsAdmin(boolean onlyPublished, String brand) {
    String b = brand != null ? brand.trim() : "";
    List<CarModelEntity> rows =
        !b.isBlank()
            ? (onlyPublished
                ? carModelRepository
                    .findByPublishedTrueAndMakeIgnoreCaseAndDeletedAtIsNullOrderByMakeAscModelAscModelYearDesc(
                        b)
                : carModelRepository.findByMakeIgnoreCaseOrderByMakeAscModelAscModelYearDesc(b))
            : (onlyPublished
                ? carModelRepository.findByPublishedTrueAndDeletedAtIsNullOrderByMakeAscModelAscModelYearDesc()
                : carModelRepository.findAll().stream()
                    .sorted(
                        Comparator.comparing(CarModelEntity::getMake, String.CASE_INSENSITIVE_ORDER)
                            .thenComparing(CarModelEntity::getModel, String.CASE_INSENSITIVE_ORDER)
                            .thenComparing(c -> c.getModelYear() == null ? 0 : -c.getModelYear()))
                    .toList());
    return rows.stream().map(this::toCarMap).toList();
  }

  @Transactional(readOnly = true)
  public Map<String, Object> listCarsAdminPage(boolean onlyPublished, String brand, int page, int size) {
    String b = brand != null ? brand.trim() : "";
    Pageable pageable =
        PageRequest.of(
            Math.max(0, page),
            Math.max(1, Math.min(50, size)),
            Sort.by(Sort.Order.asc("make"), Sort.Order.asc("model"), Sort.Order.desc("modelYear")));
    Page<CarModelEntity> result;
    if (!b.isBlank()) {
      result = carModelRepository.findByMakeIgnoreCase(b, pageable);
    } else {
      result = carModelRepository.findAll(pageable);
    }
    List<Map<String, Object>> items =
      result.getContent().stream().filter(c -> !onlyPublished || c.isPublished()).map(this::toCarMap).toList();
    return pagedResponse(items, result.getNumber(), result.getSize(), result.hasNext());
  }

  @Transactional(readOnly = true)
  public Map<String, Object> getCarAdmin(String id) {
    CarModelEntity c =
        carModelRepository
            .findById(id)
            .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "NOT_FOUND", "Car not found"));
    return Map.of("car", toCarMap(c));
  }

  @Transactional
  public Map<String, Object> upsertCar(String idOrNull, Map<String, Object> body) {
    String make = strOrNull(body.containsKey("brandName") ? body.get("brandName") : body.get("make"));
    String model = strOrNull(body.get("model"));
    if (make == null || make.isBlank() || model == null || model.isBlank()) {
      throw new ApiException(HttpStatus.BAD_REQUEST, "VALIDATION_ERROR", "make and model required");
    }
    String id =
        idOrNull != null && !idOrNull.isBlank()
            ? idOrNull
            : (body.get("id") != null && !String.valueOf(body.get("id")).isBlank()
                ? String.valueOf(body.get("id"))
                : SlugUtil.slug(make + " " + model + " " + String.valueOf(body.getOrDefault("modelYear", ""))));
    CarModelEntity c = carModelRepository.findById(id).orElseGet(CarModelEntity::new);
    c.setId(id);
    c.setMake(make.trim());
    c.setModel(model.trim());
    c.setVariant(strOrNull(body.get("variant")));
    Integer modelYear = intFrom(body.get("modelYear"), (Integer) null);
    c.setModelYear(modelYear != null ? modelYear.shortValue() : null);
    c.setFuel(strOrNull(body.get("fuel")));
    c.setTransmission(strOrNull(body.get("transmission")));
    c.setEngineCc(intFrom(body.get("engineCc"), (Integer) null));
    c.setImageUrl(strOrNull(body.get("image")));
    c.setBrandLogoUrl(strOrNull(body.get("brandLogo")));
    c.setNotes(strOrNull(body.get("notes")));
    if (body.containsKey("published")) c.setPublished(Boolean.TRUE.equals(body.get("published")));
    carModelRepository.save(c);
    return Map.of("car", toCarMap(c));
  }

  @Transactional
  public Map<String, Object> deleteCar(String id) {
    CarModelEntity c =
        carModelRepository
            .findById(id)
            .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "NOT_FOUND", "Car not found"));
    c.setDeletedAt(Instant.now());
    c.setPublished(false);
    carModelRepository.save(c);
    return Map.of("removed", id);
  }

  private Map<String, Object> toCarMap(CarModelEntity c) {
    Map<String, Object> m = new LinkedHashMap<>();
    m.put("id", c.getId());
    m.put("make", c.getMake());
    m.put("brandName", c.getMake());
    m.put("model", c.getModel());
    m.put("variant", c.getVariant());
    m.put("modelYear", c.getModelYear());
    m.put("fuel", c.getFuel());
    m.put("transmission", c.getTransmission());
    m.put("engineCc", c.getEngineCc());
    m.put("image", c.getImageUrl());
    m.put("brandLogo", c.getBrandLogoUrl());
    m.put("notes", c.getNotes());
    m.put("published", c.isPublished());
    m.put("deleted", c.getDeletedAt() != null);
    m.put("deletedAt", c.getDeletedAt() != null ? c.getDeletedAt().toString() : null);
    return m;
  }

  private void recordProductAudit(String productId, String action) {
    ProductChangeAuditEntity a = new ProductChangeAuditEntity();
    a.setProductId(productId);
    a.setAction(action);
    String role = "super_admin";
    Authentication auth = SecurityContextHolder.getContext().getAuthentication();
    if (auth != null) {
      if (auth.getAuthorities().stream().anyMatch(g -> "ROLE_SALES".equals(g.getAuthority()))) {
        role = "sales";
      } else if (auth.getAuthorities().stream().anyMatch(g -> "ROLE_DELIVERY".equals(g.getAuthority()))) {
        role = "delivery";
      }
      a.setActorId(auth.getName());
      a.setActorName(auth.getName());
    }
    a.setActorRole(role);
    productChangeAuditRepository.save(a);
  }

  private Map<String, Object> toEmployeeMap(AdminUser a) {
    Map<String, Object> m = new LinkedHashMap<>();
    m.put("id", a.getId().toString());
    m.put("email", a.getEmail());
    m.put("phone", a.getPhoneE164());
    m.put("role", a.getRole());
    m.put("name", a.getFullName());
    m.put("photoUrl", a.getPhotoUrl());
    m.put("status", a.getOnboardingStatus());
    m.put("availability", a.getAvailabilityStatus());
    m.put("lastLoginAt", a.getLastLoginAt() != null ? a.getLastLoginAt().toString() : null);
    m.put("lastLogoutAt", a.getLastLogoutAt() != null ? a.getLastLogoutAt().toString() : null);
    m.put("firstLoginAt", a.getFirstLoginAt() != null ? a.getFirstLoginAt().toString() : null);
    return m;
  }

  private Map<String, Object> toUserMap(UserEntity u) {
    Map<String, Object> m = new LinkedHashMap<>();
    m.put("id", u.getId().toString());
    m.put("phone", u.getPhoneE164());
    m.put("name", u.getDisplayName());
    m.put("role", u.getRole() != null ? u.getRole() : "user");
    m.put(
        "avatarUrl",
        userAvatarService.hasAvatar(u.getId()) ? userAvatarService.publicAvatarUrl(u.getId()) : "");
    return m;
  }

  private Map<String, Object> pagedResponse(
      List<Map<String, Object>> items, int page, int size, boolean hasNext) {
    return Map.of(
        "items", items,
        "page", page,
        "size", size,
        "hasMore", hasNext,
        "nextPage", hasNext ? page + 1 : page);
  }

  private List<Map<String, Object>> listSalesPerformance() {
    Map<String, long[]> stats = new HashMap<>();
    for (Object[] row : orderStatusAuditRepository.salesOrderAndUnitsByAdminEmail()) {
      String email = row[0] == null ? "" : String.valueOf(row[0]);
      if (email.isBlank()) continue;
      long ordersCount = row[1] instanceof Number n ? n.longValue() : 0L;
      long unitsSold = row[2] instanceof Number n ? n.longValue() : 0L;
      stats.put(email, new long[] {ordersCount, unitsSold});
    }
    return adminUserRepository.findByRoleIgnoreCaseOrderByEmailAsc("sales").stream()
        .map(
            s -> {
              long[] v = stats.getOrDefault(s.getEmail(), new long[] {0L, 0L});
              Map<String, Object> row = new LinkedHashMap<>();
              row.put("email", s.getEmail());
              row.put("name", s.getFullName());
              row.put("ordersCount", v[0]);
              row.put("unitsSold", v[1]);
              return row;
            })
        .toList();
  }
}
