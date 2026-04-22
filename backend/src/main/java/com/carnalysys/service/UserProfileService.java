package com.carnalysys.service;

import com.carnalysys.domain.UserEntity;
import com.carnalysys.domain.UserProfile;
import com.carnalysys.repo.UserProfileRepository;
import com.carnalysys.repo.UserRepository;
import java.util.LinkedHashMap;
import java.util.Map;
import java.util.UUID;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class UserProfileService {

  private final UserRepository userRepository;
  private final UserProfileRepository userProfileRepository;
  private final UserAvatarService userAvatarService;

  public UserProfileService(
      UserRepository userRepository,
      UserProfileRepository userProfileRepository,
      UserAvatarService userAvatarService) {
    this.userRepository = userRepository;
    this.userProfileRepository = userProfileRepository;
    this.userAvatarService = userAvatarService;
  }

  @Transactional(readOnly = true)
  public Map<String, Object> getProfile(UUID userId) {
    UserEntity u = userRepository.findById(userId).orElseThrow();
    UserProfile p =
        userProfileRepository.findById(userId).orElseGet(() -> defaultProfile(u));
    String primary = u.getPhoneE164();
    Map<String, Object> userMap = new LinkedHashMap<>();
    userMap.put("id", u.getId().toString());
    userMap.put("phone", primary);
    userMap.put("name", u.getDisplayName());
    Map<String, Object> prof = profileMap(u, p, primary);
    return Map.of("user", userMap, "profile", prof);
  }

  @Transactional
  public Map<String, Object> updateProfile(UUID userId, Map<String, Object> body) {
    UserEntity u = userRepository.findById(userId).orElseThrow();
    UserProfile p = userProfileRepository.findById(userId).orElseGet(() -> defaultProfile(u));
    if (body.containsKey("name")) {
      String n = String.valueOf(body.get("name"));
      p.setFullName(n);
      u.setDisplayName(n);
    }
    if (body.containsKey("email")) {
      String raw = String.valueOf(body.get("email"));
      p.setEmail(raw == null || raw.isBlank() ? null : raw);
    }
    if (body.containsKey("secondaryPhone")) {
      Object sp = body.get("secondaryPhone");
      p.setSecondaryPhone(sp == null || String.valueOf(sp).isBlank() ? null : String.valueOf(sp));
    }
    p.setPhone(u.getPhoneE164());
    userRepository.save(u);
    p.setUpdatedAt(java.time.Instant.now());
    userProfileRepository.save(p);
    return Map.of("profile", profileMap(u, p, u.getPhoneE164()));
  }

  private Map<String, Object> profileMap(UserEntity u, UserProfile p, String primaryPhone) {
    Map<String, Object> prof = new LinkedHashMap<>();
    prof.put("name", p.getFullName() != null ? p.getFullName() : u.getDisplayName());
    prof.put("email", p.getEmail() != null ? p.getEmail() : "");
    prof.put("primaryPhone", primaryPhone);
    prof.put(
        "secondaryPhone",
        p.getSecondaryPhone() != null && !p.getSecondaryPhone().isBlank()
            ? p.getSecondaryPhone()
            : "");
    prof.put("phone", primaryPhone);
    String key = p.getAvatarStorageKey();
    if (key != null && !key.isBlank() && userAvatarService.hasAvatar(u.getId())) {
      prof.put("avatarUrl", userAvatarService.publicAvatarUrl(u.getId()));
    } else {
      prof.put("avatarUrl", "");
    }
    return prof;
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
