package com.carnalysys.web.dto;

import jakarta.validation.constraints.NotBlank;

public record FirebaseExchangeRequest(
    @NotBlank(message = "idToken is required") String idToken) {}
