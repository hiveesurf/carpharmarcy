package com.carnalysys.web.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record AdminLoginRequest(
    @NotBlank(message = "email is required")
        @Email(message = "valid email required")
        @Size(max = 254)
        String email,
    @NotBlank(message = "password is required") @Size(max = 200) String password) {}
