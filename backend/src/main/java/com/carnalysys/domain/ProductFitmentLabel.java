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
import java.util.Objects;

@Entity
@Table(name = "product_fitment_labels")
@IdClass(ProductFitmentLabel.ProductFitmentLabelId.class)
public class ProductFitmentLabel {

  @Id
  @Column(name = "product_id")
  private String productId;

  @Id private String label;

  @ManyToOne(fetch = FetchType.LAZY)
  @JoinColumn(name = "product_id", insertable = false, updatable = false)
  private Product product;

  public String getProductId() {
    return productId;
  }

  public void setProductId(String productId) {
    this.productId = productId;
  }

  public String getLabel() {
    return label;
  }

  public void setLabel(String label) {
    this.label = label;
  }

  public Product getProduct() {
    return product;
  }

  public static class ProductFitmentLabelId implements Serializable {
    private String productId;
    private String label;

    public ProductFitmentLabelId() {}

    public ProductFitmentLabelId(String productId, String label) {
      this.productId = productId;
      this.label = label;
    }

    @Override
    public boolean equals(Object o) {
      if (this == o) return true;
      if (o == null || getClass() != o.getClass()) return false;
      ProductFitmentLabelId that = (ProductFitmentLabelId) o;
      return Objects.equals(productId, that.productId) && Objects.equals(label, that.label);
    }

    @Override
    public int hashCode() {
      return Objects.hash(productId, label);
    }
  }
}
