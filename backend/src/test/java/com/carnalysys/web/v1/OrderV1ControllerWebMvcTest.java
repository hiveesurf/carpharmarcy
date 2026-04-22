package com.carnalysys.web.v1;

import static com.carnalysys.testsupport.SecurityTestUtils.asUser;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.ArgumentMatchers.isNull;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.anyInt;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.carnalysys.api.GlobalExceptionHandler;
import com.carnalysys.domain.IdempotencyKeyEntity;
import com.carnalysys.service.IdempotencyService;
import com.carnalysys.service.OrderService;
import com.carnalysys.testsupport.ControllerSliceTestBase;
import com.carnalysys.testsupport.JsonEnvelopeMatchers;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.context.annotation.Import;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;

@WebMvcTest(controllers = OrderV1Controller.class)
@AutoConfigureMockMvc(addFilters = true)
@Import(GlobalExceptionHandler.class)
class OrderV1ControllerWebMvcTest extends ControllerSliceTestBase {

  private static final UUID USER = UUID.fromString("55555555-5555-5555-5555-555555555555");

  @Autowired private MockMvc mockMvc;

  @MockBean private OrderService orderService;
  @MockBean private IdempotencyService idempotencyService;

  @Test
  void placeOrderRequiresAuth() throws Exception {
    when(idempotencyService.actorKey(eq(java.util.Optional.empty()), eq(java.util.Optional.empty())))
        .thenReturn("anonymous");
    mockMvc
        .perform(
            post("/api/v1/orders")
                .contentType(MediaType.APPLICATION_JSON)
                .header("Idempotency-Key", "k1")
                .content("{}"))
        .andExpect(status().isUnauthorized());
  }

  @Test
  void placeOrderOk() throws Exception {
    when(idempotencyService.actorKey(eq(java.util.Optional.of(USER)), eq(java.util.Optional.empty())))
        .thenReturn("user:" + USER);
    when(idempotencyService.requestHash(anyString(), anyString(), org.mockito.ArgumentMatchers.any()))
        .thenReturn("h1");
    var idem = new IdempotencyKeyEntity();
    when(idempotencyService.begin(eq("orders.place"), eq("user:" + USER), eq("k1"), eq("h1")))
        .thenReturn(new IdempotencyService.Access(idem, null));
    when(orderService.placeOrder(eq(USER), isNull(), isNull(), isNull(), isNull()))
        .thenReturn(Map.of("order", Map.of("id", "ord_x", "total", 100)));
    mockMvc
        .perform(
            post("/api/v1/orders")
                .with(asUser(USER))
                .header("Idempotency-Key", "k1")
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"addressId\":null}"))
        .andExpect(status().isOk())
        .andExpect(JsonEnvelopeMatchers.successTrue())
        .andExpect(jsonPath("$.data.order.id").value("ord_x"));
  }

  @Test
  void listOrdersOk() throws Exception {
    when(orderService.listMinePage(eq(USER), anyInt(), anyInt()))
        .thenReturn(Map.of("items", List.of(), "page", 0, "size", 3, "hasMore", false, "nextPage", 0));
    mockMvc
        .perform(get("/api/v1/orders").with(asUser(USER)))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.data.items").isArray())
        .andExpect(jsonPath("$.data.hasMore").value(false))
        .andExpect(jsonPath("$.data.size").value(3));
  }

  @Test
  void getOrderOk() throws Exception {
    when(orderService.getMine(USER, "ord_1"))
        .thenReturn(Map.of("order", Map.of("id", "ord_1")));
    mockMvc
        .perform(get("/api/v1/orders/ord_1").with(asUser(USER)))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.data.order.id").value("ord_1"));
  }
}
