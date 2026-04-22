package com.carnalysys.service;

import com.carnalysys.api.ApiException;
import com.carnalysys.config.CarnalysysStorageProperties;
import com.carnalysys.domain.UserEntity;
import com.carnalysys.domain.UserProfile;
import com.carnalysys.repo.UserProfileRepository;
import com.carnalysys.repo.UserRepository;
import jakarta.annotation.PostConstruct;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.UUID;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

@Service
public class UserAvatarService {

  public static final String PUBLIC_AVATAR_PREFIX = "/api/v1/public/avatars/";

  private static final long MAX_BYTES = 2 * 1024 * 1024;

  private final CarnalysysStorageProperties storageProperties;
  private final UserRepository userRepository;
  private final UserProfileRepository userProfileRepository;

  public UserAvatarService(
      CarnalysysStorageProperties storageProperties,
      UserRepository userRepository,
      UserProfileRepository userProfileRepository) {
    this.storageProperties = storageProperties;
    this.userRepository = userRepository;
    this.userProfileRepository = userProfileRepository;
  }

  @PostConstruct
  void ensureDir() throws IOException {
    Path dir = Path.of(storageProperties.avatarDirOrDefault());
    Files.createDirectories(dir);
  }

  public String publicAvatarUrl(UUID userId) {
    return PUBLIC_AVATAR_PREFIX + userId;
  }

  @Transactional(readOnly = true)
  public boolean hasAvatar(UUID userId) {
    UserProfile p = userProfileRepository.findById(userId).orElse(null);
    if (p == null) {
      return false;
    }
    String key = p.getAvatarStorageKey();
    if (key == null || key.isBlank()) {
      return false;
    }
    Path path = Path.of(storageProperties.avatarDirOrDefault(), key);
    return Files.isRegularFile(path);
  }

  @Transactional(readOnly = true)
  public byte[] readAvatarBytes(UUID userId) {
    UserProfile p =
        userProfileRepository
            .findById(userId)
            .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "NOT_FOUND", "No avatar"));
    String key = p.getAvatarStorageKey();
    if (key == null || key.isBlank()) {
      throw new ApiException(HttpStatus.NOT_FOUND, "NOT_FOUND", "No avatar");
    }
    Path path = Path.of(storageProperties.avatarDirOrDefault(), key);
    if (!Files.isRegularFile(path)) {
      throw new ApiException(HttpStatus.NOT_FOUND, "NOT_FOUND", "No avatar");
    }
    try {
      return Files.readAllBytes(path);
    } catch (IOException e) {
      throw new ApiException(HttpStatus.INTERNAL_SERVER_ERROR, "IO_ERROR", "Could not read avatar");
    }
  }

  @Transactional(readOnly = true)
  public MediaType mediaTypeFor(UUID userId) {
    UserProfile p = userProfileRepository.findById(userId).orElse(null);
    if (p == null || p.getAvatarStorageKey() == null) {
      return MediaType.APPLICATION_OCTET_STREAM;
    }
    String k = p.getAvatarStorageKey().toLowerCase();
    if (k.endsWith(".png")) return MediaType.IMAGE_PNG;
    if (k.endsWith(".webp")) return MediaType.valueOf("image/webp");
    return MediaType.IMAGE_JPEG;
  }

  @Transactional
  public String saveAvatar(UUID userId, MultipartFile file) {
    if (file == null || file.isEmpty()) {
      throw new ApiException(HttpStatus.BAD_REQUEST, "VALIDATION_ERROR", "Empty file");
    }
    if (file.getSize() > MAX_BYTES) {
      throw new ApiException(HttpStatus.BAD_REQUEST, "VALIDATION_ERROR", "Image too large (max 2MB)");
    }
    String ct = file.getContentType() != null ? file.getContentType().toLowerCase() : "";
    String ext;
    if (ct.contains("png")) {
      ext = ".png";
    } else if (ct.contains("webp")) {
      ext = ".webp";
    } else if (ct.contains("jpeg") || ct.contains("jpg")) {
      ext = ".jpg";
    } else {
      throw new ApiException(
          HttpStatus.BAD_REQUEST, "VALIDATION_ERROR", "Use JPEG, PNG, or WebP");
    }

    UserEntity u = userRepository.findById(userId).orElseThrow();
    UserProfile p =
        userProfileRepository.findById(userId).orElseGet(() -> defaultProfile(u));

    String key = userId + ext;
    Path dir = Path.of(storageProperties.avatarDirOrDefault());
    try {
      Files.createDirectories(dir);
      String oldKey = p.getAvatarStorageKey();
      Path target = dir.resolve(key);
      Files.write(target, file.getBytes());
      if (oldKey != null && !oldKey.isBlank() && !oldKey.equals(key)) {
        Path oldPath = dir.resolve(oldKey);
        Files.deleteIfExists(oldPath);
      }
      p.setAvatarStorageKey(key);
      p.setUpdatedAt(java.time.Instant.now());
      userProfileRepository.save(p);
    } catch (IOException e) {
      throw new ApiException(
          HttpStatus.INTERNAL_SERVER_ERROR, "IO_ERROR", "Could not store avatar");
    }
    return publicAvatarUrl(userId);
  }

  private UserProfile defaultProfile(UserEntity u) {
    UserProfile p = new UserProfile();
    p.setUser(u);
    p.setFullName(u.getDisplayName());
    p.setEmail(null);
    p.setPhone(u.getPhoneE164());
    userProfileRepository.save(p);
    return p;
  }
}
