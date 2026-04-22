package com.carnalysys.testsupport;

import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;

import org.springframework.test.web.servlet.ResultMatcher;

public final class JsonEnvelopeMatchers {

  private JsonEnvelopeMatchers() {}

  public static ResultMatcher successTrue() {
    return jsonPath("$.success").value(true);
  }

  public static ResultMatcher successFalse() {
    return jsonPath("$.success").value(false);
  }

  public static ResultMatcher errorCode(String code) {
    return jsonPath("$.error.code").value(code);
  }
}
