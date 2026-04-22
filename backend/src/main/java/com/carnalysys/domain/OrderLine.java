package com.carnalysys.domain;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import java.math.BigDecimal;
import java.util.UUID;

@Entity
@Table(name = "order_lines")
public class OrderLine {

  @Id private UUID id = UUID.randomUUID();

  @ManyToOne(fetch = FetchType.LAZY)
  @JoinColumn(name = "order_id", nullable = false)
  private OrderEntity order;

  @Column(name = "product_id", nullable = false)
  private String productId;

  @Column(name = "product_name_snapshot", nullable = false)
  private String productNameSnapshot;

  @Column(name = "sku_snapshot", nullable = false)
  private String skuSnapshot;

  @Column(nullable = false)
  private int quantity;

  @Column(name = "unit_price_inr", nullable = false, precision = 14, scale = 2)
  private BigDecimal unitPriceInr;

  @Column(name = "line_total_inr", nullable = false, precision = 14, scale = 2)
  private BigDecimal lineTotalInr;

  public UUID getId() {
    return id;
  }

  public OrderEntity getOrder() {
    return order;
  }

  public void setOrder(OrderEntity order) {
    this.order = order;
  }

  public String getProductId() {
    return productId;
  }

  public void setProductId(String productId) {
    this.productId = productId;
  }

  public String getProductNameSnapshot() {
    return productNameSnapshot;
  }

  public void setProductNameSnapshot(String productNameSnapshot) {
    this.productNameSnapshot = productNameSnapshot;
  }

  public String getSkuSnapshot() {
    return skuSnapshot;
  }

  public void setSkuSnapshot(String skuSnapshot) {
    this.skuSnapshot = skuSnapshot;
  }

  public int getQuantity() {
    return quantity;
  }

  public void setQuantity(int quantity) {
    this.quantity = quantity;
  }

  public BigDecimal getUnitPriceInr() {
    return unitPriceInr;
  }

  public void setUnitPriceInr(BigDecimal unitPriceInr) {
    this.unitPriceInr = unitPriceInr;
  }

  public BigDecimal getLineTotalInr() {
    return lineTotalInr;
  }

  public void setLineTotalInr(BigDecimal lineTotalInr) {
    this.lineTotalInr = lineTotalInr;
  }
}
