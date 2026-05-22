package com.carnalysys.domain;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import java.time.Instant;

@Entity
@Table(name = "product_low_stock_alert_state")
public class ProductLowStockAlertState {

  @Id
  @Column(name = "product_id", nullable = false)
  private String productId;

  @Column(name = "last_alert_at", nullable = false)
  private Instant lastAlertAt;

  @Column(name = "stock_at_alert", nullable = false)
  private int stockAtAlert;

  public String getProductId() {
    return productId;
  }

  public void setProductId(String productId) {
    this.productId = productId;
  }

  public Instant getLastAlertAt() {
    return lastAlertAt;
  }

  public void setLastAlertAt(Instant lastAlertAt) {
    this.lastAlertAt = lastAlertAt;
  }

  public int getStockAtAlert() {
    return stockAtAlert;
  }

  public void setStockAtAlert(int stockAtAlert) {
    this.stockAtAlert = stockAtAlert;
  }
}
