package com.carnalysys.web.v1;

import com.carnalysys.api.ApiEnvelope;
import com.carnalysys.service.CatalogService;
import com.carnalysys.web.support.ApiResponses;
import jakarta.servlet.http.HttpServletRequest;
import java.util.Map;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1")
public class CatalogV1Controller {

  private final CatalogService catalogService;

  public CatalogV1Controller(CatalogService catalogService) {
    this.catalogService = catalogService;
  }

  @GetMapping("/products")
  public ApiEnvelope<Map<String, Object>> products(
      HttpServletRequest req,
      @RequestParam(required = false) String type,
      @RequestParam(required = false) String category,
      @RequestParam(required = false) String search,
      @RequestParam(required = false) String carModel,
      @RequestParam(required = false) String carId,
      @RequestParam(required = false) String sort,
      @RequestParam(defaultValue = "0") int page,
      @RequestParam(defaultValue = "24") int pageSize) {
    return ApiResponses.ok(
        req,
        catalogService.listProductsPage(type, category, search, carModel, carId, sort, page, pageSize));
  }

  @GetMapping("/products/{id}")
  public ApiEnvelope<Map<String, Object>> product(HttpServletRequest req, @PathVariable String id) {
    return ApiResponses.ok(req, Map.of("product", catalogService.getProduct(id)));
  }

  @GetMapping("/categories")
  public ApiEnvelope<Map<String, Object>> categories(HttpServletRequest req) {
    return ApiResponses.ok(req, Map.of("items", catalogService.listCategories()));
  }
}
