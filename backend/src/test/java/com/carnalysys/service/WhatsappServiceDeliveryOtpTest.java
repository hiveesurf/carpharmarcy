package com.carnalysys.service;

import static org.assertj.core.api.Assertions.assertThat;

import org.junit.jupiter.api.Test;

class WhatsappServiceDeliveryOtpTest {

  @Test
  void deliveryOtpMessage_matchesProductCopy() {
    String msg = WhatsappService.deliveryOtpMessage("ord_abc", "482901");
    assertThat(msg)
        .isEqualTo(
            "Your Carpharmarcy delivery OTP for order ord_abc is 482901. Share it only with the delivery partner when receiving your order.");
  }
}
