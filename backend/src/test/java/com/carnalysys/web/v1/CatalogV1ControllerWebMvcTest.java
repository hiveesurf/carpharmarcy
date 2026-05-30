package com.carnalysys.web.v1;

import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.carnalysys.service.CatalogService;
import com.carnalysys.testsupport.ControllerSliceTestBase;
import com.carnalysys.testsupport.JsonEnvelopeMatchers;
import java.util.List;
import java.util.Map;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.test.web.servlet.MockMvc;

@WebMvcTest(controllers = CatalogV1Controller.class)
@AutoConfigureMockMvc(addFilters = true)
class CatalogV1ControllerWebMvcTest extends ControllerSliceTestBase {

  @Autowired private MockMvc mockMvc;

  @MockBean private CatalogService catalogService;

  @Test
  void productsDelegatesToService() throws Exception {
    when(catalogService.listProductsPage(
            eq("part"), eq(null), eq(null), eq(null), eq(null), eq(null), eq(null), eq(0), eq(24)))
        .thenReturn(
            Map.of(
                "items", List.of(),
                "page", 0,
                "pageSize", 24,
                "total", 0L,
                "totalPages", 0));
    mockMvc
        .perform(get("/api/v1/products").param("type", "part"))
        .andExpect(status().isOk())
        .andExpect(JsonEnvelopeMatchers.successTrue())
        .andExpect(jsonPath("$.data.items").isArray());
  }

  @Test
  void productByIdReturnsEnvelope() throws Exception {
    when(catalogService.getProduct("p1"))
        .thenReturn(Map.of("id", "p1", "name", "Test", "sku", "SKU1"));
    mockMvc
        .perform(get("/api/v1/products/p1"))
        .andExpect(status().isOk())
        .andExpect(JsonEnvelopeMatchers.successTrue())
        .andExpect(jsonPath("$.data.product.id").value("p1"));
  }

  @Test
  void categoriesReturnsItems() throws Exception {
    when(catalogService.listCategories()).thenReturn(List.of(Map.of("id", "x", "name", "Cat")));
    mockMvc
        .perform(get("/api/v1/categories"))
        .andExpect(status().isOk())
        .andExpect(JsonEnvelopeMatchers.successTrue())
        .andExpect(jsonPath("$.data.items[0].id").value("x"));
  }
}
