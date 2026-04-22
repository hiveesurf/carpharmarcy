package com.carnalysys.web.v1;

import static com.carnalysys.testsupport.SecurityTestUtils.asUser;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.carnalysys.api.GlobalExceptionHandler;
import com.carnalysys.service.WishlistService;
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

@WebMvcTest(controllers = WishlistV1Controller.class)
@AutoConfigureMockMvc(addFilters = true)
@Import(GlobalExceptionHandler.class)
class WishlistV1ControllerWebMvcTest extends ControllerSliceTestBase {

  private static final UUID USER = UUID.fromString("99999999-9999-9999-9999-999999999999");

  @Autowired private MockMvc mockMvc;

  @MockBean private WishlistService wishlistService;

  @Test
  void listRequiresUser() throws Exception {
    mockMvc.perform(get("/api/v1/wishlist")).andExpect(status().isUnauthorized());
  }

  @Test
  void listOk() throws Exception {
    when(wishlistService.list(USER)).thenReturn(List.of());
    mockMvc
        .perform(get("/api/v1/wishlist").with(asUser(USER)))
        .andExpect(status().isOk())
        .andExpect(JsonEnvelopeMatchers.successTrue())
        .andExpect(jsonPath("$.data.items").isArray());
  }

  @Test
  void toggleOk() throws Exception {
    when(wishlistService.toggle(eq(USER), eq("p1")))
        .thenReturn(Map.of("inWishlist", true, "productId", "p1"));
    mockMvc
        .perform(
            post("/api/v1/wishlist/toggle")
                .with(asUser(USER))
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"productId\":\"p1\"}"))
        .andExpect(status().isOk())
        .andExpect(JsonEnvelopeMatchers.successTrue())
        .andExpect(jsonPath("$.data.inWishlist").value(true));
  }
}
