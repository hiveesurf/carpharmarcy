package com.carnalysys.web.v1;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.carnalysys.testsupport.ControllerSliceTestBase;
import com.carnalysys.testsupport.JsonEnvelopeMatchers;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.test.web.servlet.MockMvc;

@WebMvcTest(controllers = HealthV1Controller.class)
@AutoConfigureMockMvc(addFilters = true)
class HealthV1ControllerWebMvcTest extends ControllerSliceTestBase {

  @Autowired private MockMvc mockMvc;

  @Test
  void healthReturnsEnvelope() throws Exception {
    mockMvc
        .perform(get("/api/v1/health"))
        .andExpect(status().isOk())
        .andExpect(JsonEnvelopeMatchers.successTrue())
        .andExpect(jsonPath("$.data.status").value("ok"))
        .andExpect(jsonPath("$.data.service").value("carnalysys-api"));
  }
}
