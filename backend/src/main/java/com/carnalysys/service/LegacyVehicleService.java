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

  public List<Map<String, String>> years() {
    List<String> y = List.of("2025", "2024", "2023", "2022", "2021", "2020", "2019", "2018");
    return y.stream().map(v -> Map.of("id", v, "label", v)).toList();
  }

  public List<Map<String, String>> variants() {
    List<String> v = List.of("Base", "Mid", "Top", "Sport", "Diesel", "Petrol");
    return v.stream().map(s -> Map.of("id", SlugUtil.slug(s), "label", s)).toList();
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
