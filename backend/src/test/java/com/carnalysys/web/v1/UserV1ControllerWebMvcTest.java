package com.carnalysys.web.v1;

import static com.carnalysys.testsupport.SecurityTestUtils.asUser;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.multipart;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.carnalysys.api.GlobalExceptionHandler;
import com.carnalysys.service.UserAvatarService;
import com.carnalysys.service.UserProfileService;
import com.carnalysys.testsupport.ControllerSliceTestBase;
import com.carnalysys.testsupport.JsonEnvelopeMatchers;
import java.util.Map;
import java.util.UUID;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.context.annotation.Import;
import org.springframework.http.MediaType;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.test.web.servlet.MockMvc;

@WebMvcTest(controllers = UserV1Controller.class)
@AutoConfigureMockMvc(addFilters = true)
@Import(GlobalExceptionHandler.class)
class UserV1ControllerWebMvcTest extends ControllerSliceTestBase {

  private static final UUID USER = UUID.fromString("88888888-8888-8888-8888-888888888888");

  @Autowired private MockMvc mockMvc;

  @MockBean private UserProfileService userProfileService;

  @MockBean private UserAvatarService userAvatarService;

  @Test
  void profileRequiresUser() throws Exception {
    mockMvc.perform(get("/api/v1/user/profile")).andExpect(status().isUnauthorized());
  }

  @Test
  void getProfileOk() throws Exception {
    when(userProfileService.getProfile(USER)).thenReturn(Map.of("phone", "+100"));
    mockMvc
        .perform(get("/api/v1/user/profile").with(asUser(USER)))
        .andExpect(status().isOk())
        .andExpect(JsonEnvelopeMatchers.successTrue())
        .andExpect(jsonPath("$.data.phone").value("+100"));
  }

  @Test
  void putProfileOk() throws Exception {
    when(userProfileService.updateProfile(eq(USER), any()))
        .thenReturn(Map.of("displayName", "A"));
    mockMvc
        .perform(
            put("/api/v1/user/profile")
                .with(asUser(USER))
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"displayName\":\"A\"}"))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.data.displayName").value("A"));
  }

  @Test
  void postAvatarOk() throws Exception {
    when(userAvatarService.saveAvatar(eq(USER), any()))
        .thenReturn("/api/v1/public/avatars/" + USER);
    var file =
        new MockMultipartFile("file", "a.png", "image/png", new byte[] {1, 2, 3});
    mockMvc
        .perform(multipart("/api/v1/user/avatar").file(file).with(asUser(USER)))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.data.avatarUrl").exists());
  }
}
