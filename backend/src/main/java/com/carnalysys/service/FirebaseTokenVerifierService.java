package com.carnalysys.service;

import com.carnalysys.api.ApiException;
import com.carnalysys.config.AppProperties;
import com.google.auth.oauth2.GoogleCredentials;
import com.google.firebase.FirebaseApp;
import com.google.firebase.FirebaseOptions;
import com.google.firebase.auth.FirebaseAuth;
import com.google.firebase.auth.FirebaseAuthException;
import com.google.firebase.auth.FirebaseToken;
import java.io.ByteArrayInputStream;
import java.io.IOException;
import java.io.InputStream;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.Map;
import jakarta.annotation.PostConstruct;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;

@Service
public class FirebaseTokenVerifierService {

  private static final String APP_NAME = "carnalysys-firebase-auth";
  private static final Logger log = LoggerFactory.getLogger(FirebaseTokenVerifierService.class);

  private final AppProperties appProperties;
  private final com.fasterxml.jackson.databind.ObjectMapper objectMapper;
  private volatile FirebaseApp firebaseApp;
  private volatile boolean firebaseEnabled;

  public FirebaseTokenVerifierService(
      AppProperties appProperties, com.fasterxml.jackson.databind.ObjectMapper objectMapper) {
    this.appProperties = appProperties;
    this.objectMapper = objectMapper;
  }

  @PostConstruct
  void initialize() {
    if (!isCredentialsConfigured()) {
      log.warn(
          "Firebase Admin credentials are not configured. Firebase token verification is disabled. "
              + "Set FIREBASE_SERVICE_ACCOUNT_PATH or FIREBASE_PROJECT_ID/FIREBASE_CLIENT_EMAIL/FIREBASE_PRIVATE_KEY "
              + "to enable /auth/firebase/exchange.");
      return;
    }
    try {
      firebaseApp = initFirebaseApp();
      firebaseEnabled = true;
      log.info("Firebase Auth initialized successfully (credentialMode={})", credentialMode());
    } catch (Exception ex) {
      log.warn(
          "Firebase Admin SDK initialization failed. Firebase token verification is disabled.",
          ex);
    }
  }

  public boolean isEnabled() {
    return firebaseEnabled;
  }

  public String verifyPhoneNumberFromIdToken(String idTokenRaw) {
    if (!firebaseEnabled) {
      throw new ApiException(
          HttpStatus.SERVICE_UNAVAILABLE,
          "FIREBASE_DISABLED",
          "Firebase authentication is not configured on this server.");
    }
    String idToken = idTokenRaw != null ? idTokenRaw.trim() : "";
    if (idToken.isEmpty()) {
      throw new ApiException(HttpStatus.BAD_REQUEST, "VALIDATION_ERROR", "idToken is required");
    }
    try {
      FirebaseToken token = FirebaseAuth.getInstance(requireFirebaseApp()).verifyIdToken(idToken);
      Object phoneClaim = token.getClaims().get("phone_number");
      String phone = phoneClaim != null ? String.valueOf(phoneClaim) : null;
      if (phone == null || phone.isBlank()) {
        throw new ApiException(
            HttpStatus.BAD_REQUEST, "VALIDATION_ERROR", "Firebase token has no phone number");
      }
      return phone.trim();
    } catch (FirebaseAuthException ex) {
      throw new ApiException(HttpStatus.UNAUTHORIZED, "AUTH_INVALID", "Invalid Firebase ID token");
    }
  }

  private FirebaseApp requireFirebaseApp() {
    FirebaseApp app = firebaseApp;
    if (app == null) {
      throw new ApiException(
          HttpStatus.SERVICE_UNAVAILABLE,
          "FIREBASE_DISABLED",
          "Firebase authentication is not configured on this server.");
    }
    return app;
  }

  private boolean isCredentialsConfigured() {
    String path = blankToNull(appProperties.firebase().serviceAccountPath());
    if (path != null) {
      return true;
    }
    String projectId = blankToNull(appProperties.firebase().projectId());
    String clientEmail = blankToNull(appProperties.firebase().clientEmail());
    String privateKey = blankToNull(appProperties.firebase().privateKey());
    return projectId != null && clientEmail != null && privateKey != null;
  }

  private FirebaseApp initFirebaseApp() throws IOException {
    FirebaseOptions.Builder builder = FirebaseOptions.builder().setCredentials(loadCredentials());
    String projectId = blankToNull(appProperties.firebase().projectId());
    if (projectId != null) {
      builder.setProjectId(projectId);
    }
    FirebaseOptions options = builder.build();
    try {
      return FirebaseApp.initializeApp(options, APP_NAME);
    } catch (IllegalStateException ex) {
      return FirebaseApp.getInstance(APP_NAME);
    }
  }

  private GoogleCredentials loadCredentials() throws IOException {
    String path = blankToNull(appProperties.firebase().serviceAccountPath());
    if (path != null) {
      Path file = Path.of(path);
      if (!Files.isRegularFile(file)) {
        throw new IOException("Firebase service account file not found: " + path);
      }
      try (InputStream in = Files.newInputStream(file)) {
        return GoogleCredentials.fromStream(in);
      }
    }

    String projectId = blankToNull(appProperties.firebase().projectId());
    String clientEmail = blankToNull(appProperties.firebase().clientEmail());
    String privateKey = blankToNull(appProperties.firebase().privateKey());
    if (projectId == null || clientEmail == null || privateKey == null) {
      throw new IOException(
          "Firebase Admin credentials are incomplete. Provide FIREBASE_SERVICE_ACCOUNT_PATH or "
              + "FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, and FIREBASE_PRIVATE_KEY.");
    }

    String normalizedPrivateKey = privateKey.replace("\\n", "\n");
    Map<String, Object> sa =
        Map.of(
            "type", "service_account",
            "project_id", projectId,
            "client_email", clientEmail,
            "private_key", normalizedPrivateKey,
            "token_uri", "https://oauth2.googleapis.com/token");
    byte[] raw = objectMapper.writeValueAsString(sa).getBytes(StandardCharsets.UTF_8);
    try (InputStream in = new ByteArrayInputStream(raw)) {
      return GoogleCredentials.fromStream(in);
    }
  }

  private static String blankToNull(String value) {
    if (value == null) return null;
    String trimmed = value.trim();
    return trimmed.isEmpty() ? null : trimmed;
  }

  private String credentialMode() {
    return blankToNull(appProperties.firebase().serviceAccountPath()) != null ? "file" : "env";
  }
}
