package com.carnalysys.api;

import java.time.Instant;
import java.util.Map;
import java.util.UUID;

public record ApiMeta(String requestId, String timestamp, Map<String, Object> extra) {

  public static ApiMeta of(String requestId) {
    return new ApiMeta(
        requestId != null ? requestId : UUID.randomUUID().toString(),
        Instant.now().toString(),
        Map.of());
  }

  public ApiMeta with(String key, Object value) {
    var m = new java.util.HashMap<String, Object>();
    if (extra != null) m.putAll(extra);
    m.put(key, value);
    return new ApiMeta(requestId, timestamp, Map.copyOf(m));
  }
}
