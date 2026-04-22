package com.carnalysys.service;

import com.carnalysys.domain.NotificationEntity;
import com.carnalysys.domain.PushSubscriptionEntity;
import com.carnalysys.repo.NotificationRepository;
import com.carnalysys.repo.PushSubscriptionRepository;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.JsonNodeFactory;
import java.time.Instant;
import java.util.Collection;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class NotificationService {
  private static final Logger log = LoggerFactory.getLogger(NotificationService.class);

  public static final String RECIPIENT_USER = "user";
  public static final String RECIPIENT_ADMIN = "admin";

  private final NotificationRepository notificationRepository;
  private final PushSubscriptionRepository pushSubscriptionRepository;
  private final ObjectMapper objectMapper;

  public NotificationService(
      NotificationRepository notificationRepository,
      PushSubscriptionRepository pushSubscriptionRepository,
      ObjectMapper objectMapper) {
    this.notificationRepository = notificationRepository;
    this.pushSubscriptionRepository = pushSubscriptionRepository;
    this.objectMapper = objectMapper;
  }

  @Transactional
  public void notifyUser(
      UUID userId,
      String topic,
      String title,
      String body,
      String sourceType,
      String sourceId,
      Map<String, Object> payload) {
    if (userId == null) return;
    saveNotification(RECIPIENT_USER, userId.toString(), topic, title, body, sourceType, sourceId, payload);
  }

  @Transactional
  public void notifyAdminEmail(
      String adminEmail,
      String topic,
      String title,
      String body,
      String sourceType,
      String sourceId,
      Map<String, Object> payload) {
    if (adminEmail == null || adminEmail.isBlank()) return;
    saveNotification(
        RECIPIENT_ADMIN,
        adminEmail.trim().toLowerCase(),
        topic,
        title,
        body,
        sourceType,
        sourceId,
        payload);
  }

  @Transactional(readOnly = true)
  public Map<String, Object> list(
      String recipientType, String recipientId, Instant cursor, int limit, boolean unreadOnly) {
    int safeLimit = Math.max(1, Math.min(50, limit));
    try {
      List<NotificationEntity> rows =
          notificationRepository.listForRecipient(
              recipientType, recipientId, cursor, unreadOnly, PageRequest.of(0, safeLimit));
      List<Map<String, Object>> items = rows.stream().map(this::toMap).toList();
      Instant nextCursor = rows.isEmpty() ? cursor : rows.get(rows.size() - 1).getCreatedAt();
      long unreadCount =
          notificationRepository.countByRecipientTypeAndRecipientIdAndReadAtIsNull(
              recipientType, recipientId);
      return Map.of(
          "items", items,
          "nextCursor", nextCursor != null ? nextCursor.toString() : null,
          "unreadCount", unreadCount,
          "hasMore", rows.size() >= safeLimit);
    } catch (RuntimeException ex) {
      log.error(
          "Failed to list notifications: recipientType={}, recipientId={}",
          recipientType,
          recipientId,
          ex);
      return Map.of("items", List.of(), "nextCursor", null, "unreadCount", 0, "hasMore", false);
    }
  }

  @Transactional
  public int markRead(String recipientType, String recipientId, Collection<String> ids, boolean all) {
    if (all) {
      return notificationRepository.markAllRead(recipientType, recipientId, Instant.now());
    }
    List<UUID> parsed =
        ids == null
            ? List.of()
            : ids.stream().map(this::parseUuid).filter(x -> x != null).toList();
    if (parsed.isEmpty()) return 0;
    return notificationRepository.markReadByIds(recipientType, recipientId, parsed, Instant.now());
  }

  @Transactional
  public void upsertPushSubscription(
      String recipientType,
      String recipientId,
      String endpoint,
      String p256dh,
      String auth,
      String userAgent) {
    if (endpoint == null || endpoint.isBlank() || p256dh == null || auth == null) return;
    PushSubscriptionEntity row =
        pushSubscriptionRepository
            .findByRecipientTypeAndRecipientIdAndEndpoint(recipientType, recipientId, endpoint)
            .orElseGet(PushSubscriptionEntity::new);
    row.setRecipientType(recipientType);
    row.setRecipientId(recipientId);
    row.setEndpoint(endpoint.trim());
    row.setP256dh(p256dh.trim());
    row.setAuth(auth.trim());
    row.setUserAgent(userAgent);
    pushSubscriptionRepository.save(row);
  }

  @Transactional
  public long removePushSubscription(String recipientType, String recipientId, String endpoint) {
    if (endpoint == null || endpoint.isBlank()) return 0L;
    return pushSubscriptionRepository.deleteByRecipientTypeAndRecipientIdAndEndpoint(
        recipientType, recipientId, endpoint.trim());
  }

  private void saveNotification(
      String recipientType,
      String recipientId,
      String topic,
      String title,
      String body,
      String sourceType,
      String sourceId,
      Map<String, Object> payload) {
    NotificationEntity n = new NotificationEntity();
    n.setRecipientType(recipientType);
    n.setRecipientId(recipientId);
    n.setTopic(topic != null ? topic : "general");
    n.setTitle(title != null ? title : "Notification");
    n.setBody(body != null ? body : "");
    n.setSourceType(sourceType);
    n.setSourceId(sourceId);
    n.setPayload(
        payload != null
            ? objectMapper.valueToTree(payload)
            : JsonNodeFactory.instance.objectNode());
    notificationRepository.save(n);
    dispatchPushBestEffort(recipientType, recipientId, n);
  }

  private Map<String, Object> toMap(NotificationEntity n) {
    Map<String, Object> row = new LinkedHashMap<>();
    row.put("id", n.getId().toString());
    row.put("topic", n.getTopic());
    row.put("title", n.getTitle());
    row.put("body", n.getBody());
    row.put("sourceType", n.getSourceType());
    row.put("sourceId", n.getSourceId());
    row.put("payload", n.getPayload());
    row.put("read", n.getReadAt() != null);
    row.put("readAt", n.getReadAt() != null ? n.getReadAt().toString() : null);
    row.put("createdAt", n.getCreatedAt().toString());
    return row;
  }

  private UUID parseUuid(String raw) {
    try {
      return raw == null ? null : UUID.fromString(raw);
    } catch (IllegalArgumentException ex) {
      return null;
    }
  }

  private void dispatchPushBestEffort(
      String recipientType, String recipientId, NotificationEntity notification) {
    List<PushSubscriptionEntity> subs =
        pushSubscriptionRepository.findByRecipientTypeAndRecipientId(recipientType, recipientId);
    if (subs.isEmpty()) return;
    // Foundation stage: persist subscriptions and emit dispatch intent logs.
    // Actual web-push provider integration can be enabled behind env flags later.
    log.info(
        "Push dispatch queued (foundation): recipientType={}, recipientId={}, subscriptions={}, notificationId={}",
        recipientType,
        recipientId,
        subs.size(),
        notification.getId());
  }
}
