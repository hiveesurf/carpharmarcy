package com.carnalysys.service;

import com.carnalysys.api.ApiException;
import com.carnalysys.config.CarnalysysStorageProperties;
import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardOpenOption;
import java.util.Base64;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.regex.Matcher;
import java.util.regex.Pattern;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;

@Service
public class UploadStorageService {
  public static final String PUBLIC_VEHICLES_PREFIX = "/api/v1/public/uploads/vehicles/";
  private static final Pattern DATA_URL_PATTERN =
      Pattern.compile("^data:(?<mime>[a-zA-Z0-9./+-]+);base64,(?<payload>.+)$", Pattern.DOTALL);

  private static final Map<String, String> MIME_EXT =
      Map.of(
          "image/jpeg", ".jpg",
          "image/jpg", ".jpg",
          "image/png", ".png",
          "image/webp", ".webp",
          "application/pdf", ".pdf");

  private final CarnalysysStorageProperties storageProperties;

  public UploadStorageService(CarnalysysStorageProperties storageProperties) {
    this.storageProperties = storageProperties;
  }

  public String persistVehicleImageIfDataUrl(String productId, String rawValue) {
    return persistIfDataUrl(storageProperties.vehiclesDirOrDefault(), productId, rawValue, "veh");
  }

  public String persistReceiptIfDataUrl(UUID customerId, String rawValue) {
    return persistIfDataUrl(
        storageProperties.receiptsDirOrDefault(), customerId.toString(), rawValue, "rcpt");
  }

  private String persistIfDataUrl(String baseDir, String partitionKey, String rawValue, String prefix) {
    if (rawValue == null || rawValue.isBlank()) {
      return rawValue;
    }
    String trimmed = rawValue.trim();
    if (!trimmed.startsWith("data:")) {
      return trimmed;
    }
    Matcher matcher = DATA_URL_PATTERN.matcher(trimmed);
    if (!matcher.matches()) {
      throw new ApiException(HttpStatus.BAD_REQUEST, "VALIDATION_ERROR", "Invalid data URL");
    }
    String mime = matcher.group("mime").toLowerCase();
    String ext = MIME_EXT.get(mime);
    if (ext == null) {
      throw new ApiException(
          HttpStatus.BAD_REQUEST, "VALIDATION_ERROR", "Unsupported uploaded file type");
    }

    byte[] bytes;
    try {
      bytes = Base64.getDecoder().decode(matcher.group("payload").getBytes(StandardCharsets.UTF_8));
    } catch (IllegalArgumentException ex) {
      throw new ApiException(HttpStatus.BAD_REQUEST, "VALIDATION_ERROR", "Invalid base64 payload");
    }
    if (bytes.length == 0) {
      throw new ApiException(HttpStatus.BAD_REQUEST, "VALIDATION_ERROR", "Empty upload payload");
    }

    String filename = prefix + "_" + UUID.randomUUID() + ext;
    Path target = Path.of(baseDir, partitionKey, filename);
    try {
      Files.createDirectories(target.getParent());
      Files.write(
          target,
          bytes,
          StandardOpenOption.CREATE,
          StandardOpenOption.TRUNCATE_EXISTING,
          StandardOpenOption.WRITE);
    } catch (IOException ex) {
      throw new ApiException(
          HttpStatus.INTERNAL_SERVER_ERROR, "IO_ERROR", "Could not persist uploaded file");
    }
    return toPublicVehiclesUrl(partitionKey, filename);
  }

  public List<Object> persistGalleryIfDataUrls(String productId, List<Object> rawGallery) {
    if (rawGallery == null || rawGallery.isEmpty()) {
      return List.of();
    }
    return rawGallery.stream()
        .map(item -> persistGalleryItem(productId, item))
        .toList();
  }

  public String resolvePublicVehicleUrl(String rawValue) {
    if (rawValue == null || rawValue.isBlank()) return rawValue;
    String trimmed = rawValue.trim();
    if (trimmed.startsWith(PUBLIC_VEHICLES_PREFIX) || trimmed.startsWith("http://") || trimmed.startsWith("https://")) {
      return trimmed;
    }
    String marker = "/uploads/vehicles/";
    int idx = trimmed.indexOf(marker);
    if (idx < 0) {
      return trimmed;
    }
    String suffix = trimmed.substring(idx + marker.length());
    suffix = suffix.replace('\\', '/');
    while (suffix.startsWith("/")) suffix = suffix.substring(1);
    return PUBLIC_VEHICLES_PREFIX + suffix;
  }

  public byte[] readVehicleAsset(String relativePath) {
    if (relativePath == null || relativePath.isBlank()) {
      throw new ApiException(HttpStatus.BAD_REQUEST, "VALIDATION_ERROR", "Asset path is required");
    }
    Path base = Paths.get(storageProperties.vehiclesDirOrDefault()).toAbsolutePath().normalize();
    Path target = base.resolve(relativePath).normalize();
    if (!target.startsWith(base)) {
      throw new ApiException(HttpStatus.BAD_REQUEST, "VALIDATION_ERROR", "Invalid asset path");
    }
    try {
      if (!Files.exists(target) || !Files.isRegularFile(target)) {
        throw new ApiException(HttpStatus.NOT_FOUND, "NOT_FOUND", "Asset not found");
      }
      return Files.readAllBytes(target);
    } catch (IOException ex) {
      throw new ApiException(HttpStatus.INTERNAL_SERVER_ERROR, "IO_ERROR", "Could not read asset");
    }
  }

  public String mediaTypeForPath(String relativePath) {
    if (relativePath == null) return "application/octet-stream";
    String lower = relativePath.toLowerCase();
    if (lower.endsWith(".png")) return "image/png";
    if (lower.endsWith(".jpg") || lower.endsWith(".jpeg")) return "image/jpeg";
    if (lower.endsWith(".webp")) return "image/webp";
    if (lower.endsWith(".pdf")) return "application/pdf";
    return "application/octet-stream";
  }

  private String toPublicVehiclesUrl(String partitionKey, String filename) {
    String safePartition = partitionKey == null ? "" : partitionKey.trim().replace('\\', '/');
    while (safePartition.startsWith("/")) safePartition = safePartition.substring(1);
    while (safePartition.endsWith("/")) safePartition = safePartition.substring(0, safePartition.length() - 1);
    if (safePartition.isBlank()) return PUBLIC_VEHICLES_PREFIX + filename;
    return PUBLIC_VEHICLES_PREFIX + safePartition + "/" + filename;
  }

  @SuppressWarnings("unchecked")
  private Object persistGalleryItem(String productId, Object item) {
    if (item instanceof Map<?, ?> map) {
      Object src = map.get("src");
      if (src == null) {
        return item;
      }
      String persisted = persistVehicleImageIfDataUrl(productId, String.valueOf(src));
      Map<String, Object> copy = new LinkedHashMap<>((Map<String, Object>) map);
      copy.put("src", persisted);
      return copy;
    }
    if (item instanceof String s) {
      return persistVehicleImageIfDataUrl(productId, s);
    }
    return item;
  }
}
