package com.carnalysys.web.v1;

import com.carnalysys.api.ApiEnvelope;
import com.carnalysys.service.AddressService;
import com.carnalysys.web.support.ApiResponses;
import com.carnalysys.web.support.AuthSupport;
import jakarta.servlet.http.HttpServletRequest;
import java.util.Map;
import java.util.UUID;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/addresses")
public class AddressV1Controller {

  private final AddressService addressService;

  public AddressV1Controller(AddressService addressService) {
    this.addressService = addressService;
  }

  @GetMapping
  public ApiEnvelope<Map<String, Object>> list(HttpServletRequest req) {
    return ApiResponses.ok(req, Map.of("items", addressService.list(AuthSupport.requireUser())));
  }

  @PostMapping
  public ApiEnvelope<Map<String, Object>> create(
      HttpServletRequest req, @RequestBody Map<String, Object> body) {
    return ApiResponses.ok(req, addressService.create(AuthSupport.requireUser(), body));
  }

  @PutMapping("/{id}")
  public ApiEnvelope<Map<String, Object>> update(
      HttpServletRequest req, @PathVariable String id, @RequestBody Map<String, Object> body) {
    return ApiResponses.ok(
        req, addressService.update(AuthSupport.requireUser(), UUID.fromString(id), body));
  }

  @DeleteMapping("/{id}")
  public ApiEnvelope<Map<String, Object>> delete(HttpServletRequest req, @PathVariable String id) {
    return ApiResponses.ok(
        req, addressService.delete(AuthSupport.requireUser(), UUID.fromString(id)));
  }
}
