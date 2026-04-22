package com.carnalysys.api;

public record ApiErrorEnvelope(boolean success, ApiErrorBody error, ApiMeta meta) {

  public static ApiErrorEnvelope of(String code, String message, Object details, ApiMeta meta) {
    return new ApiErrorEnvelope(false, new ApiErrorBody(code, message, details), meta);
  }
}
