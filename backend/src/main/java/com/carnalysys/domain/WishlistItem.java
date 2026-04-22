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
import java.util.UUID;

@Entity
@Table(name = "wishlist_items")
@IdClass(WishlistItem.WishlistItemId.class)
public class WishlistItem {

  @Id
  @Column(name = "user_id")
  private UUID userId;

  @Id
  @Column(name = "product_id")
  private String productId;

  @ManyToOne(fetch = FetchType.LAZY)
  @JoinColumn(name = "user_id", insertable = false, updatable = false)
  private UserEntity user;

  @ManyToOne(fetch = FetchType.LAZY)
  @JoinColumn(name = "product_id", insertable = false, updatable = false)
  private Product product;

  @Column(name = "created_at", nullable = false)
  private Instant createdAt = Instant.now();

  public UUID getUserId() {
    return userId;
  }

  public void setUserId(UUID userId) {
    this.userId = userId;
  }

  public String getProductId() {
    return productId;
  }

  public void setProductId(String productId) {
    this.productId = productId;
  }

  public Product getProduct() {
    return product;
  }

  public static class WishlistItemId implements Serializable {
    private UUID userId;
    private String productId;

    public WishlistItemId() {}

    public WishlistItemId(UUID userId, String productId) {
      this.userId = userId;
      this.productId = productId;
    }

    @Override
    public boolean equals(Object o) {
      if (this == o) return true;
      if (o == null || getClass() != o.getClass()) return false;
      WishlistItemId that = (WishlistItemId) o;
      return Objects.equals(userId, that.userId) && Objects.equals(productId, that.productId);
    }

    @Override
    public int hashCode() {
      return Objects.hash(userId, productId);
    }
  }
}
