package com.carnalysys.web.v1;

import com.carnalysys.api.ApiEnvelope;
import com.carnalysys.web.support.ApiResponses;
import jakarta.servlet.http.HttpServletRequest;
import java.util.Map;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1")
public class HealthV1Controller {

  @GetMapping("/health")
  public ApiEnvelope<Map<String, Object>> health(HttpServletRequest req) {
    return ApiResponses.ok(
        req,
        Map.of(
            "status", "ok",
            "service", "carnalysys-api",
            "version", "2.0.0"));
  }
}
