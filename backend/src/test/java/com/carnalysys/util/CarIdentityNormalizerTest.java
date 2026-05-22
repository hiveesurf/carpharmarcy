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
  void normalizeBrandUppercasesAndCollapsesWhitespace() {
    assertThat(CarIdentityNormalizer.normalizeBrand("audi")).isEqualTo("AUDI");
    assertThat(CarIdentityNormalizer.normalizeBrand("bmw")).isEqualTo("BMW");
    assertThat(CarIdentityNormalizer.normalizeBrand("Honda")).isEqualTo("HONDA");
    assertThat(CarIdentityNormalizer.normalizeBrand("  land   rover ")).isEqualTo("LAND ROVER");
  }

  @Test
  void normalizeIdentityFieldPreservesModelVariantCasing() {
    assertThat(CarIdentityNormalizer.normalizeIdentityField("a4")).isEqualTo("a4");
    assertThat(CarIdentityNormalizer.normalizeIdentityField("A4")).isEqualTo("A4");
    assertThat(CarIdentityNormalizer.normalizeIdentityField("premium plus")).isEqualTo("premium plus");
    assertThat(CarIdentityNormalizer.normalizeIdentityField("  M   Sport ")).isEqualTo("M Sport");
  }
}
