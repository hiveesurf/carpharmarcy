package com.carnalysys.service;

import com.carnalysys.api.ApiException;
import java.io.InputStream;
import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import org.apache.poi.ss.usermodel.Cell;
import org.apache.poi.ss.usermodel.CellType;
import org.apache.poi.ss.usermodel.Row;
import org.apache.poi.ss.usermodel.Sheet;
import org.apache.poi.ss.usermodel.Workbook;
import org.apache.poi.xssf.usermodel.XSSFWorkbook;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Component;
import org.springframework.web.multipart.MultipartFile;

/**
 * Parses the Stock Summary Excel format into a flat list of ParsedRow records.
 *
 * <p>Expected columns (detected by header row containing "SKU"):
 * SKU | Part Name | Vehicle Model | YEAR | Vehicle Make | Vehicle Variant | Vehicle Fuel |
 * Part Number | Brand | UNIT/VOLUM | Supplier Name | Purchase Price | Selling Price |
 * Opening Stock | Stock In | Stock Out | Current Stock
 *
 * <p>Row filtering:
 * - Any row where every cell is blank is skipped.
 * - Any row where a cell contains "LUXURY VEHICLE PARTS" (case-insensitive) is skipped (label row).
 * - Any row where Part Name is blank is skipped.
 * - Intra-file duplicate SKUs are auto-suffixed: SKU001-2, SKU001-3, …
 */
@Component
public class ProductExcelParser {

  private static final int MAX_ROWS = 2000;

  public record ParsedRow(
      int rowNumber,
      String sku,
      String partName,
      String vehicleModel,
      String year,
      String vehicleMake,
      String vehicleVariant,
      String vehicleFuel,
      String partNumber,
      String brand,
      String unitVolume,
      String supplierName,
      BigDecimal purchasePrice,
      BigDecimal sellingPrice,
      int openingStock,
      int stockIn,
      int stockOut,
      int currentStock
  ) {}

  public List<ParsedRow> parse(MultipartFile file) {
    if (file == null || file.isEmpty()) {
      throw new ApiException(HttpStatus.BAD_REQUEST, "EXCEL_PARSE_ERROR", "Uploaded file is empty");
    }
    String filename = file.getOriginalFilename();
    if (filename != null && !filename.toLowerCase().endsWith(".xlsx")) {
      throw new ApiException(HttpStatus.BAD_REQUEST, "EXCEL_PARSE_ERROR",
          "Only .xlsx files are supported");
    }

    try (InputStream in = file.getInputStream();
        Workbook wb = new XSSFWorkbook(in)) {

      Sheet sheet = wb.getSheetAt(0);
      if (sheet == null) {
        throw new ApiException(HttpStatus.BAD_REQUEST, "EXCEL_PARSE_ERROR",
            "Excel file has no sheets");
      }

      int[] colIdx = detectHeaderRow(sheet);
      if (colIdx == null) {
        throw new ApiException(HttpStatus.BAD_REQUEST, "EXCEL_PARSE_ERROR",
            "Could not find header row containing 'SKU' column");
      }

      int headerRowNum = (int) colIdx[colIdx.length - 1];
      int[] cols = colIdx;

      List<ParsedRow> results = new ArrayList<>();
      Map<String, Integer> skuCounts = new HashMap<>();

      int rowCount = 0;
      for (int r = headerRowNum + 1; r <= sheet.getLastRowNum(); r++) {
        if (rowCount >= MAX_ROWS) break;
        Row row = sheet.getRow(r);
        if (row == null) continue;

        if (isLabelRow(row)) continue;
        if (isBlankRow(row)) continue;

        String rawSku = str(row, cols[0]);
        String partName = str(row, cols[1]);

        if (partName.isBlank()) continue;

        // Auto-suffix duplicate SKUs within this import
        String finalSku = rawSku.isBlank() ? "SKU-" + (r + 1) : rawSku;
        int count = skuCounts.getOrDefault(finalSku, 0) + 1;
        skuCounts.put(finalSku, count);
        if (count > 1) {
          finalSku = finalSku + "-" + count;
        }

        ParsedRow pr = new ParsedRow(
            r + 1,
            finalSku,
            partName,
            str(row, cols[2]),
            str(row, cols[3]),
            str(row, cols[4]),
            str(row, cols[5]),
            str(row, cols[6]),
            str(row, cols[7]),
            str(row, cols[8]),
            str(row, cols[9]),
            str(row, cols[10]),
            decimal(row, cols[11]),
            decimal(row, cols[12]),
            intVal(row, cols[13]),
            intVal(row, cols[14]),
            intVal(row, cols[15]),
            intVal(row, cols[16])
        );
        results.add(pr);
        rowCount++;
      }
      return results;

    } catch (ApiException e) {
      throw e;
    } catch (Exception e) {
      throw new ApiException(HttpStatus.BAD_REQUEST, "EXCEL_PARSE_ERROR",
          "Failed to parse Excel file: " + e.getMessage());
    }
  }

