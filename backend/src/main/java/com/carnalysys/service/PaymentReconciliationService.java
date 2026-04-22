package com.carnalysys.service;

import com.carnalysys.config.AppProperties;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;

@Service
public class PaymentReconciliationService {
  private static final Logger log = LoggerFactory.getLogger(PaymentReconciliationService.class);

  private final AppProperties appProperties;
  private final OrderService orderService;

  public PaymentReconciliationService(AppProperties appProperties, OrderService orderService) {
    this.appProperties = appProperties;
    this.orderService = orderService;
  }

  @Scheduled(fixedDelayString = "${app.payment.reconciliation-ms:300000}")
  public void reconcilePending() {
    int changed = orderService.reconcilePendingPayments(appProperties.payment().pendingTimeoutMinutes());
    if (changed > 0) {
      log.info("Reconciliation marked {} stale pending payments as failed", changed);
    }
  }
}
