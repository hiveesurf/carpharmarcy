package com.carnalysys.domain;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import java.time.Instant;
import java.util.UUID;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

@Entity
@Table(name = "order_status_audit")
public class OrderStatusAuditEntity {

  @Id
  @GeneratedValue(strategy = GenerationType.UUID)
  private UUID id;

  @ManyToOne(fetch = FetchType.LAZY)
  @JoinColumn(name = "order_id", nullable = false)
  private OrderEntity order;

  @Enumerated(EnumType.STRING)
  @JdbcTypeCode(SqlTypes.NAMED_ENUM)
  @Column(name = "from_status", columnDefinition = "order_status")
  private OrderStatus fromStatus;

  @Enumerated(EnumType.STRING)
  @JdbcTypeCode(SqlTypes.NAMED_ENUM)
  @Column(name = "to_status", nullable = false, columnDefinition = "order_status")
  private OrderStatus toStatus;

  @Column(name = "changed_by_type", nullable = false)
  private String changedByType;

  @Column(name = "changed_by_id")
  private String changedById;

  @Column
  private String reason;

  @Column(name = "created_at", nullable = false)
  private Instant createdAt = Instant.now();

  public UUID getId() {
    return id;
  }

  public OrderEntity getOrder() {
    return order;
  }

  public void setOrder(OrderEntity order) {
    this.order = order;
  }

  public OrderStatus getFromStatus() {
    return fromStatus;
  }

  public void setFromStatus(OrderStatus fromStatus) {
    this.fromStatus = fromStatus;
  }

  public OrderStatus getToStatus() {
    return toStatus;
  }

  public void setToStatus(OrderStatus toStatus) {
    this.toStatus = toStatus;
  }

  public String getChangedByType() {
    return changedByType;
  }

  public void setChangedByType(String changedByType) {
    this.changedByType = changedByType;
  }

  public String getChangedById() {
    return changedById;
  }

  public void setChangedById(String changedById) {
    this.changedById = changedById;
  }

  public String getReason() {
    return reason;
  }

  public void setReason(String reason) {
    this.reason = reason;
  }

  public Instant getCreatedAt() {
    return createdAt;
  }
}
