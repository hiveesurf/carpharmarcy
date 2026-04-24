package com.carnalysys.web.dto;

import java.util.List;

public record ProductImportReport(
    int totalRows,
    int created,
    int skipped,
    List<ProductImportRowResult> rows,
    List<String> warnings
) {}
