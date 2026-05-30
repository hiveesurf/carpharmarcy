package com.carnalysys.service;

import com.carnalysys.domain.ProductType;
import com.carnalysys.domain.CarModelEntity;
import com.carnalysys.repo.CarModelRepository;
import com.carnalysys.repo.ProductFitmentLabelRepository;
import com.carnalysys.repo.ProductRepository;
import com.carnalysys.util.SlugUtil;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.LinkedHashMap;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.TreeSet;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class LegacyVehicleService {

  private final ProductRepository productRepository;
  private final ProductFitmentLabelRepository fitmentLabelRepository;
  private final CarModelRepository carModelRepository;

  public LegacyVehicleService(
      ProductRepository productRepository,
      ProductFitmentLabelRepository fitmentLabelRepository,
      CarModelRepository carModelRepository) {
    this.productRepository = productRepository;
    this.fitmentLabelRepository = fitmentLabelRepository;
    this.carModelRepository = carModelRepository;
  }

  @Transactional(readOnly = true)
  public List<Map<String, String>> brands() {
    List<Map<String, String>> fromCars =
        carModelRepository.findByPublishedTrueAndDeletedAtIsNullOrderByMakeAscModelAscModelYearDesc().stream()
            .map(c -> c.getMake())
            .distinct()
            .sorted(String.CASE_INSENSITIVE_ORDER)
            .map(n -> Map.of("id", SlugUtil.slug(n), "name", n))
            .toList();
    if (!fromCars.isEmpty()) return fromCars;
    List<String> partIds =
        productRepository.findByPublishedTrueAndTypeAndDeletedAtIsNull(ProductType.part).stream()
            .map(p -> p.getId())
            .toList();
    if (partIds.isEmpty()) return List.of();
    Set<String> names = new TreeSet<>();
    for (var f : fitmentLabelRepository.findByProductIdIn(partIds)) {
      String line = f.getLabel();
      if ("All vehicles".equalsIgnoreCase(line)) continue;
      String brand = line.split("\\s+")[0];
      if (!brand.isBlank()) names.add(brand);
    }
    return names.stream().map(n -> Map.of("id", SlugUtil.slug(n), "name", n)).toList();
  }

  @Transactional(readOnly = true)
  public List<Map<String, Object>> cars() {
    return carModelRepository.findByPublishedTrueAndDeletedAtIsNullOrderByMakeAscModelAscModelYearDesc().stream()
        .map(this::toCarMap)
        .toList();
  }

  @Transactional(readOnly = true)
  public List<Map<String, String>> models(String brandId) {
    if (brandId == null || brandId.isBlank()) {
      return List.of();
    }
    List<Map<String, String>> fromCars =
        carModelRepository.findByPublishedTrueAndDeletedAtIsNullOrderByMakeAscModelAscModelYearDesc().stream()
            .filter(c -> SlugUtil.slug(c.getMake()).equals(brandId))
            .map(
                c -> {
                  String full = c.getMake() + " " + c.getModel();
                  return Map.of("id", c.getId(), "name", c.getModel(), "fullName", full);
                })
            .toList();
    if (!fromCars.isEmpty()) return fromCars;

    List<String> partIds =
        productRepository.findByPublishedTrueAndTypeAndDeletedAtIsNull(ProductType.part).stream()
            .map(p -> p.getId())
            .toList();
    Set<String> brandNames = new LinkedHashSet<>();
    for (var f : fitmentLabelRepository.findByProductIdIn(partIds)) {
      String line = f.getLabel();
      if ("All vehicles".equalsIgnoreCase(line)) continue;
      brandNames.add(line.split("\\s+")[0]);
    }
    String brandName =
        brandNames.stream()
            .filter(b -> SlugUtil.slug(b).equals(brandId))
            .findFirst()
            .orElse(null);
    if (brandName == null) return List.of();
    Set<String> seen = new LinkedHashSet<>();
    List<Map<String, String>> out = new ArrayList<>();
    for (var f : fitmentLabelRepository.findByProductIdIn(partIds)) {
      String line = f.getLabel();
      if ("All vehicles".equalsIgnoreCase(line)) continue;
      if (!line.startsWith(brandName + " ")) continue;
      if (!seen.add(line)) continue;
      String model = line.substring(brandName.length() + 1).trim();
      Map<String, String> row = new LinkedHashMap<>();
      row.put("id", SlugUtil.slug(line));
      row.put("name", model);
      row.put("fullName", line);
      out.add(row);
    }
    out.sort(Comparator.comparing(m -> m.get("fullName")));
    return out;
  }

  @Transactional(readOnly = true)
  public List<Map<String, String>> years(String brandId, String modelId) {
    if (brandId == null || brandId.isBlank()) {
      return List.of();
    }
    List<CarModelEntity> scoped = filterPublishedCars(brandId, modelId, null);
    if (!scoped.isEmpty()) {
      return scoped.stream()
          .map(CarModelEntity::getModelYear)
          .filter(y -> y != null && y > 0)
          .map(Short::intValue)
          .distinct()
          .sorted(Comparator.reverseOrder())
          .map(y -> String.valueOf(y))
          .map(y -> Map.of("id", y, "label", y))
          .toList();
    }
    List<String> fallback = List.of("2025", "2024", "2023", "2022", "2021", "2020", "2019", "2018");
    return fallback.stream().map(v -> Map.of("id", v, "label", v)).toList();
  }

  /**
   * Fuel / variant options for hero fitment (e.g. Petrol, Diesel). Derived from published {@code
   * car_models} for the selected brand, model line, and year.
   */
  @Transactional(readOnly = true)
  public List<Map<String, String>> variants(String brandId, String modelId, String yearRaw) {
    if (brandId == null || brandId.isBlank()) {
      return List.of();
    }
    Short year = parseYear(yearRaw);
    List<CarModelEntity> scoped = filterPublishedCars(brandId, modelId, year);
    LinkedHashSet<String> labels = new LinkedHashSet<>();
    for (CarModelEntity c : scoped) {
      String fuel = formatOptionLabel(c.getFuel());
      if (!fuel.isBlank()) {
        labels.add(fuel);
        continue;
      }
      String variant = formatOptionLabel(c.getVariant());
      if (!variant.isBlank()) {
        labels.add(variant);
      }
    }
    return labels.stream()
        .map(label -> Map.of("id", SlugUtil.slug(label), "label", label))
        .toList();
  }

  private static Short parseYear(String yearRaw) {
    if (yearRaw == null || yearRaw.isBlank()) {
      return null;
    }
    try {
      int y = Integer.parseInt(yearRaw.trim());
      return y > 0 ? (short) y : null;
    } catch (NumberFormatException e) {
      return null;
    }
  }

  private List<CarModelEntity> filterPublishedCars(String brandId, String modelId, Short year) {
    List<CarModelEntity> rows =
        carModelRepository.findByPublishedTrueAndDeletedAtIsNullOrderByMakeAscModelAscModelYearDesc();
    if (rows.isEmpty()) {
      return List.of();
    }
    String makeKey = null;
    String modelKey = null;
    if (modelId != null && !modelId.isBlank()) {
      var anchorOpt =
          carModelRepository
              .findById(modelId.trim())
              .filter(c -> c.getDeletedAt() == null && c.isPublished());
      if (anchorOpt.isPresent()) {
        CarModelEntity anchor = anchorOpt.get();
        makeKey = normalizeKey(anchor.getMake());
        modelKey = normalizeKey(anchor.getModel());
      }
    }
    final String resolvedMakeKey = makeKey;
    final String resolvedModelKey = modelKey;
    return rows.stream()
        .filter(
            c -> {
              if (brandId != null && !brandId.isBlank()) {
                if (!SlugUtil.slug(c.getMake()).equals(brandId.trim())) {
                  return false;
                }
              }
              if (resolvedMakeKey != null && resolvedModelKey != null) {
                if (!normalizeKey(c.getMake()).equals(resolvedMakeKey)
                    || !normalizeKey(c.getModel()).equals(resolvedModelKey)) {
                  return false;
                }
              }
              if (year != null) {
                return year.equals(c.getModelYear());
              }
              return true;
            })
        .toList();
  }

  private static String normalizeKey(String value) {
    if (value == null) {
      return "";
    }
    return value.trim().replaceAll("\\s+", " ").toLowerCase();
  }

  private static String formatOptionLabel(String raw) {
    if (raw == null || raw.isBlank()) {
      return "";
    }
    String[] parts = raw.trim().replaceAll("\\s+", " ").split(" ");
    StringBuilder sb = new StringBuilder();
    for (String part : parts) {
      if (part.isEmpty()) {
        continue;
      }
      if (!sb.isEmpty()) {
        sb.append(' ');
      }
      String lower = part.toLowerCase();
      sb.append(Character.toUpperCase(lower.charAt(0)));
      if (lower.length() > 1) {
        sb.append(lower.substring(1));
      }
    }
    return sb.toString();
  }

  private Map<String, Object> toCarMap(CarModelEntity c) {
    Map<String, Object> m = new LinkedHashMap<>();
    m.put("id", c.getId());
    m.put("make", c.getMake());
    m.put("model", c.getModel());
    m.put("variant", c.getVariant());
    m.put("modelYear", c.getModelYear());
    m.put("fuel", c.getFuel());
    m.put("transmission", c.getTransmission());
    m.put("engineCc", c.getEngineCc());
    m.put("image", c.getImageUrl());
    m.put("notes", c.getNotes());
    m.put("published", c.isPublished());
    return m;
  }
}
