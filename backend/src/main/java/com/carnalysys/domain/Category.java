package com.carnalysys.domain;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import java.time.Instant;

@Entity
@Table(name = "categories")
public class Category {

  @Id
  @Column(name = "slug")
  private String slug;

  @Column(nullable = false)
  private String name;

  @Column(name = "display_order", nullable = false)
  private int displayOrder = 0;

  @Column(name = "created_at", nullable = false)
  private Instant createdAt = Instant.now();

  @Column(name = "updated_at", nullable = false)
  private Instant updatedAt = Instant.now();

  @Column(name = "created_by_admin_email")
  private String createdByAdminEmail;

  @Column(name = "deleted_at")
  private Instant deletedAt;

  public String getSlug() {
    return slug;
  }

  public void setSlug(String slug) {
    this.slug = slug;
  }

  public String getName() {
    return name;
  }

  public void setName(String name) {
    this.name = name;
  }

  public int getDisplayOrder() {
    return displayOrder;
  }

  public void setDisplayOrder(int displayOrder) {
    this.displayOrder = displayOrder;
  }

  public String getCreatedByAdminEmail() {
    return createdByAdminEmail;
  }

  public void setCreatedByAdminEmail(String createdByAdminEmail) {
    this.createdByAdminEmail = createdByAdminEmail;
  }

  public Instant getDeletedAt() {
    return deletedAt;
  }

  public void setDeletedAt(Instant deletedAt) {
    this.deletedAt = deletedAt;
  }
}
