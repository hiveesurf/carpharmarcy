package com.carnalysys.service;

import com.carnalysys.api.ApiException;
import com.carnalysys.domain.Cart;
import com.carnalysys.domain.CartItem;
import com.carnalysys.domain.GuestSession;
import com.carnalysys.domain.Product;
import com.carnalysys.domain.ProductType;
import com.carnalysys.domain.UserEntity;
import com.carnalysys.repo.CartItemRepository;
import com.carnalysys.repo.CartRepository;
import com.carnalysys.repo.CarModelRepository;
import com.carnalysys.repo.GuestSessionRepository;
import com.carnalysys.repo.ProductFitmentCarRepository;
import com.carnalysys.repo.ProductFitmentLabelRepository;
import com.carnalysys.repo.ProductRepository;
import com.carnalysys.repo.ProductVehicleSpecRepository;
import com.carnalysys.repo.UserRepository;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.time.Instant;
import java.util.UUID;
import java.util.stream.Collectors;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class CartService {

  private final CartRepository cartRepository;
  private final CartItemRepository cartItemRepository;
  private final GuestSessionRepository guestSessionRepository;
  private final ProductRepository productRepository;
  private final UserRepository userRepository;
  private final ProductFitmentLabelRepository fitmentLabelRepository;
  private final ProductFitmentCarRepository fitmentCarRepository;
  private final CarModelRepository carModelRepository;
  private final ProductVehicleSpecRepository vehicleSpecRepository;
  private final ProductPresenter productPresenter;

  public CartService(
      CartRepository cartRepository,
      CartItemRepository cartItemRepository,
      GuestSessionRepository guestSessionRepository,
      ProductRepository productRepository,
      UserRepository userRepository,
      ProductFitmentLabelRepository fitmentLabelRepository,
      ProductFitmentCarRepository fitmentCarRepository,
      CarModelRepository carModelRepository,
      ProductVehicleSpecRepository vehicleSpecRepository,
      ProductPresenter productPresenter) {
    this.cartRepository = cartRepository;
    this.cartItemRepository = cartItemRepository;
    this.guestSessionRepository = guestSessionRepository;
    this.productRepository = productRepository;
    this.userRepository = userRepository;
    this.fitmentLabelRepository = fitmentLabelRepository;
    this.fitmentCarRepository = fitmentCarRepository;
    this.carModelRepository = carModelRepository;
    this.vehicleSpecRepository = vehicleSpecRepository;
    this.productPresenter = productPresenter;
  }

  public record CartSnapshot(
      Cart cart, UUID newGuestSessionId, boolean guestCreated) {}

  @Transactional
  public CartSnapshot resolveCart(
      Optional<UUID> userId, Optional<UUID> guestId, boolean createGuestIfMissing) {
    if (userId.isPresent()) {
      UserEntity user = userRepository.getReferenceById(userId.get());
      Cart cart =
          cartRepository
              .findByUser_Id(user.getId())
              .orElseGet(
                  () -> {
                    Cart c = new Cart();
                    c.setUser(user);
                    return cartRepository.save(c);
                  });
      return new CartSnapshot(cart, null, false);
    }
    if (guestId.isPresent()) {
      if (!guestSessionRepository.existsById(guestId.get())) {
        if (createGuestIfMissing) {
          return createGuestCart();
        }
        return new CartSnapshot(null, null, false);
      }
      GuestSession g = guestSessionRepository.getReferenceById(guestId.get());
      Cart cart =
          cartRepository
              .findByGuestSession_Id(g.getId())
              .orElseGet(
                  () -> {
                    Cart c = new Cart();
                    c.setGuestSession(g);
                    return cartRepository.save(c);
                  });
      return new CartSnapshot(cart, null, false);
    }
    if (createGuestIfMissing) {
      return createGuestCart();
    }
    return new CartSnapshot(null, null, false);
  }

  private CartSnapshot createGuestCart() {
    GuestSession g = new GuestSession();
    guestSessionRepository.save(g);
    Cart c = new Cart();
    c.setGuestSession(g);
    cartRepository.save(c);
    return new CartSnapshot(c, g.getId(), true);
  }

  @Transactional(readOnly = true)
  public Map<String, Object> getCartView(Cart cart) {
    if (cart == null) {
      return Map.of("items", List.of(), "itemCount", 0, "subtotal", 0);
    }
    List<CartItem> lines = cartItemRepository.findByCart_IdAndDeletedAtIsNull(cart.getId());
    List<Map<String, Object>> items = new ArrayList<>();
    int count = 0;
    long subtotal = 0;
    List<String> ids = lines.stream().map(l -> l.getProduct().getId()).toList();
    var fitMap =
        ids.isEmpty()
            ? Map.<String, List<String>>of()
            : fitmentLabelRepository.findByProductIdIn(ids).stream()
                .collect(
                    Collectors.groupingBy(
                        com.carnalysys.domain.ProductFitmentLabel::getProductId,
                        Collectors.mapping(
                            com.carnalysys.domain.ProductFitmentLabel::getLabel,
                            Collectors.toList())));
    var specMap =
        ids.isEmpty()
            ? Map.<String, com.carnalysys.domain.ProductVehicleSpec>of()
            : vehicleSpecRepository.findByProductIdIn(ids).stream()
                .collect(
                    Collectors.toMap(
                        com.carnalysys.domain.ProductVehicleSpec::getProductId,
                        s -> s,
                        (a, b) -> a));
    var fitCarMap =
        ids.isEmpty()
            ? Map.<String, List<String>>of()
            : fitmentCarRepository.findByProductIdIn(ids).stream()
                .collect(
                    Collectors.groupingBy(
                        com.carnalysys.domain.ProductFitmentCar::getProductId,
                        Collectors.mapping(
                            com.carnalysys.domain.ProductFitmentCar::getCarId,
                            Collectors.toList())));
    var carsById =
        fitCarMap.isEmpty()
            ? Map.<String, com.carnalysys.domain.CarModelEntity>of()
            : carModelRepository.findAllById(
                    fitCarMap.values().stream().flatMap(List::stream).distinct().toList())
                .stream()
                .collect(Collectors.toMap(com.carnalysys.domain.CarModelEntity::getId, c -> c));
    for (CartItem line : lines) {
      Product p = line.getProduct();
      if (!p.isPublished()) continue;
      Map<String, Object> pmap =
          productPresenter.toPublicMap(
              p,
              fitMap.getOrDefault(p.getId(), List.of()),
              fitCarMap.getOrDefault(p.getId(), List.of()),
              carsById,
              specMap.get(p.getId()));
      int unit = ((Number) pmap.get("price")).intValue();
      long lineTotal = (long) unit * line.getQuantity();
      subtotal += lineTotal;
      count += line.getQuantity();
      Map<String, Object> row = new LinkedHashMap<>();
      row.put("id", line.getId().toString());
      row.put("productId", p.getId());
      row.put("quantity", line.getQuantity());
      row.put("product", pmap);
      row.put("lineTotal", lineTotal);
      items.add(row);
    }
    return Map.of("items", items, "itemCount", count, "subtotal", subtotal);
  }

  @Transactional
  public Map<String, Object> addItem(
      Optional<UUID> userId, Optional<UUID> guestId, String productId, int quantity) {
    Product p =
        productRepository
            .findById(productId)
            .filter(product -> product.getDeletedAt() == null)
            .filter(Product::isPublished)
            .orElseThrow(
                () -> new ApiException(HttpStatus.NOT_FOUND, "NOT_FOUND", "Unknown product"));
    CartSnapshot snap = resolveCart(userId, guestId, true);
    Cart cart = snap.cart();
    CartItem existing =
        cartItemRepository.findByCart_IdAndProduct_IdAndDeletedAtIsNull(cart.getId(), productId).orElse(null);
    int add = Math.max(1, quantity);
    int current = existing != null ? existing.getQuantity() : 0;
    int max = p.getType() == ProductType.vehicle ? 1 : Math.max(1, p.getStockQuantity());
    int qty = Math.min(current + add, max);
    if (existing == null) {
      CartItem ci = new CartItem();
      ci.setCart(cart);
      ci.setProduct(p);
      ci.setQuantity(qty);
      cartItemRepository.save(ci);
      Map<String, Object> res = new LinkedHashMap<>();
      res.put("itemId", ci.getId().toString());
      res.put("productId", productId);
      res.put("quantity", qty);
      res.put("_newGuest", snap.newGuestSessionId());
      return res;
    }
    existing.setQuantity(qty);
    cartItemRepository.save(existing);
    Map<String, Object> res = new LinkedHashMap<>();
    res.put("itemId", existing.getId().toString());
    res.put("productId", productId);
    res.put("quantity", qty);
    res.put("_newGuest", snap.newGuestSessionId());
    return res;
  }

  @Transactional
  public void clearCart(Optional<UUID> userId, Optional<UUID> guestId) {
    CartSnapshot snap = resolveCart(userId, guestId, false);
    if (snap.cart() == null) return;
    cartItemRepository.findByCart_IdAndDeletedAtIsNull(snap.cart().getId()).forEach(this::softDeleteCartItem);
  }

  @Transactional
  public Map<String, Object> updateLine(
      Optional<UUID> userId, Optional<UUID> guestId, UUID itemId, int quantity) {
    CartSnapshot snap = resolveCart(userId, guestId, false);
    if (snap.cart() == null) {
      throw new ApiException(HttpStatus.NOT_FOUND, "NOT_FOUND", "Cart line not found");
    }
    CartItem row =
        cartItemRepository
            .findById(itemId)
            .filter(ci -> ci.getDeletedAt() == null && ci.getCart().getId().equals(snap.cart().getId()))
            .orElseThrow(
                () -> new ApiException(HttpStatus.NOT_FOUND, "NOT_FOUND", "Cart line not found"));
    Product p = row.getProduct();
    if (quantity == 0) {
      softDeleteCartItem(row);
      return Map.of("removed", true);
    }
    int max = p.getType() == ProductType.vehicle ? 1 : Math.max(1, p.getStockQuantity());
    row.setQuantity(Math.min(quantity, max));
    cartItemRepository.save(row);
    return Map.of(
        "itemId", row.getId().toString(),
        "productId", p.getId(),
        "quantity", row.getQuantity());
  }

  @Transactional
  public Map<String, Object> removeLine(
      Optional<UUID> userId, Optional<UUID> guestId, UUID itemId) {
    CartSnapshot snap = resolveCart(userId, guestId, false);
    if (snap.cart() == null) {
      return Map.of("removed", itemId.toString());
    }
    cartItemRepository
        .findById(itemId)
        .filter(ci -> ci.getDeletedAt() == null && ci.getCart().getId().equals(snap.cart().getId()))
        .ifPresent(this::softDeleteCartItem);
    return Map.of("removed", itemId.toString());
  }

  @Transactional
  public Cart requireNonEmptyCart(Optional<UUID> userId, Optional<UUID> guestId) {
    CartSnapshot snap = resolveCart(userId, guestId, false);
    if (snap.cart() == null || cartItemRepository.findByCart_IdAndDeletedAtIsNull(snap.cart().getId()).isEmpty()) {
      throw new ApiException(HttpStatus.BAD_REQUEST, "EMPTY_CART", "Cart is empty");
    }
    return snap.cart();
  }

  @Transactional
  public void emptyCart(Cart cart) {
    cartItemRepository.findByCart_IdAndDeletedAtIsNull(cart.getId()).forEach(this::softDeleteCartItem);
  }

  /**
   * After login, move lines from the guest cart into the user's cart (combine quantities per
   * product, same caps as {@link #addItem}). No-op if guest session or cart is missing/empty.
   */
  @Transactional
  public void mergeGuestCartIntoUser(UUID userId, UUID guestSessionId) {
    if (userId == null || guestSessionId == null) {
      return;
    }
    if (!guestSessionRepository.existsById(guestSessionId)) {
      return;
    }
    Cart guestCart = cartRepository.findByGuestSession_Id(guestSessionId).orElse(null);
    if (guestCart == null) {
      return;
    }
    List<CartItem> guestLines = cartItemRepository.findByCart_IdAndDeletedAtIsNull(guestCart.getId());
    if (guestLines.isEmpty()) {
      return;
    }

    UserEntity user = userRepository.getReferenceById(userId);
    Cart userCart =
        cartRepository
            .findByUser_Id(userId)
            .orElseGet(
                () -> {
                  Cart c = new Cart();
                  c.setUser(user);
                  return cartRepository.save(c);
                });

    for (CartItem gl : guestLines) {
      Product p = gl.getProduct();
      if (!p.isPublished()) {
        continue;
      }
      if (p.getDeletedAt() != null) {
        continue;
      }
      int guestQty = gl.getQuantity();
      int max = p.getType() == ProductType.vehicle ? 1 : Math.max(1, p.getStockQuantity());
      CartItem existing =
          cartItemRepository.findByCart_IdAndProduct_IdAndDeletedAtIsNull(userCart.getId(), p.getId()).orElse(null);
      if (existing == null) {
        CartItem ni = new CartItem();
        ni.setCart(userCart);
        ni.setProduct(p);
        ni.setQuantity(Math.min(guestQty, max));
        cartItemRepository.save(ni);
      } else {
        int combined = Math.min(existing.getQuantity() + guestQty, max);
        existing.setQuantity(combined);
        cartItemRepository.save(existing);
      }
    }

    guestLines.forEach(this::softDeleteCartItem);
  }

  private void softDeleteCartItem(CartItem row) {
    row.setDeletedAt(Instant.now());
    cartItemRepository.save(row);
  }
}
