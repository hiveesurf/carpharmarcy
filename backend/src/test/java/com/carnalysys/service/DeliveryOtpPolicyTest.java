package com.carnalysys.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

import com.carnalysys.config.AppProperties;
import org.junit.jupiter.api.Test;
import org.springframework.core.env.Environment;
import org.springframework.mock.env.MockEnvironment;

class DeliveryOtpPolicyTest {

  private static AppProperties props(boolean demoDeliveryEnabled) {
    return new AppProperties(
        new AppProperties.Jwt("test-secret-for-delivery-otp", 900),
        new AppProperties.RefreshToken(604800),
        new AppProperties.Otp("123456", 20),
        new AppProperties.Delivery(900, 30, demoDeliveryEnabled),
        new AppProperties.Firebase(null, null, null, null),
        new AppProperties.Cors(""),
        new AppProperties.Payment("mockpay", null, null, null, 600, 300000, 30));
  }

  @Test
  void useDemoDeliveryOtp_onlyWhenLocalProfileAndFlagEnabled() {
    Environment local = env("local");
    Environment uat = env("uat");
    Environment prod = env("prod");

    assertThat(DeliveryOtpPolicy.useDemoDeliveryOtp(local, props(true))).isTrue();
    assertThat(DeliveryOtpPolicy.useDemoDeliveryOtp(local, props(false))).isFalse();
    assertThat(DeliveryOtpPolicy.useDemoDeliveryOtp(uat, props(true))).isFalse();
    assertThat(DeliveryOtpPolicy.useDemoDeliveryOtp(prod, props(false))).isFalse();
  }

  @Test
  void resolveOtp_localDemo_returnsDemoCode() {
    var derivation = new DeliveryOtpDerivationService(props(true));
    String otp =
        DeliveryOtpPolicy.resolveOtp(env("local"), props(true), derivation, "ord-1", "nonce-1");
    assertThat(otp).isEqualTo("123456");
  }

  @Test
  void resolveOtp_uat_returnsDerivedSixDigits() {
    var derivation = new DeliveryOtpDerivationService(props(false));
    String otp =
        DeliveryOtpPolicy.resolveOtp(env("uat"), props(false), derivation, "ord-1", "nonce-1");
    assertThat(otp).matches("\\d{6}").isNotEqualTo("123456");
  }

  @Test
  void resolveOtp_localWithoutDemoFlag_returnsDerived() {
    var derivation = new DeliveryOtpDerivationService(props(false));
    String otp =
        DeliveryOtpPolicy.resolveOtp(env("local"), props(false), derivation, "ord-1", "nonce-1");
    assertThat(otp).matches("\\d{6}");
    assertThat(otp).isEqualTo(derivation.deriveOtp("ord-1", "nonce-1"));
  }

  private static Environment env(String profile) {
    MockEnvironment e = new MockEnvironment();
    e.setActiveProfiles(profile);
    return e;
  }
}
