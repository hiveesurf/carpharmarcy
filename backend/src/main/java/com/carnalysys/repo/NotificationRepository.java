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

  @Query(
      "select n from NotificationEntity n "
          + "where n.recipientType = :recipientType and n.recipientId = :recipientId "
          + "and (:cursor is null or n.createdAt < :cursor) "
          + "and (:unreadOnly = false or n.readAt is null) "
          + "order by n.createdAt desc")
  List<NotificationEntity> listForRecipient(
      @Param("recipientType") String recipientType,
      @Param("recipientId") String recipientId,
      @Param("cursor") Instant cursor,
      @Param("unreadOnly") boolean unreadOnly,
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
