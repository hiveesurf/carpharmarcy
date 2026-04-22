package com.carnalysys.api;

import static org.hamcrest.Matchers.containsString;
import static org.hamcrest.Matchers.not;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.content;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.carnalysys.testsupport.ControllerSliceTestBase;
import com.carnalysys.testsupport.InternalErrorSmokeController;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.context.annotation.Import;
import org.springframework.test.web.servlet.MockMvc;

@WebMvcTest(controllers = InternalErrorSmokeController.class)
@AutoConfigureMockMvc(addFilters = true)
@Import(GlobalExceptionHandler.class)
class GlobalExceptionHandlerInternalErrorWebMvcTest extends ControllerSliceTestBase {

  @Autowired private MockMvc mockMvc;

  @Test
  void internalErrorBodyIsGenericAndDoesNotLeakExceptionDetails() throws Exception {
    mockMvc
        .perform(get("/__test/internal-error"))
        .andExpect(status().isInternalServerError())
        .andExpect(jsonPath("$.success").value(false))
        .andExpect(jsonPath("$.error.code").value("INTERNAL_ERROR"))
        .andExpect(jsonPath("$.error.message").value("Something went wrong"))
        .andExpect(content().string(not(containsString("ShouldNotAppear"))))
        .andExpect(content().string(not(containsString("\tat "))));
  }
}
