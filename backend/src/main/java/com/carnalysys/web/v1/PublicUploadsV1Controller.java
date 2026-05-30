package com.carnalysys.web.v1;

import com.carnalysys.service.UploadStorageService;
import org.springframework.http.CacheControl;
import org.springframework.http.HttpHeaders;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/public/uploads")
public class PublicUploadsV1Controller {

  private final UploadStorageService uploadStorageService;

  public PublicUploadsV1Controller(UploadStorageService uploadStorageService) {
    this.uploadStorageService = uploadStorageService;
  }

  @GetMapping("/vehicles/{partition}/{filename:.+}")
  public ResponseEntity<byte[]> vehicleAsset(
      @PathVariable String partition, @PathVariable String filename) {
    String relativePath = partition + "/" + filename;
    byte[] body = uploadStorageService.readVehicleAsset(relativePath);
    String mediaType = uploadStorageService.mediaTypeForPath(relativePath);
    return ResponseEntity.ok()
        .cacheControl(CacheControl.maxAge(java.time.Duration.ofHours(1)).cachePublic())
        .header(HttpHeaders.CONTENT_TYPE, mediaType)
        .body(body);
  }

}
