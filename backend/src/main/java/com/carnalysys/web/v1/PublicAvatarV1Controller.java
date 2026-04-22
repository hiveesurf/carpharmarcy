package com.carnalysys.web.v1;

import com.carnalysys.service.UserAvatarService;
import java.util.UUID;
import org.springframework.http.CacheControl;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/public")
public class PublicAvatarV1Controller {

  private final UserAvatarService userAvatarService;

  public PublicAvatarV1Controller(UserAvatarService userAvatarService) {
    this.userAvatarService = userAvatarService;
  }

  @GetMapping("/avatars/{userId}")
  public ResponseEntity<byte[]> avatar(@PathVariable String userId) {
    UUID id = UUID.fromString(userId);
    byte[] body = userAvatarService.readAvatarBytes(id);
    MediaType ct = userAvatarService.mediaTypeFor(id);
    return ResponseEntity.ok()
        .cacheControl(CacheControl.maxAge(java.time.Duration.ofHours(1)).cachePublic())
        .header(HttpHeaders.CONTENT_TYPE, ct.toString())
        .body(body);
  }
}
