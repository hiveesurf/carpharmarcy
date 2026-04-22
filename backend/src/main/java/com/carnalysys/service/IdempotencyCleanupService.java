package com.carnalysys.service;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;

@Service
public class IdempotencyCleanupService {
  private static final Logger log = LoggerFactory.getLogger(IdempotencyCleanupService.class);

  private final IdempotencyService idempotencyService;

  public IdempotencyCleanupService(IdempotencyService idempotencyService) {
    this.idempotencyService = idempotencyService;
  }

  @Scheduled(fixedDelayString = "${app.idempotency.cleanup-ms:900000}")
  public void cleanupExpired() {
    int runs = idempotencyService.cleanupExpired();
    if (runs > 0) {
      log.debug("Idempotency cleanup executed");
    }
  }
}
