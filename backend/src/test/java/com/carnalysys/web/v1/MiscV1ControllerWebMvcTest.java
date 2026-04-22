package com.carnalysys.web.v1;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.carnalysys.api.GlobalExceptionHandler;
import com.carnalysys.testsupport.ControllerSliceTestBase;
import com.carnalysys.service.LeadsService;
import com.carnalysys.service.LegacyVehicleService;
import com.carnalysys.testsupport.JsonEnvelopeMatchers;
import java.util.List;
import java.util.Map;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.context.annotation.Import;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;

@WebMvcTest(controllers = MiscV1Controller.class)
@AutoConfigureMockMvc(addFilters = true)
@Import(GlobalExceptionHandler.class)
class MiscV1ControllerWebMvcTest extends ControllerSliceTestBase {

  @Autowired private MockMvc mockMvc;

  @MockBean private LegacyVehicleService legacyVehicleService;
  @MockBean private LeadsService leadsService;

  @Test
  void brandsOk() throws Exception {
    when(legacyVehicleService.brands()).thenReturn(List.of());
    mockMvc
        .perform(get("/api/v1/vehicle/brands"))
        .andExpect(status().isOk())
        .andExpect(JsonEnvelopeMatchers.successTrue());
  }

  @Test
  void modelsWithoutBrandIdReturns400() throws Exception {
    mockMvc
        .perform(get("/api/v1/vehicle/models"))
        .andExpect(status().isBadRequest())
        .andExpect(JsonEnvelopeMatchers.successFalse())
        .andExpect(JsonEnvelopeMatchers.errorCode("VALIDATION_ERROR"));
  }

  @Test
  void modelsWithBrandIdOk() throws Exception {
    when(legacyVehicleService.models("b1")).thenReturn(List.of());
    mockMvc
        .perform(get("/api/v1/vehicle/models").param("brandId", "b1"))
        .andExpect(status().isOk())
        .andExpect(JsonEnvelopeMatchers.successTrue());
  }

  @Test
  void searchVehicleOk() throws Exception {
    mockMvc
        .perform(
            post("/api/v1/search/vehicle")
                .contentType(MediaType.APPLICATION_JSON)
                .content("{}"))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.data.accepted").value(true));
  }

  @Test
  void searchPlateMissingPlateReturns400() throws Exception {
    mockMvc
        .perform(
            post("/api/v1/search/plate")
                .contentType(MediaType.APPLICATION_JSON)
                .content("{}"))
        .andExpect(status().isBadRequest())
        .andExpect(JsonEnvelopeMatchers.errorCode("VALIDATION_ERROR"));
  }

  @Test
  void sellerLeadDelegates() throws Exception {
    when(leadsService.sellerLead(any())).thenReturn(Map.of("ok", true));
    mockMvc
        .perform(
            post("/api/v1/leads/seller")
                .contentType(MediaType.APPLICATION_JSON)
                .content("{}"))
        .andExpect(status().isOk());
    verify(leadsService).sellerLead(any());
  }
}
