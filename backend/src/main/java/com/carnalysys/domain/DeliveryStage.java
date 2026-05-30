package com.carnalysys.domain;

public enum DeliveryStage {
  assigned,
  accepted,
  out_for_delivery,
  otp_pending,
  delivered,
  delivery_failed;

  public static DeliveryStage fromApi(String raw) {
    if (raw == null || raw.isBlank()) {
      throw new IllegalArgumentException("delivery stage required");
    }
    String normalized = raw.trim().toLowerCase().replace('-', '_');
    return DeliveryStage.valueOf(normalized);
  }
}
