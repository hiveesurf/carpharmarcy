package com.carnalysys.domain;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.Id;
import jakarta.persistence.IdClass;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import java.io.Serializable;
import java.time.Instant;
import java.util.Objects;

@Entity
@Table(name = "product_fitment_cars")
@IdClass(ProductFitmentCar.ProductFitmentCarId.class)
public class ProductFitmentCar {

  @Id
  @Column(name = "product_id")
  private String productId;

  @Id
  @Column(name = "car_id")
  private String carId;

  @ManyToOne(fetch = FetchType.LAZY)
  @JoinColumn(name = "product_id", insertable = false, updatable = false)
  private Product product;

  @ManyToOne(fetch = FetchType.LAZY)
  @JoinColumn(name = "car_id", insertable = false, updatable = false)
  private CarModelEntity carModel;

  @Column(name = "created_at", nullable = false, updatable = false)
  private Instant createdAt = Instant.now();

  public String getProductId() {
    return productId;
  }

  public void setProductId(String productId) {
    this.productId = productId;
  }

  public String getCarId() {
    return carId;
  }

  public void setCarId(String carId) {
    this.carId = carId;
  }

  public static class ProductFitmentCarId implements Serializable {
    private String productId;
    private String carId;

    public ProductFitmentCarId() {}

    public ProductFitmentCarId(String productId, String carId) {
      this.productId = productId;
      this.carId = carId;
    }

    @Override
    public boolean equals(Object o) {
      if (this == o) return true;
      if (o == null || getClass() != o.getClass()) return false;
      ProductFitmentCarId that = (ProductFitmentCarId) o;
      return Objects.equals(productId, that.productId) && Objects.equals(carId, that.carId);
    }

    @Override
    public int hashCode() {
      return Objects.hash(productId, carId);
    }
  }
}
