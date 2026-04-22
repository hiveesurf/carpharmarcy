package com.carnalysys.web.v1;

import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.content;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.header;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.carnalysys.service.UserAvatarService;
import com.carnalysys.testsupport.ControllerSliceTestBase;
import java.util.UUID;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;

@WebMvcTest(controllers = PublicAvatarV1Controller.class)
@AutoConfigureMockMvc(addFilters = true)
class PublicAvatarV1ControllerWebMvcTest extends ControllerSliceTestBase {

  private static final UUID USER = UUID.fromString("aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa");

  @Autowired private MockMvc mockMvc;

  @MockBean private UserAvatarService userAvatarService;

  @Test
  void avatarReturnsBytesAndContentType() throws Exception {
    byte[] png = new byte[] {(byte) 0x89, 0x50};
    when(userAvatarService.readAvatarBytes(eq(USER))).thenReturn(png);
    when(userAvatarService.mediaTypeFor(eq(USER))).thenReturn(MediaType.IMAGE_PNG);
    mockMvc
        .perform(get("/api/v1/public/avatars/" + USER))
        .andExpect(status().isOk())
        .andExpect(header().string(HttpHeaders.CONTENT_TYPE, MediaType.IMAGE_PNG_VALUE))
        .andExpect(content().bytes(png));
  }
}
