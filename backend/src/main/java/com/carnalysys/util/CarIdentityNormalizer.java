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

  /**
   * Title Case per word (e.g. {@code audi} → {@code Audi}). Applies after {@link
   * #normalizeDisplayText}.
   */
  public static String toTitleCaseWords(String value) {
    String display = normalizeDisplayText(value);
    if (display == null) {
      return null;
    }
    String[] words = display.split(" ");
    StringBuilder sb = new StringBuilder();
    for (int i = 0; i < words.length; i++) {
      if (i > 0) {
        sb.append(' ');
      }
      String w = words[i];
      if (!w.isEmpty()) {
        sb.append(Character.toUpperCase(w.charAt(0)));
        if (w.length() > 1) {
          sb.append(w.substring(1).toLowerCase(Locale.ROOT));
        }
      }
    }
    return sb.toString();
  }

  /** Brand/make: trim, collapse whitespace, Title Case. */
  public static String normalizeBrand(String value) {
    return toTitleCaseWords(value);
  }

  /** Model or variant: same canonical formatting as brand. */
  public static String normalizeIdentityField(String value) {
    return toTitleCaseWords(value);
  }

  public record IdentityKeys(String make, String model, String variant, String fuel) {}

  public static IdentityKeys keys(String make, String model, String variant, String fuel) {
    return new IdentityKeys(
        identityKey(make), identityKey(model), identityKey(variant), identityKey(fuel));
  }
}
