package com.carnalysys.web.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record VerifyOtpRequest(
    @NotBlank(message = "phone is required") @Size(max = 32) String phone,
    @NotBlank(message = "otp is required") @Size(min = 4, max = 12) String otp) {

  public String phoneDigits() {
    return phone != null ? phone.replaceAll("\\D", "") : "";
  }
}
