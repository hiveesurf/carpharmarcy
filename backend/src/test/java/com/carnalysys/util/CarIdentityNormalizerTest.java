package com.carnalysys.util;

import static org.assertj.core.api.Assertions.assertThat;

import org.junit.jupiter.api.Test;

class CarIdentityNormalizerTest {

  @Test
  void identityKeyIsCaseInsensitiveAndCollapsesWhitespace() {
    assertThat(CarIdentityNormalizer.identityKey("  Audi  ")).isEqualTo("audi");
    assertThat(CarIdentityNormalizer.identityKey("Audi   A4")).isEqualTo("audi a4");
    assertThat(CarIdentityNormalizer.identityKey("AUDI")).isEqualTo("audi");
  }

  @Test
  void normalizeDisplayTextTrimsAndCollapsesSpaces() {
    assertThat(CarIdentityNormalizer.normalizeDisplayText("  Audi   A4  ")).isEqualTo("Audi A4");
  }

  @Test
  void toTitleCaseWordsNormalizesBrandCasing() {
    assertThat(CarIdentityNormalizer.normalizeBrand("audi")).isEqualTo("Audi");
    assertThat(CarIdentityNormalizer.normalizeBrand("AUDI")).isEqualTo("Audi");
    assertThat(CarIdentityNormalizer.normalizeBrand("  land   rover ")).isEqualTo("Land Rover");
    assertThat(CarIdentityNormalizer.normalizeIdentityField("corolla")).isEqualTo("Corolla");
  }
}
