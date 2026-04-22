package com.carnalysys.web.v1;

import com.carnalysys.api.ApiEnvelope;
import com.carnalysys.api.ApiException;
import com.carnalysys.service.LeadsService;
import com.carnalysys.service.LegacyVehicleService;
import com.carnalysys.web.support.ApiResponses;
import jakarta.servlet.http.HttpServletRequest;
import java.util.LinkedHashMap;
import java.util.Map;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1")
public class MiscV1Controller {

  private final LegacyVehicleService legacyVehicleService;
  private final LeadsService leadsService;

  public MiscV1Controller(LegacyVehicleService legacyVehicleService, LeadsService leadsService) {
    this.legacyVehicleService = legacyVehicleService;
    this.leadsService = leadsService;
  }

  @GetMapping("/vehicle/brands")
  public ApiEnvelope<Map<String, Object>> brands(HttpServletRequest req) {
    return ApiResponses.ok(req, Map.of("items", legacyVehicleService.brands()));
  }

  @GetMapping("/cars")
  public ApiEnvelope<Map<String, Object>> cars(HttpServletRequest req) {
    return ApiResponses.ok(req, Map.of("items", legacyVehicleService.cars()));
  }

  @GetMapping("/vehicle/models")
  public ApiEnvelope<Map<String, Object>> models(
      HttpServletRequest req, @RequestParam(required = false) String brandId) {
    if (brandId == null || brandId.isBlank()) {
      throw new ApiException(HttpStatus.BAD_REQUEST, "VALIDATION_ERROR", "brandId required");
    }
    return ApiResponses.ok(req, Map.of("items", legacyVehicleService.models(brandId)));
  }

  @GetMapping("/vehicle/years")
  public ApiEnvelope<Map<String, Object>> years(HttpServletRequest req) {
    return ApiResponses.ok(req, Map.of("items", legacyVehicleService.years()));
  }

  @GetMapping("/vehicle/variants")
  public ApiEnvelope<Map<String, Object>> variants(HttpServletRequest req) {
    return ApiResponses.ok(req, Map.of("items", legacyVehicleService.variants()));
  }

  @PostMapping("/search/vehicle")
  public ApiEnvelope<Map<String, Object>> searchVehicle(
      HttpServletRequest req, @RequestBody(required = false) Map<String, Object> body) {
    Map<String, Object> data = new LinkedHashMap<>();
    data.put("accepted", true);
    data.put("filters", body != null ? body : Map.of());
    data.put("nextPath", "/catalog");
    return ApiResponses.ok(req, data);
  }

  @PostMapping("/search/plate")
  public ApiEnvelope<Map<String, Object>> searchPlate(
      HttpServletRequest req, @RequestBody Map<String, Object> body) {
    Object plate = body != null ? body.get("plate") : null;
    if (plate == null || String.valueOf(plate).isBlank()) {
      throw new ApiException(HttpStatus.BAD_REQUEST, "VALIDATION_ERROR", "plate required");
    }
    Map<String, Object> data = new LinkedHashMap<>();
    data.put("accepted", true);
    data.put("normalizedPlate", String.valueOf(plate).toUpperCase());
    data.put("nextPath", "/catalog");
    return ApiResponses.ok(req, data);
  }

  @PostMapping("/leads/seller")
  public ApiEnvelope<Map<String, Object>> sellerLead(
      HttpServletRequest req, @RequestBody(required = false) Map<String, Object> body) {
    return ApiResponses.ok(req, leadsService.sellerLead(body));
  }

  @PostMapping("/compat/vehicle-enquiry/{carId}")
  public ApiEnvelope<Map<String, Object>> vehicleEnquiry(
      HttpServletRequest req,
      @PathVariable String carId,
      @RequestBody(required = false) Map<String, Object> body) {
    return ApiResponses.ok(req, leadsService.vehicleEnquiry(carId, body));
  }
}
