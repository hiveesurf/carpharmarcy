package com.carnalysys.util;

import com.carnalysys.domain.OrderStatus;
import java.util.EnumSet;
import java.util.Set;

/** Normalizes workforce availability for API responses and assignment rules. */
public final class EmployeeAvailability {

  private static final Set<OrderStatus> ACTIVE_DELIVERY_ORDER_STATUSES =
      EnumSet.of(
          OrderStatus.placed,
          OrderStatus.confirmed,
          OrderStatus.processing,
          OrderStatus.shipped);

  private EmployeeAvailability() {}

  public static boolean isActiveDeliveryOrderStatus(OrderStatus status) {
    return status != null && ACTIVE_DELIVERY_ORDER_STATUSES.contains(status);
  }

  /**
   * Effective label for UI: offline only when stored status is offline; busy when stored busy or
   * active assigned orders exist; online for online/free when not busy.
   */
  public static String effectiveStatus(String availabilityStatus, boolean hasActiveAssignedOrders) {
    String raw =
        availabilityStatus == null || availabilityStatus.isBlank()
            ? "offline"
            : availabilityStatus.trim().toLowerCase();
    if ("offline".equals(raw)) {
      return "offline";
    }
    if (hasActiveAssignedOrders) {
      return "busy";
    }
    if ("online".equals(raw) || "free".equals(raw) || "busy".equals(raw)) {
      return "online";
    }
    return "offline";
  }

  public static boolean isStoredOnline(String availabilityStatus) {
    String raw =
        availabilityStatus == null ? "" : availabilityStatus.trim().toLowerCase();
    return "online".equals(raw) || "free".equals(raw);
  }
}