  /** Returns column indices [sku,partName,model,year,make,variant,fuel,partNum,brand,unit,supplier,purchase,selling,opening,stockIn,stockOut,current, headerRowNum] */
  private int[] detectHeaderRow(Sheet sheet) {
    for (int r = 0; r <= Math.min(sheet.getLastRowNum(), 10); r++) {
      Row row = sheet.getRow(r);
      if (row == null) continue;
      int skuCol = -1;
      for (Cell cell : row) {
        String v = cellString(cell);
        if ("SKU".equalsIgnoreCase(v.trim())) {
          skuCol = cell.getColumnIndex();
          break;
        }
      }
      if (skuCol < 0) continue;
      // Found header row — map remaining columns by position relative to SKU
      return new int[]{
          skuCol,      // SKU
          skuCol + 1,  // Part Name
          skuCol + 2,  // Vehicle Model
          skuCol + 3,  // YEAR
          skuCol + 4,  // Vehicle Make
          skuCol + 5,  // Vehicle Variant
          skuCol + 6,  // Vehicle Fuel
          skuCol + 7,  // Part Number
          skuCol + 8,  // Brand
          skuCol + 9,  // UNIT/VOLUM
          skuCol + 10, // Supplier Name
          skuCol + 11, // Purchase Price
          skuCol + 12, // Selling Price
          skuCol + 13, // Opening Stock
          skuCol + 14, // Stock In
          skuCol + 15, // Stock Out
          skuCol + 16, // Current Stock
          r            // header row number (sentinel at end)
      };
    }
    return null;
  }

  private boolean isLabelRow(Row row) {
    for (Cell cell : row) {
      String v = cellString(cell);
      if (v.toUpperCase().contains("LUXURY VEHICLE PARTS")) return true;
    }
    return false;
  }

  private boolean isBlankRow(Row row) {
    for (Cell cell : row) {
      if (!cellString(cell).isBlank()) return false;
    }
    return true;
  }

  private String str(Row row, int col) {
    if (row == null) return "";
    Cell cell = row.getCell(col);
    String v = cellString(cell).trim();
    // Normalize noise values to empty
    if ("_".equals(v) || "N/L".equalsIgnoreCase(v)) return "";
    return v;
  }

  private BigDecimal decimal(Row row, int col) {
    if (row == null) return BigDecimal.ZERO;
    Cell cell = row.getCell(col);
    if (cell == null) return BigDecimal.ZERO;
    if (cell.getCellType() == CellType.NUMERIC) {
      return BigDecimal.valueOf(cell.getNumericCellValue());
    }
    String s = cellString(cell).trim().replaceAll("[^0-9.]", "");
    if (s.isBlank()) return BigDecimal.ZERO;
    try {
      return new BigDecimal(s);
    } catch (NumberFormatException e) {
      return BigDecimal.ZERO;
    }
  }

  private int intVal(Row row, int col) {
    BigDecimal d = decimal(row, col);
    return d.intValue();
  }

  private String cellString(Cell cell) {
    if (cell == null) return "";
    return switch (cell.getCellType()) {
      case STRING -> cell.getStringCellValue();
      case NUMERIC -> {
        double d = cell.getNumericCellValue();
        if (d == Math.floor(d) && !Double.isInfinite(d)) yield String.valueOf((long) d);
        yield String.valueOf(d);
      }
      case BOOLEAN -> String.valueOf(cell.getBooleanCellValue());
      case FORMULA -> {
        try {
          yield String.valueOf(cell.getNumericCellValue());
        } catch (Exception e) {
          try {
            yield cell.getStringCellValue();
          } catch (Exception e2) {
            yield "";
          }
        }
      }
      default -> "";
    };
  }
}
