package com.carnalysys.util;

import com.fasterxml.jackson.databind.JsonNode;
import java.util.Locale;

/** Resolves OEM/OES part brand from product metadata for catalog filter and API responses. */
public final class PartBrandSupport {

  private static final String[] BRAND_KEYS = {"brand", "oem", "oes", "supplierName"};

  private PartBrandSupport() {}

  /** Display value: first non-blank among brand, oem, oes, supplierName (trimmed). */
  public static String resolveDisplayBrand(JsonNode metadata) {
    if (metadata == null || !metadata.isObject()) {
      return null;
    }
    for (String key : BRAND_KEYS) {
      String value = textField(metadata, key);
      if (value != null) {
        return value;
      }
    }
    return null;
  }

  /** Case-insensitive comparison key for filters and deduplication. */
  public static String normalizeKey(String raw) {
    if (raw == null) {
      return "";
    }
    return raw.trim().replaceAll("\\s+", " ").toLowerCase(Locale.ROOT);
  }

  private static String textField(JsonNode md, String key) {
    if (!md.has(key)) {
      return null;
    }
    JsonNode v = md.get(key);
    if (v == null || v.isNull() || !v.isTextual()) {
      return null;
    }
    String s = v.asText().trim();
    return s.isEmpty() ? null : s;
  }
}
