package com.carnalysys.service;

import com.carnalysys.domain.CarModelEntity;
import com.carnalysys.domain.Product;
import com.carnalysys.domain.ProductType;
import com.carnalysys.domain.ProductVehicleSpec;
import com.fasterxml.jackson.databind.JsonNode;
import java.math.RoundingMode;
import java.util.ArrayList;
import java.util.Collections;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import org.springframework.stereotype.Component;

@Component
public class ProductPresenter {

  private final UploadStorageService uploadStorageService;

  public ProductPresenter(UploadStorageService uploadStorageService) {
    this.uploadStorageService = uploadStorageService;
  }

  public Map<String, Object> toPublicMap(
      Product p,
      List<String> fitmentLabels,
      List<String> fitmentCarIds,
      Map<String, CarModelEntity> carsById,
      ProductVehicleSpec spec) {
    Map<String, Object> m = new LinkedHashMap<>();
    m.put("id", p.getId());
    m.put("type", p.getType().name());
    m.put("sku", p.getSku());
    m.put("name", p.getName());
    m.put("category", p.getCategory().getName());
    int actualPrice = p.getPriceInr().setScale(0, RoundingMode.DOWN).intValue();
    m.put("price", actualPrice);
    m.put("actualPrice", actualPrice);
    m.put(
        "discountedPrice",
        p.getDiscountedPriceInr() != null
            ? p.getDiscountedPriceInr().setScale(0, RoundingMode.DOWN).intValue()
            : null);
    m.put("totalStock", p.getStockQuantity());
    m.put("imageKey", p.getImageKey());
    if (p.getType() == ProductType.part) {
      m.put("compatibleCars", resolveCompatibleCarLabels(fitmentLabels, fitmentCarIds, carsById));
      m.put("compatibleCarIds", fitmentCarIds != null ? fitmentCarIds : List.of());
      m.put("compatibleCarDetails", toCarDetails(fitmentCarIds, carsById));
      JsonNode md = p.getMetadata();
      if (md != null && md.has("primaryImageUrl") && md.get("primaryImageUrl").isTextual()) {
        String url = md.get("primaryImageUrl").asText().trim();
        if (!url.isEmpty()) {
          m.put("image", uploadStorageService.resolvePublicVehicleUrl(url));
        }
      }
      if (md != null && md.has("galleryExtras") && md.get("galleryExtras").isArray()) {
        m.put("gallery", jsonArrayToList(md.get("galleryExtras")));
      }
    } else {
      m.put("compatibleCars", List.of());
      if (spec != null) {
        m.put("image", uploadStorageService.resolvePublicVehicleUrl(spec.getPrimaryImageUrl()));
        m.put("imageAlt", spec.getImageAlt());
        m.put("gallery", normalizeGallery(jsonArrayToList(spec.getGallery())));
        m.put("description", p.getDescription() != null ? p.getDescription() : "");
        Map<String, Object> meta = new LinkedHashMap<>();
        meta.put("year", spec.getModelYear());
        meta.put("condition", spec.getCondition());
        meta.put("km", spec.getOdometerKm());
        meta.put("fuel", spec.getFuel());
        meta.put("transmission", spec.getTransmission());
        meta.put("location", spec.getLocation());
        m.put("carMeta", meta);
      }
    }
    if (p.getType() == ProductType.part && p.getDescription() != null) {
      m.put("description", p.getDescription());
    }
    return m;
  }

  /**
   * Human-readable fitment lines for parts. Prefer persisted {@code product_fitment_labels}; when
   * those are empty but {@code product_fitment_cars} has IDs, derive "Make Model" from {@code
   * car_models} so storefront clients receive non-empty {@code compatibleCars}.
   */
  private static List<String> resolveCompatibleCarLabels(
      List<String> fitmentLabels, List<String> fitmentCarIds, Map<String, CarModelEntity> carsById) {
    if (fitmentLabels != null && !fitmentLabels.isEmpty()) {
      return List.copyOf(fitmentLabels);
    }
    if (fitmentCarIds == null || fitmentCarIds.isEmpty() || carsById == null || carsById.isEmpty()) {
      return List.of();
    }
    List<String> derived = new ArrayList<>();
    for (String id : fitmentCarIds) {
      if (id == null || id.isBlank()) {
        continue;
      }
      CarModelEntity c = carsById.get(id.trim());
      if (c == null) {
        continue;
      }
      String label = formatCarFitmentDisplayName(c);
      if (!label.isBlank()) {
        derived.add(label);
      }
    }
    return derived.isEmpty() ? List.of() : Collections.unmodifiableList(derived);
  }

  private static String formatCarFitmentDisplayName(CarModelEntity c) {
    String make = c.getMake() != null ? c.getMake().trim() : "";
    String model = c.getModel() != null ? c.getModel().trim() : "";
    String joined = (make + " " + model).trim();
    return joined.isEmpty() && c.getId() != null ? c.getId() : joined;
  }

