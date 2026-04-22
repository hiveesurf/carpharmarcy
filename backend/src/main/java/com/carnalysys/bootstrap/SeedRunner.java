package com.carnalysys.bootstrap;

import com.carnalysys.service.CatalogSeedService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.core.annotation.Order;
import org.springframework.stereotype.Component;

@Component
@Order(100)
public class SeedRunner implements ApplicationRunner {

  private static final Logger log = LoggerFactory.getLogger(SeedRunner.class);

  private final CatalogSeedService catalogSeedService;

  public SeedRunner(CatalogSeedService catalogSeedService) {
    this.catalogSeedService = catalogSeedService;
  }

  @Override
  public void run(ApplicationArguments args) {
    try {
      catalogSeedService.seedIfEmpty();
    } catch (Exception e) {
      log.error("Catalog seed failed", e);
      throw new IllegalStateException("Catalog seed failed", e);
    }
  }
}
