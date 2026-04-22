package com.carnalysys;

import static org.assertj.core.api.Assertions.assertThat;

import com.carnalysys.config.AppProperties;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.Test;
import org.springframework.boot.WebApplicationType;
import org.springframework.boot.builder.SpringApplicationBuilder;
import org.springframework.boot.context.properties.EnableConfigurationProperties;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.ConfigurableApplicationContext;

class ProfileConfigurationSanityTest {
  private static final String[] REQUIRED_ENV_KEYS = {
    "SPRING_DATASOURCE_URL",
    "SPRING_DATASOURCE_USERNAME",
    "SPRING_DATASOURCE_PASSWORD",
    "APP_JWT_SECRET",
    "APP_PAYMENT_WEBHOOK_SECRET",
    "APP_CORS_ALLOWED_ORIGINS"
  };

  @AfterEach
  void clearOverrides() {
    for (String key : REQUIRED_ENV_KEYS) {
      System.clearProperty(key);
    }
  }

  @Test
  void profileConfigLoadsWithRequiredSecrets() {
    String profile = System.getenv().getOrDefault("TEST_PROFILE", "local");
    for (String key : REQUIRED_ENV_KEYS) {
      String envValue = System.getenv(key);
      if (envValue != null && !envValue.isBlank()) {
        System.setProperty(key, envValue);
      }
    }
    try (ConfigurableApplicationContext ctx =
        new SpringApplicationBuilder(ProfilePropsConfig.class)
            .profiles(profile)
            .web(WebApplicationType.NONE)
            .properties("spring.main.banner-mode=off", "spring.main.lazy-initialization=true")
            .run()) {
      AppProperties appProperties = ctx.getBean(AppProperties.class);
      assertThat(appProperties.jwt().secret()).isNotBlank();
      assertThat(appProperties.payment().webhookSecret()).isNotBlank();
      assertThat(appProperties.cors().allowedOrigins()).isNotBlank();
    }
  }

  @Configuration
  @EnableConfigurationProperties(AppProperties.class)
  static class ProfilePropsConfig {}
}
