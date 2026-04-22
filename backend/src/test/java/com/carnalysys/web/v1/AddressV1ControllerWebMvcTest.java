package com.carnalysys.web.v1;

import static com.carnalysys.testsupport.SecurityTestUtils.asUser;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.carnalysys.api.GlobalExceptionHandler;
import com.carnalysys.service.AddressService;
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

@WebMvcTest(controllers = AddressV1Controller.class)
@AutoConfigureMockMvc(addFilters = true)
@Import(GlobalExceptionHandler.class)
class AddressV1ControllerWebMvcTest extends ControllerSliceTestBase {

  private static final UUID USER = UUID.fromString("66666666-6666-6666-6666-666666666666");
  private static final UUID ADDR = UUID.fromString("77777777-7777-7777-7777-777777777777");

  @Autowired private MockMvc mockMvc;

  @MockBean private AddressService addressService;

  @Test
  void listRequiresUser() throws Exception {
    mockMvc.perform(get("/api/v1/addresses")).andExpect(status().isUnauthorized());
  }

  @Test
  void listOk() throws Exception {
    when(addressService.list(USER)).thenReturn(List.of());
    mockMvc
        .perform(get("/api/v1/addresses").with(asUser(USER)))
        .andExpect(status().isOk())
        .andExpect(JsonEnvelopeMatchers.successTrue());
  }

  @Test
  void createOk() throws Exception {
    when(addressService.create(any(), any())).thenReturn(Map.of("id", ADDR.toString()));
    mockMvc
        .perform(
            post("/api/v1/addresses")
                .with(asUser(USER))
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"line1\":\"1 Main\",\"city\":\"X\",\"pincode\":\"123456\"}"))
        .andExpect(status().isOk())
        .andExpect(JsonEnvelopeMatchers.successTrue());
  }

  @Test
  void updateOk() throws Exception {
    when(addressService.update(eq(USER), eq(ADDR), any())).thenReturn(Map.of("id", ADDR.toString()));
    mockMvc
        .perform(
            put("/api/v1/addresses/" + ADDR)
                .with(asUser(USER))
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"line1\":\"2 Main\"}"))
        .andExpect(status().isOk())
        .andExpect(JsonEnvelopeMatchers.successTrue());
  }

  @Test
  void deleteOk() throws Exception {
    when(addressService.delete(USER, ADDR)).thenReturn(Map.of("removed", ADDR.toString()));
    mockMvc
        .perform(delete("/api/v1/addresses/" + ADDR).with(asUser(USER)))
        .andExpect(status().isOk())
        .andExpect(JsonEnvelopeMatchers.successTrue());
  }
}
