package com.carnalysys.web.v1;

import static com.carnalysys.testsupport.SecurityTestUtils.asUser;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyInt;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.carnalysys.domain.Cart;
import com.carnalysys.domain.IdempotencyKeyEntity;
import com.carnalysys.service.CartService;
import com.carnalysys.service.IdempotencyService;
import com.carnalysys.testsupport.ControllerSliceTestBase;
import com.carnalysys.testsupport.JsonEnvelopeMatchers;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;

@WebMvcTest(controllers = CartV1Controller.class)
@AutoConfigureMockMvc(addFilters = true)
class CartV1ControllerWebMvcTest extends ControllerSliceTestBase {

  private static final UUID USER = UUID.fromString("22222222-2222-2222-2222-222222222222");
  private static final UUID CART_ID = UUID.fromString("33333333-3333-3333-3333-333333333333");
  private static final UUID LINE_ID = UUID.fromString("44444444-4444-4444-4444-444444444444");

  @Autowired private MockMvc mockMvc;

  @MockBean private CartService cartService;
  @MockBean private IdempotencyService idempotencyService;

  @Test
  void getCartEmptyGuest() throws Exception {
    when(cartService.resolveCart(eq(Optional.empty()), eq(Optional.empty()), eq(false)))
        .thenReturn(new CartService.CartSnapshot(null, null, false));
    when(cartService.getCartView(null))
        .thenReturn(Map.of("items", List.of(), "itemCount", 0, "subtotal", 0));
    mockMvc
        .perform(get("/api/v1/cart"))
        .andExpect(status().isOk())
        .andExpect(JsonEnvelopeMatchers.successTrue())
        .andExpect(jsonPath("$.data.itemCount").value(0));
  }

  @Test
  void getCartWithUser() throws Exception {
    Cart cart = mock(Cart.class);
    when(cart.getId()).thenReturn(CART_ID);
    when(cartService.resolveCart(eq(Optional.of(USER)), eq(Optional.empty()), eq(false)))
        .thenReturn(new CartService.CartSnapshot(cart, null, false));
    when(cartService.getCartView(cart))
        .thenReturn(Map.of("items", List.of(), "itemCount", 0, "subtotal", 0));
    mockMvc
        .perform(get("/api/v1/cart").with(asUser(USER)))
        .andExpect(status().isOk())
        .andExpect(JsonEnvelopeMatchers.successTrue());
  }

  @Test
  void addItemOk() throws Exception {
    when(idempotencyService.actorKey(eq(Optional.of(USER)), eq(Optional.empty())))
        .thenReturn("user:" + USER);
    when(idempotencyService.requestHash(eq("cart.add"), eq("user:" + USER), any()))
        .thenReturn("h1");
    when(idempotencyService.begin(eq("cart.add"), eq("user:" + USER), eq("k1"), eq("h1")))
        .thenReturn(new IdempotencyService.Access(new IdempotencyKeyEntity(), null));
    Map<String, Object> result = new HashMap<>();
    result.put("itemCount", 1);
    when(cartService.addItem(eq(Optional.of(USER)), eq(Optional.empty()), eq("p1"), eq(2)))
        .thenReturn(result);
    mockMvc
        .perform(
            post("/api/v1/cart")
                .with(asUser(USER))
                .header("Idempotency-Key", "k1")
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"productId\":\"p1\",\"quantity\":2}"))
        .andExpect(status().isOk())
        .andExpect(JsonEnvelopeMatchers.successTrue());
  }

  @Test
  void clearCart() throws Exception {
    mockMvc
        .perform(delete("/api/v1/cart").with(asUser(USER)))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.data.cleared").value(true));
  }

  @Test
  void updateLine() throws Exception {
    when(cartService.updateLine(
            eq(Optional.of(USER)), eq(Optional.empty()), eq(LINE_ID), eq(3)))
        .thenReturn(Map.of("ok", true));
    mockMvc
        .perform(
            put("/api/v1/cart/" + LINE_ID)
                .with(asUser(USER))
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"quantity\":3}"))
        .andExpect(status().isOk())
        .andExpect(JsonEnvelopeMatchers.successTrue());
  }

  @Test
  void removeLine() throws Exception {
    when(cartService.removeLine(eq(Optional.of(USER)), eq(Optional.empty()), eq(LINE_ID)))
        .thenReturn(Map.of("removed", true));
    mockMvc
        .perform(delete("/api/v1/cart/" + LINE_ID).with(asUser(USER)))
        .andExpect(status().isOk())
        .andExpect(JsonEnvelopeMatchers.successTrue());
  }
}
