package com.carnalysys.api;

import com.fasterxml.jackson.annotation.JsonInclude;

@JsonInclude(JsonInclude.Include.NON_NULL)
public record ApiEnvelope<T>(boolean success, T data, ApiMeta meta) {

  public static <T> ApiEnvelope<T> ok(T data, ApiMeta meta) {
    return new ApiEnvelope<>(true, data, meta);
  }
}
