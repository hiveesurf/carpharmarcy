package com.carnalysys.domain;

import com.fasterxml.jackson.databind.JsonNode;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import java.time.Instant;
import java.util.UUID;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

@Entity
@Table(name = "seller_leads")
public class SellerLead {

  @Id private UUID id = UUID.randomUUID();

  private String source;

  @Column(columnDefinition = "text")
  private String message;

  @JdbcTypeCode(SqlTypes.JSON)
  @Column(nullable = false, columnDefinition = "jsonb")
  private JsonNode payload;

  @Column(name = "created_at", nullable = false)
  private Instant createdAt = Instant.now();

  public UUID getId() {
    return id;
  }

  public void setSource(String source) {
    this.source = source;
  }

  public void setMessage(String message) {
    this.message = message;
  }

  public void setPayload(JsonNode payload) {
    this.payload = payload;
  }
}
