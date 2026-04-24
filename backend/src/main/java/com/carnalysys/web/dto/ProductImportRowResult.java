package com.carnalysys.web.dto;

public record ProductImportRowResult(
    int rowNumber,
    String sku,
    String name,
    String status,
    String error
) {}