  private List<Map<String, Object>> toCarDetails(
      List<String> carIds, Map<String, CarModelEntity> carsById) {
    if (carIds == null || carIds.isEmpty() || carsById == null || carsById.isEmpty()) {
      return List.of();
    }
    List<Map<String, Object>> out = new ArrayList<>();
    for (String id : carIds) {
      CarModelEntity c = carsById.get(id);
      if (c == null) continue;
      Map<String, Object> row = new LinkedHashMap<>();
      row.put("id", c.getId());
      row.put("make", c.getMake());
      row.put("model", c.getModel());
      row.put("variant", c.getVariant());
      row.put("year", c.getModelYear());
      row.put("fuel", c.getFuel());
      row.put("transmission", c.getTransmission());
      row.put("engineCc", c.getEngineCc());
      row.put("image", uploadStorageService.resolvePublicVehicleUrl(c.getImageUrl()));
      out.add(row);
    }
    return out;
  }

  private List<Object> normalizeGallery(List<Object> rawGallery) {
    if (rawGallery == null || rawGallery.isEmpty()) {
      return List.of();
    }
    List<Object> normalized = new ArrayList<>(rawGallery.size());
    for (Object item : rawGallery) {
      if (item instanceof Map<?, ?> map) {
        Map<String, Object> copy = new LinkedHashMap<>();
        map.forEach((k, v) -> copy.put(String.valueOf(k), v));
        Object src = copy.get("src");
        if (src instanceof String s) {
          copy.put("src", uploadStorageService.resolvePublicVehicleUrl(s));
        }
        normalized.add(copy);
      } else if (item instanceof String s) {
        normalized.add(uploadStorageService.resolvePublicVehicleUrl(s));
      } else {
        normalized.add(item);
      }
    }
    return normalized;
  }

  private static List<Object> jsonArrayToList(JsonNode node) {
    if (node == null || !node.isArray()) {
      return List.of();
    }
    List<Object> out = new ArrayList<>();
    node.forEach(n -> out.add(jsonToValue(n)));
    return out;
  }

  private static Object jsonToValue(JsonNode n) {
    if (n.isObject()) {
      Map<String, Object> child = new LinkedHashMap<>();
      n.fields().forEachRemaining(e -> child.put(e.getKey(), jsonToValue(e.getValue())));
      return child;
    }
    if (n.isTextual()) return n.asText();
    if (n.isInt()) return n.asInt();
    if (n.isLong()) return n.asLong();
    if (n.isDouble() || n.isFloat()) return n.asDouble();
    if (n.isBoolean()) return n.asBoolean();
    if (n.isNull()) return null;
    return n.toString();
  }

  /** Admin listing: public shape + published flag + timestamps. */
  public Map<String, Object> toAdminMap(
      Product p,
      List<String> fitmentLabels,
      List<String> fitmentCarIds,
      Map<String, CarModelEntity> carsById,
      ProductVehicleSpec spec) {
    Map<String, Object> m = toPublicMap(p, fitmentLabels, fitmentCarIds, carsById, spec);
    m.put(
        "purchasePrice",
        p.getPurchasePriceInr() != null ? p.getPurchasePriceInr().setScale(0, RoundingMode.DOWN).intValue() : 0);
    m.put("published", p.isPublished());
    m.put("deleted", p.getDeletedAt() != null);
    m.put("deletedAt", p.getDeletedAt() != null ? p.getDeletedAt().toString() : null);
    if (p.getCreatedAt() != null) {
      m.put("createdAt", p.getCreatedAt().toString());
    }
    if (p.getUpdatedAt() != null) {
      m.put("updatedAt", p.getUpdatedAt().toString());
    }
    if (p.getType() == ProductType.part && p.getMetadata() != null) {
      JsonNode md = p.getMetadata();
      m.put("metadata", jsonToValue(md));
      if (md.isObject()) {
        putMetadataConvenienceField(m, md, "brand");
        putMetadataConvenienceField(m, md, "partNumber");
        putMetadataConvenienceField(m, md, "unitVolume");
        putMetadataConvenienceField(m, md, "supplierName");
      }
    }
    return m;
  }

  /**
   * Exposes selected metadata string fields at the top level for admin clients (e.g. edit form). Only
   * sets the key when the value is present and non-blank.
   */
  private static void putMetadataConvenienceField(Map<String, Object> m, JsonNode md, String key) {
    if (!md.has(key)) {
      return;
    }
    JsonNode v = md.get(key);
    if (v == null || v.isNull()) {
      return;
    }
    if (v.isTextual()) {
      String s = v.asText().trim();
      if (!s.isEmpty()) {
        m.put(key, s);
      }
      return;
    }
    if (v.isNumber() || v.isBoolean()) {
      m.put(key, v.asText());
    }
  }
}
