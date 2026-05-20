package com.carnalysys.util;

import java.util.Locale;

/** Normalizes admin car catalog identity fields for storage and duplicate detection. */
public final class CarIdentityNormalizer {

  private CarIdentityNormalizer() {}

  /** Trim and collapse internal whitespace; null/blank → null. */
  public static String normalizeDisplayText(String value) {
    if (value == null) {
      return null;
    }
    String collapsed = value.trim().replaceAll("\\s+", " ");
    return collapsed.isEmpty() ? null : collapsed;
  }

  /** Case-insensitive identity key with collapsed whitespace. */
  public static String identityKey(String value) {
    String display = normalizeDisplayText(value);
    return display == null ? "" : display.toLowerCase(Locale.ROOT);
  }

  public record IdentityKeys(String make, String model, String variant, String fuel) {}

  public static IdentityKeys keys(String make, String model, String variant, String fuel) {
    return new IdentityKeys(
        identityKey(make), identityKey(model), identityKey(variant), identityKey(fuel));
  }
}
