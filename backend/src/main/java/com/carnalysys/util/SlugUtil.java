package com.carnalysys.util;

public final class SlugUtil {

  private SlugUtil() {}

  public static String slug(String s) {
    return String.valueOf(s)
        .toLowerCase()
        .replaceAll("\\s+", "-")
        .replaceAll("[^a-z0-9-]", "");
  }
}
