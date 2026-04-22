package com.carnalysys.web.v1;

import com.carnalysys.api.ApiEnvelope;
import com.carnalysys.service.UserAvatarService;
import com.carnalysys.service.UserProfileService;
import com.carnalysys.web.support.ApiResponses;
import com.carnalysys.web.support.AuthSupport;
import jakarta.servlet.http.HttpServletRequest;
import java.util.Map;
import org.springframework.http.MediaType;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

@RestController
@RequestMapping("/api/v1/user")
public class UserV1Controller {

  private final UserProfileService userProfileService;
  private final UserAvatarService userAvatarService;

  public UserV1Controller(
      UserProfileService userProfileService, UserAvatarService userAvatarService) {
    this.userProfileService = userProfileService;
    this.userAvatarService = userAvatarService;
  }

  @GetMapping("/profile")
  public ApiEnvelope<Map<String, Object>> getProfile(HttpServletRequest req) {
    return ApiResponses.ok(req, userProfileService.getProfile(AuthSupport.requireUser()));
  }

  @PutMapping("/profile")
  public ApiEnvelope<Map<String, Object>> putProfile(
      HttpServletRequest req, @RequestBody Map<String, Object> body) {
    return ApiResponses.ok(req, userProfileService.updateProfile(AuthSupport.requireUser(), body));
  }

  @PostMapping(value = "/avatar", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
  public ApiEnvelope<Map<String, Object>> postAvatar(
      HttpServletRequest req, @RequestParam("file") MultipartFile file) {
    var uid = AuthSupport.requireUser();
    String url = userAvatarService.saveAvatar(uid, file);
    return ApiResponses.ok(req, Map.of("avatarUrl", url));
  }
}
