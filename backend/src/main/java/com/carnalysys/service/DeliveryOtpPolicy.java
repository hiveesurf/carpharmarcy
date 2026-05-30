package com.carnalysys.service;

import com.carnalysys.config.AppProperties;
import org.springframework.core.env.Environment;

/** Profile-aware rules for customer delivery OTP (issue, WhatsApp, order details). */
public final class DeliveryOtpPolicy {

  private DeliveryOtpPolicy() {}

  public static boolean isLocalDevProfile(Environment environment) {
    for (String p : environment.getActiveProfiles()) {
      String v = p == null ? "" : p.trim().toLowerCase();
      if ("local".equals(v) || "dev".equals(v)) {
        return true;
      }
    }
    return false;
  }

  /**
   * Demo OTP ({@code app.otp.demo-code}) only when local/dev profile AND {@code app.delivery.demo-otp-enabled}.
   */
  public static boolean useDemoDeliveryOtp(Environment environment, AppProperties appProperties) {
    if (!isLocalDevProfile(environment)) {
      return false;
    }
    if (!appProperties.delivery().demoOtpEnabled()) {
      return false;
    }
    String demo = appProperties.otp().demoCode();
    return demo != null && demo.matches("\\d{6}");
  }

  public static String resolveOtp(
      Environment environment,
      AppProperties appProperties,
      DeliveryOtpDerivationService derivationService,
      String orderId,
      String nonce) {
    if (useDemoDeliveryOtp(environment, appProperties)) {
      return appProperties.otp().demoCode();
    }
    return derivationService.deriveOtp(orderId, nonce);
  }
}
