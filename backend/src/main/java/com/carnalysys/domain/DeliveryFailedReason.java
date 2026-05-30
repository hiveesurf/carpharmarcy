package com.carnalysys.domain;

public enum DeliveryFailedReason {
  customer_not_available,
  phone_not_reachable,
  wrong_address,
  customer_refused,
  other;

  public static DeliveryFailedReason fromApi(String raw) {
    if (raw == null || raw.isBlank()) {
      throw new IllegalArgumentException("failed reason required");
    }
    String normalized = raw.trim().toLowerCase().replace(' ', '_').replace('-', '_');
    return DeliveryFailedReason.valueOf(normalized);
  }

  public String displayLabel() {
    return switch (this) {
      case customer_not_available -> "Customer Not Available";
      case phone_not_reachable -> "Phone Not Reachable";
      case wrong_address -> "Wrong Address";
      case customer_refused -> "Customer Refused";
      case other -> "Other";
    };
  }
}
