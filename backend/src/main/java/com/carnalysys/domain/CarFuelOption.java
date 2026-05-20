package com.carnalysys.domain;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

@Entity
@Table(name = "car_fuel_options")
public class CarFuelOption {

  @Id
  @GeneratedValue(strategy = GenerationType.IDENTITY)
  private Long id;

  @Column(nullable = false, unique = true)
  private String label;

  @Column(name = "sort_order", nullable = false)
  private short sortOrder;

  public Long getId() {
    return id;
  }

  public String getLabel() {
    return label;
  }

  public void setLabel(String label) {
    this.label = label;
  }

  public short getSortOrder() {
    return sortOrder;
  }

  public void setSortOrder(short sortOrder) {
    this.sortOrder = sortOrder;
  }
}
