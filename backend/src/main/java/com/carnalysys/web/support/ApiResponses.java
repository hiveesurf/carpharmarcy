package com.carnalysys.web.support;

import com.carnalysys.api.ApiEnvelope;
import com.carnalysys.api.ApiMeta;
import com.carnalysys.api.RequestIdFilter;
import jakarta.servlet.http.HttpServletRequest;

public final class ApiResponses {

  private ApiResponses() {}

  public static <T> ApiEnvelope<T> ok(HttpServletRequest req, T data) {
    String rid = (String) req.getAttribute(RequestIdFilter.ATTR);
    return ApiEnvelope.ok(data, ApiMeta.of(rid));
  }
}
