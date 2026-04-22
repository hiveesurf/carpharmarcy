package com.carnalysys.domain;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import java.math.BigDecimal;
import java.time.Instant;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

@Entity
@Table(name = "orders")
public class OrderEntity {

  @Id private String id;

  @ManyToOne(fetch = FetchType.LAZY)
  @JoinColumn(name = "user_id", nullable = false)
  private UserEntity user;

  @Enumerated(EnumType.STRING)
  @JdbcTypeCode(SqlTypes.NAMED_ENUM)
  @Column(nullable = false, columnDefinition = "order_status")
  private OrderStatus status = OrderStatus.placed;

  @Column(name = "total_inr", nullable = false, precision = 14, scale = 2)
  private BigDecimal totalInr;

  @JdbcTypeCode(SqlTypes.CHAR)
  @Column(nullable = false, length = 3)
  private String currency = "INR";

  @ManyToOne(fetch = FetchType.LAZY)
  @JoinColumn(name = "shipping_address_id")
  private AddressEntity shippingAddress;

  @Enumerated(EnumType.STRING)
  @Column(name = "payment_method", nullable = false)
  private PaymentMethod paymentMethod = PaymentMethod.cod;

  @Enumerated(EnumType.STRING)
  @Column(name = "payment_status", nullable = false)
  private PaymentStatus paymentStatus = PaymentStatus.pending;

  @Column(name = "payment_provider")
  private String paymentProvider;

  @Column(name = "payment_txn_id")
  private String paymentTxnId;

  @Column(name = "payment_order_ref")
  private String paymentOrderRef;

  @Column(name = "paid_at")
  private Instant paidAt;

  @Column(name = "payment_attempt_count", nullable = false)
  private int paymentAttemptCount = 0;

  @Column(name = "payment_last_error")
  private String paymentLastError;

  @Column(name = "placed_at", nullable = false)
  private Instant placedAt = Instant.now();

  @Column(name = "updated_at", nullable = false)
  private Instant updatedAt = Instant.now();

  @Column(name = "assigned_delivery_admin_email")
  private String assignedDeliveryAdminEmail;

  @Column(name = "assigned_delivery_at")
  private Instant assignedDeliveryAt;

  public String getId() {
    return id;
  }

  public void setId(String id) {
    this.id = id;
  }

  public UserEntity getUser() {
    return user;
  }

  public void setUser(UserEntity user) {
    this.user = user;
  }

  public OrderStatus getStatus() {
    return status;
  }

  public void setStatus(OrderStatus status) {
    this.status = status;
  }

  public BigDecimal getTotalInr() {
    return totalInr;
  }

  public void setTotalInr(BigDecimal totalInr) {
    this.totalInr = totalInr;
  }

  public String getCurrency() {
    return currency;
  }

  public void setCurrency(String currency) {
    this.currency = currency;
  }

  public AddressEntity getShippingAddress() {
    return shippingAddress;
  }

  public void setShippingAddress(AddressEntity shippingAddress) {
    this.shippingAddress = shippingAddress;
  }

  public PaymentMethod getPaymentMethod() {
    return paymentMethod;
  }

  public void setPaymentMethod(PaymentMethod paymentMethod) {
    this.paymentMethod = paymentMethod;
  }

  public PaymentStatus getPaymentStatus() {
    return paymentStatus;
  }

  public void setPaymentStatus(PaymentStatus paymentStatus) {
    this.paymentStatus = paymentStatus;
  }

  public String getPaymentProvider() {
    return paymentProvider;
  }

  public void setPaymentProvider(String paymentProvider) {
    this.paymentProvider = paymentProvider;
  }

  public String getPaymentTxnId() {
    return paymentTxnId;
  }

  public void setPaymentTxnId(String paymentTxnId) {
    this.paymentTxnId = paymentTxnId;
  }

  public String getPaymentOrderRef() {
    return paymentOrderRef;
  }

  public void setPaymentOrderRef(String paymentOrderRef) {
    this.paymentOrderRef = paymentOrderRef;
  }

  public Instant getPaidAt() {
    return paidAt;
  }

  public void setPaidAt(Instant paidAt) {
    this.paidAt = paidAt;
  }

  public int getPaymentAttemptCount() {
    return paymentAttemptCount;
  }

  public void setPaymentAttemptCount(int paymentAttemptCount) {
    this.paymentAttemptCount = paymentAttemptCount;
  }

  public String getPaymentLastError() {
    return paymentLastError;
  }

  public void setPaymentLastError(String paymentLastError) {
    this.paymentLastError = paymentLastError;
  }

  public Instant getPlacedAt() {
    return placedAt;
  }

  public void setPlacedAt(Instant placedAt) {
    this.placedAt = placedAt;
  }

  public Instant getUpdatedAt() {
    return updatedAt;
  }

  public void setUpdatedAt(Instant updatedAt) {
    this.updatedAt = updatedAt;
  }

  public String getAssignedDeliveryAdminEmail() {
    return assignedDeliveryAdminEmail;
  }

  public void setAssignedDeliveryAdminEmail(String assignedDeliveryAdminEmail) {
    this.assignedDeliveryAdminEmail = assignedDeliveryAdminEmail;
  }

  public Instant getAssignedDeliveryAt() {
    return assignedDeliveryAt;
  }

  public void setAssignedDeliveryAt(Instant assignedDeliveryAt) {
    this.assignedDeliveryAt = assignedDeliveryAt;
  }
}
