package com.carnalysys.domain;

import com.fasterxml.jackson.databind.JsonNode;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.MapsId;
import jakarta.persistence.OneToOne;
import jakarta.persistence.Table;
import org.hibernate.annotations.ColumnTransformer;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

@Entity
@Table(name = "product_vehicle_specs")
public class ProductVehicleSpec {

  @Id
  @Column(name = "product_id")
  private String productId;

  @OneToOne(fetch = FetchType.LAZY)
  @MapsId
  @JoinColumn(name = "product_id")
  private Product product;

  @Column(name = "model_year")
  private Short modelYear;

  /** PostgreSQL {@code vehicle_condition}: {@code first-hand} or {@code second-hand}. */
  @Column(name = "condition", nullable = false, columnDefinition = "vehicle_condition")
  @ColumnTransformer(write = "?::vehicle_condition")
  private String condition;

  @Column(name = "odometer_km")
  private Integer odometerKm;

  private String fuel;
  private String transmission;
  private String location;

  @Column(name = "primary_image_url")
  private String primaryImageUrl;

  @Column(name = "image_alt")
  private String imageAlt;

  @JdbcTypeCode(SqlTypes.JSON)
  @Column(nullable = false, columnDefinition = "jsonb")
  private JsonNode gallery;

  public String getProductId() {
    return productId;
  }

  public void setProductId(String productId) {
    this.productId = productId;
  }

  public Product getProduct() {
    return product;
  }

  public void setProduct(Product product) {
    this.product = product;
  }

  public Short getModelYear() {
    return modelYear;
  }

  public void setModelYear(Short modelYear) {
    this.modelYear = modelYear;
  }

  public String getCondition() {
    return condition;
  }

  public void setCondition(String condition) {
    this.condition = condition;
  }

  public Integer getOdometerKm() {
    return odometerKm;
  }

  public void setOdometerKm(Integer odometerKm) {
    this.odometerKm = odometerKm;
  }

  public String getFuel() {
    return fuel;
  }

  public void setFuel(String fuel) {
    this.fuel = fuel;
  }

  public String getTransmission() {
    return transmission;
  }

  public void setTransmission(String transmission) {
    this.transmission = transmission;
  }

  public String getLocation() {
    return location;
  }

  public void setLocation(String location) {
    this.location = location;
  }

  public String getPrimaryImageUrl() {
    return primaryImageUrl;
  }

  public void setPrimaryImageUrl(String primaryImageUrl) {
    this.primaryImageUrl = primaryImageUrl;
  }

  public String getImageAlt() {
    return imageAlt;
  }

  public void setImageAlt(String imageAlt) {
    this.imageAlt = imageAlt;
  }

  public JsonNode getGallery() {
    return gallery;
  }

  public void setGallery(JsonNode gallery) {
    this.gallery = gallery;
  }
}
