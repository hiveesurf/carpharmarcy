package com.carnalysys.web.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

/** JSON: { "phone": "9876543210" } — non-digits stripped in controller. */
public record SendOtpRequest(
    @NotBlank(message = "phone is required") @Size(max = 32) String phone) {

  public String digitsOnly() {
    return phone != null ? phone.replaceAll("\\D", "") : "";
  }
}
