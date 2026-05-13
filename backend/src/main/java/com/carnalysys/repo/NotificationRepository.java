package com.carnalysys.repo;

import com.carnalysys.domain.NotificationEntity;
import java.time.Instant;
import java.util.Collection;
import java.util.List;
import java.util.UUID;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface NotificationRepository extends JpaRepository<NotificationEntity, UUID> {

  boolean existsByRecipientTypeAndRecipientIdAndTopicAndSourceId(
      String recipientType, String recipientId, String topic, String sourceId);

  /**
   * Split queries avoid binding a nullable {@code Instant} cursor into {@code (? is null or ...)}
   * branches, which PostgreSQL rejects ("could not determine data type of parameter").
   */
  @Query(
      "select n from NotificationEntity n "
          + "where n.recipientType = :recipientType and n.recipientId = :recipientId "
          + "order by n.createdAt desc")
  List<NotificationEntity> listForRecipientNoCursorIncludingRead(
      @Param("recipientType") String recipientType,
      @Param("recipientId") String recipientId,
      Pageable pageable);

  @Query(
      "select n from NotificationEntity n "
          + "where n.recipientType = :recipientType and n.recipientId = :recipientId "
          + "and n.readAt is null "
          + "order by n.createdAt desc")
  List<NotificationEntity> listForRecipientNoCursorUnreadOnly(
      @Param("recipientType") String recipientType,
      @Param("recipientId") String recipientId,
      Pageable pageable);

  @Query(
      "select n from NotificationEntity n "
          + "where n.recipientType = :recipientType and n.recipientId = :recipientId "
          + "and n.createdAt < :cursor "
          + "order by n.createdAt desc")
  List<NotificationEntity> listForRecipientBeforeCursorIncludingRead(
      @Param("recipientType") String recipientType,
      @Param("recipientId") String recipientId,
      @Param("cursor") Instant cursor,
      Pageable pageable);

  @Query(
      "select n from NotificationEntity n "
          + "where n.recipientType = :recipientType and n.recipientId = :recipientId "
          + "and n.createdAt < :cursor and n.readAt is null "
          + "order by n.createdAt desc")
  List<NotificationEntity> listForRecipientBeforeCursorUnreadOnly(
      @Param("recipientType") String recipientType,
      @Param("recipientId") String recipientId,
      @Param("cursor") Instant cursor,
      Pageable pageable);

  long countByRecipientTypeAndRecipientIdAndReadAtIsNull(String recipientType, String recipientId);

  @Modifying
  @Query(
      "update NotificationEntity n set n.readAt = :now "
          + "where n.recipientType = :recipientType and n.recipientId = :recipientId "
          + "and n.id in :ids and n.readAt is null")
  int markReadByIds(
      @Param("recipientType") String recipientType,
      @Param("recipientId") String recipientId,
      @Param("ids") Collection<UUID> ids,
      @Param("now") Instant now);

  @Modifying
  @Query(
      "update NotificationEntity n set n.readAt = :now "
          + "where n.recipientType = :recipientType and n.recipientId = :recipientId "
          + "and n.readAt is null")
  int markAllRead(
      @Param("recipientType") String recipientType,
      @Param("recipientId") String recipientId,
      @Param("now") Instant now);
}
