package com.carnalysys.service;

import com.carnalysys.api.ApiException;
import com.carnalysys.domain.IdempotencyKeyEntity;
import com.carnalysys.repo.IdempotencyKeyRepository;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.HexFormat;
import java.util.LinkedHashMap;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class IdempotencyService {

  public record Access(IdempotencyKeyEntity entity, Map<String, Object> replayData) {}

  private final IdempotencyKeyRepository repository;
  private final ObjectMapper objectMapper;

  public IdempotencyService(IdempotencyKeyRepository repository, ObjectMapper objectMapper) {
    this.repository = repository;
    this.objectMapper = objectMapper;
  }

  public String actorKey(Optional<UUID> userId, Optional<UUID> guestId) {
    if (userId.isPresent()) return "user:" + userId.get();
    if (guestId.isPresent()) return "guest:" + guestId.get();
    return "anonymous";
  }

  public String requestHash(String scope, String actorKey, Object body) {
    String bodyJson = canonicalJson(body);
    return sha256(scope + "|" + actorKey + "|" + bodyJson);
  }

  @Transactional
  public Access begin(String scope, String actorKey, String key, String reqHash) {
    String trimmed =
        (key == null || key.isBlank())
            ? "auto-" + UUID.randomUUID().toString().replace("-", "")
            : key.trim();
    var existing = repository.findByScopeAndActorKeyAndIdempotencyKey(scope, actorKey, trimmed);
    if (existing.isPresent()) {
      IdempotencyKeyEntity found = existing.get();
      if (!reqHash.equals(found.getRequestHash())) {
        throw new ApiException(
            HttpStatus.CONFLICT,
            "IDEMPOTENCY_CONFLICT",
            "Idempotency key reused with a different request");
      }
      if ("completed".equals(found.getState())) {
        return new Access(found, decodeResponse(found.getResponseBody()));
      }
      if ("in_progress".equals(found.getState())) {
        throw new ApiException(
            HttpStatus.CONFLICT, "REQUEST_IN_PROGRESS", "Request is already being processed");
      }
      // failed state with same request hash can be retried
      found.setState("in_progress");
      found.setErrorCode(null);
      found.setStatusCode(null);
      found.setResponseBody(null);
      found.setExpiresAt(Instant.now().plus(24, ChronoUnit.HOURS));
      repository.save(found);
      return new Access(found, null);
    }

    IdempotencyKeyEntity row = new IdempotencyKeyEntity();
    row.setScope(scope);
    row.setActorKey(actorKey);
    row.setIdempotencyKey(trimmed);
    row.setRequestHash(reqHash);
    row.setState("in_progress");
    row.setExpiresAt(Instant.now().plus(24, ChronoUnit.HOURS));
    repository.save(row);
    return new Access(row, null);
  }

  @Transactional
  public void complete(IdempotencyKeyEntity entry, int status, Map<String, Object> responseData) {
    entry.setState("completed");
    entry.setStatusCode(status);
    entry.setErrorCode(null);
    entry.setResponseBody(parseTree(canonicalJson(responseData)));
    repository.save(entry);
  }

  @Transactional
  public void fail(IdempotencyKeyEntity entry, String errorCode) {
    entry.setState("failed");
    entry.setErrorCode(errorCode != null ? errorCode : "REQUEST_FAILED");
    repository.save(entry);
  }

  @Transactional
  public int cleanupExpired() {
    return repository.deleteExpired(Instant.now());
  }

  private Map<String, Object> decodeResponse(JsonNode json) {
    if (json == null) return Map.of();
    try {
      return objectMapper.convertValue(
          json,
          objectMapper.getTypeFactory().constructMapType(LinkedHashMap.class, String.class, Object.class));
    } catch (IllegalArgumentException e) {
      return Map.of();
    }
  }

  private String canonicalJson(Object obj) {
    try {
      return objectMapper.writeValueAsString(obj == null ? Map.of() : obj);
    } catch (JsonProcessingException e) {
      throw new ApiException(HttpStatus.BAD_REQUEST, "BAD_REQUEST", "Request payload is invalid");
    }
  }

  private static String sha256(String s) {
    try {
      byte[] d = MessageDigest.getInstance("SHA-256").digest(s.getBytes(StandardCharsets.UTF_8));
      return HexFormat.of().formatHex(d);
    } catch (NoSuchAlgorithmException e) {
      throw new IllegalStateException("SHA-256 unavailable", e);
    }
  }

  private JsonNode parseTree(String json) {
    try {
      return objectMapper.readTree(json);
    } catch (JsonProcessingException e) {
      throw new ApiException(HttpStatus.BAD_REQUEST, "BAD_REQUEST", "Request payload is invalid");
    }
  }
}
