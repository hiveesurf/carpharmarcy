package com.carnalysys.service;

import com.carnalysys.api.ApiException;
import com.carnalysys.domain.Product;
import com.carnalysys.domain.WishlistItem;
import com.carnalysys.repo.CarModelRepository;
import com.carnalysys.repo.ProductFitmentCarRepository;
import com.carnalysys.repo.ProductFitmentLabelRepository;
import com.carnalysys.repo.ProductRepository;
import com.carnalysys.repo.ProductVehicleSpecRepository;
import com.carnalysys.repo.WishlistItemRepository;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.stream.Collectors;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class WishlistService {

  private final WishlistItemRepository wishlistItemRepository;
  private final ProductRepository productRepository;
  private final ProductFitmentLabelRepository fitmentLabelRepository;
  private final ProductFitmentCarRepository fitmentCarRepository;
  private final CarModelRepository carModelRepository;
  private final ProductVehicleSpecRepository vehicleSpecRepository;
  private final ProductPresenter productPresenter;

  public WishlistService(
      WishlistItemRepository wishlistItemRepository,
      ProductRepository productRepository,
      ProductFitmentLabelRepository fitmentLabelRepository,
      ProductFitmentCarRepository fitmentCarRepository,
      CarModelRepository carModelRepository,
      ProductVehicleSpecRepository vehicleSpecRepository,
      ProductPresenter productPresenter) {
    this.wishlistItemRepository = wishlistItemRepository;
    this.productRepository = productRepository;
    this.fitmentLabelRepository = fitmentLabelRepository;
    this.fitmentCarRepository = fitmentCarRepository;
    this.carModelRepository = carModelRepository;
    this.vehicleSpecRepository = vehicleSpecRepository;
    this.productPresenter = productPresenter;
  }

  @Transactional(readOnly = true)
  public List<Map<String, Object>> list(UUID userId) {
    List<WishlistItem> rows = wishlistItemRepository.findByUserId(userId);
    List<String> ids = rows.stream().map(WishlistItem::getProductId).toList();
    if (ids.isEmpty()) return List.of();
    var fitMap =
        fitmentLabelRepository.findByProductIdIn(ids).stream()
            .collect(
                Collectors.groupingBy(
                    com.carnalysys.domain.ProductFitmentLabel::getProductId,
                    Collectors.mapping(
                        com.carnalysys.domain.ProductFitmentLabel::getLabel,
                        Collectors.toList())));
    var specMap =
        vehicleSpecRepository.findByProductIdIn(ids).stream()
            .collect(
                Collectors.toMap(
                    com.carnalysys.domain.ProductVehicleSpec::getProductId, s -> s, (a, b) -> a));
    var fitCarMap =
        fitmentCarRepository.findByProductIdIn(ids).stream()
            .collect(
                Collectors.groupingBy(
                    com.carnalysys.domain.ProductFitmentCar::getProductId,
                    Collectors.mapping(com.carnalysys.domain.ProductFitmentCar::getCarId, Collectors.toList())));
    var carsById =
        carModelRepository.findAllById(
                fitCarMap.values().stream().flatMap(List::stream).distinct().toList())
            .stream()
            .collect(Collectors.toMap(com.carnalysys.domain.CarModelEntity::getId, c -> c));
    List<Map<String, Object>> out = new ArrayList<>();
    for (WishlistItem w : rows) {
      productRepository
          .findById(w.getProductId())
          .filter(Product::isPublished)
          .ifPresent(
              p ->
                  out.add(
                      productPresenter.toPublicMap(
                          p,
                          fitMap.getOrDefault(p.getId(), List.of()),
                          fitCarMap.getOrDefault(p.getId(), List.of()),
                          carsById,
                          specMap.get(p.getId()))));
    }
    return out;
  }

  @Transactional
  public Map<String, Object> toggle(UUID userId, String productId) {
    productRepository
        .findById(productId)
        .filter(Product::isPublished)
        .orElseThrow(
            () -> new ApiException(HttpStatus.NOT_FOUND, "NOT_FOUND", "Unknown product"));
    if (wishlistItemRepository.existsByUserIdAndProductId(userId, productId)) {
      wishlistItemRepository.deleteByUserIdAndProductId(userId, productId);
      return Map.of("productId", productId, "inWishlist", false);
    }
    WishlistItem w = new WishlistItem();
    w.setUserId(userId);
    w.setProductId(productId);
    wishlistItemRepository.save(w);
    return Map.of("productId", productId, "inWishlist", true);
  }
}
