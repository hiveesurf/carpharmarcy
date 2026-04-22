package com.carnalysys.service;

import com.carnalysys.domain.Product;
import com.carnalysys.domain.ProductFitmentCar;
import com.carnalysys.domain.ProductFitmentLabel;
import com.carnalysys.domain.ProductType;
import jakarta.persistence.criteria.Join;
import jakarta.persistence.criteria.Predicate;
import jakarta.persistence.criteria.Root;
import jakarta.persistence.criteria.Subquery;
import org.springframework.data.jpa.domain.Specification;

final class CatalogProductSpecifications {

  private CatalogProductSpecifications() {}

  static Specification<Product> build(
      String type, String category, String search, String carModel, String carId) {
    Specification<Product> spec = published().and(active());
    if ("vehicle".equals(type)) {
      spec = spec.and(typeEquals(ProductType.vehicle));
    } else if ("part".equals(type)) {
      spec = spec.and(typeEquals(ProductType.part));
    }
    spec = spec.and(categoryMatches(category));
    spec = spec.and(searchMatches(search));
    spec = spec.and(carModelMatches(carModel, type));
    spec = spec.and(carIdMatches(carId, type));
    return spec;
  }

  private static Specification<Product> published() {
    return (root, query, cb) -> cb.isTrue(root.get("published"));
  }

  private static Specification<Product> active() {
    return (root, query, cb) -> cb.isNull(root.get("deletedAt"));
  }

  private static Specification<Product> typeEquals(ProductType type) {
    return (root, query, cb) -> cb.equal(root.get("type"), type);
  }

  private static Specification<Product> categoryMatches(String categoryRaw) {
    if (categoryRaw == null || categoryRaw.isBlank()) {
      return (root, query, cb) -> cb.conjunction();
    }
    String cat = categoryRaw.trim();
    return (root, query, cb) -> {
      Join<Object, Object> c = root.join("category");
      return cb.and(
          cb.isNull(c.get("deletedAt")),
          cb.or(
          cb.equal(cb.lower(c.get("slug")), cat.toLowerCase()),
              cb.equal(cb.lower(c.get("name")), cat.toLowerCase())));
    };
  }

  private static Specification<Product> searchMatches(String searchRaw) {
    if (searchRaw == null || searchRaw.isBlank()) {
      return (root, query, cb) -> cb.conjunction();
    }
    String q = "%" + searchRaw.toLowerCase().trim() + "%";
    return (root, query, cb) -> {
      Join<Object, Object> c = root.join("category");
      return cb.or(
          cb.like(cb.lower(root.get("name")), q),
          cb.like(cb.lower(root.get("sku")), q),
          cb.and(cb.isNull(c.get("deletedAt")), cb.like(cb.lower(c.get("name")), q)));
    };
  }

  private static Specification<Product> carModelMatches(String carRaw, String typeParam) {
    if (carRaw == null || carRaw.isBlank()) {
      return (root, query, cb) -> cb.conjunction();
    }
    String pattern = "%" + carRaw.toLowerCase().trim() + "%";
    return (root, query, cb) -> {
      if ("vehicle".equals(typeParam)) {
        return cb.like(cb.lower(root.get("name")), pattern);
      }
      if ("part".equals(typeParam)) {
        return cb.or(
            cb.like(cb.lower(root.get("name")), pattern), fitmentLike(root, query, cb, pattern));
      }
      Predicate vehicleBranch =
          cb.and(
              cb.equal(root.get("type"), ProductType.vehicle),
              cb.like(cb.lower(root.get("name")), pattern));
      Predicate partBranch =
          cb.and(
              cb.equal(root.get("type"), ProductType.part),
              cb.or(
                  cb.like(cb.lower(root.get("name")), pattern),
                  fitmentLike(root, query, cb, pattern)));
      return cb.or(vehicleBranch, partBranch);
    };
  }

  private static Predicate fitmentLike(
      Root<Product> root,
      jakarta.persistence.criteria.CriteriaQuery<?> query,
      jakarta.persistence.criteria.CriteriaBuilder cb,
      String pattern) {
    Subquery<String> sq = query.subquery(String.class);
    Root<ProductFitmentLabel> fl = sq.from(ProductFitmentLabel.class);
    sq.select(fl.get("productId"));
    sq.where(
        cb.equal(fl.get("productId"), root.get("id")),
        cb.like(cb.lower(fl.get("label")), pattern));
    return cb.exists(sq);
  }

  private static Specification<Product> carIdMatches(String carIdRaw, String typeParam) {
    if (carIdRaw == null || carIdRaw.isBlank()) {
      return (root, query, cb) -> cb.conjunction();
    }
    String carId = carIdRaw.trim();
    return (root, query, cb) -> {
      if ("vehicle".equals(typeParam)) {
        return cb.equal(root.get("id"), carId);
      }
      if ("part".equals(typeParam)) {
        return fitmentCarIdEquals(root, query, cb, carId);
      }
      Predicate vehicleBranch =
          cb.and(cb.equal(root.get("type"), ProductType.vehicle), cb.equal(root.get("id"), carId));
      Predicate partBranch =
          cb.and(cb.equal(root.get("type"), ProductType.part), fitmentCarIdEquals(root, query, cb, carId));
      return cb.or(vehicleBranch, partBranch);
    };
  }

  private static Predicate fitmentCarIdEquals(
      Root<Product> root,
      jakarta.persistence.criteria.CriteriaQuery<?> query,
      jakarta.persistence.criteria.CriteriaBuilder cb,
      String carId) {
    Subquery<String> sq = query.subquery(String.class);
    Root<ProductFitmentCar> fc = sq.from(ProductFitmentCar.class);
    sq.select(fc.get("productId"));
    sq.where(cb.equal(fc.get("productId"), root.get("id")), cb.equal(fc.get("carId"), carId));
    return cb.exists(sq);
  }
}
