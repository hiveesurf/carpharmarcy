package com.carnalysys.api;

import jakarta.servlet.http.HttpServletRequest;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.http.converter.HttpMessageNotReadableException;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.method.annotation.MethodArgumentTypeMismatchException;
import org.springframework.web.HttpRequestMethodNotSupportedException;

@RestControllerAdvice
public class GlobalExceptionHandler {

  private static final Logger log = LoggerFactory.getLogger(GlobalExceptionHandler.class);

  @ExceptionHandler(ApiException.class)
  public ResponseEntity<ApiErrorEnvelope> api(ApiException ex, HttpServletRequest req) {
    var meta = ApiMeta.of((String) req.getAttribute(RequestIdFilter.ATTR));
    String rid = meta.requestId();
    HttpStatus status = ex.status() != null ? ex.status() : HttpStatus.INTERNAL_SERVER_ERROR;
    if (status.is4xxClientError()) {
      log.warn("API error {} {} — rid={}", ex.code(), ex.getMessage(), rid);
    } else {
      log.error("API error {} {} — rid={}", ex.code(), ex.getMessage(), rid, ex);
    }
    return ResponseEntity.status(status)
        .body(ApiErrorEnvelope.of(ex.code(), ex.getMessage(), ex.details(), meta));
  }

  @ExceptionHandler(MethodArgumentNotValidException.class)
  public ResponseEntity<ApiErrorEnvelope> validation(
      MethodArgumentNotValidException ex, HttpServletRequest req) {
    var meta = ApiMeta.of((String) req.getAttribute(RequestIdFilter.ATTR));
    List<Map<String, String>> details = new ArrayList<>();
    for (var fe : ex.getBindingResult().getFieldErrors()) {
      Map<String, String> row = new LinkedHashMap<>();
      row.put("field", fe.getField());
      row.put("message", fe.getDefaultMessage() != null ? fe.getDefaultMessage() : "Invalid value");
      details.add(row);
    }
    String msg =
        ex.getBindingResult().getFieldErrors().stream()
            .map(fe -> fe.getField() + ": " + fe.getDefaultMessage())
            .findFirst()
            .orElse("Validation failed");
    log.warn(
        "Validation failed — rid={} — fields={}",
        meta.requestId(),
        details.stream().map(d -> d.get("field") + "=" + d.get("message")).toList());
    return ResponseEntity.status(HttpStatus.BAD_REQUEST)
        .body(ApiErrorEnvelope.of("VALIDATION_ERROR", msg, details.isEmpty() ? null : details, meta));
  }

  @ExceptionHandler(Exception.class)
  public ResponseEntity<ApiErrorEnvelope> fallback(Exception ex, HttpServletRequest req) {
    var meta = ApiMeta.of((String) req.getAttribute(RequestIdFilter.ATTR));
    log.error("Unhandled exception — rid={}", meta.requestId(), ex);
    return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
        .body(
            ApiErrorEnvelope.of(
                "INTERNAL_ERROR", "Something went wrong", null, meta));
  }

  @ExceptionHandler(HttpMessageNotReadableException.class)
  public ResponseEntity<ApiErrorEnvelope> badJson(
      HttpMessageNotReadableException ex, HttpServletRequest req) {
    var meta = ApiMeta.of((String) req.getAttribute(RequestIdFilter.ATTR));
    log.warn("Malformed JSON body — rid={}", meta.requestId());
    return ResponseEntity.status(HttpStatus.BAD_REQUEST)
        .body(ApiErrorEnvelope.of("INVALID_JSON", "Malformed JSON body", null, meta));
  }

  @ExceptionHandler({MethodArgumentTypeMismatchException.class, IllegalArgumentException.class})
  public ResponseEntity<ApiErrorEnvelope> badArgument(Exception ex, HttpServletRequest req) {
    var meta = ApiMeta.of((String) req.getAttribute(RequestIdFilter.ATTR));
    log.warn("Invalid request argument — rid={} — {}", meta.requestId(), ex.getMessage());
    return ResponseEntity.status(HttpStatus.BAD_REQUEST)
        .body(ApiErrorEnvelope.of("VALIDATION_ERROR", "Invalid request parameter", null, meta));
  }

  @ExceptionHandler(DataIntegrityViolationException.class)
  public ResponseEntity<ApiErrorEnvelope> integrity(
      DataIntegrityViolationException ex, HttpServletRequest req) {
    var meta = ApiMeta.of((String) req.getAttribute(RequestIdFilter.ATTR));
    log.warn("Data integrity violation — rid={}", meta.requestId());
    return ResponseEntity.status(HttpStatus.CONFLICT)
        .body(ApiErrorEnvelope.of("CONFLICT", "Request conflicts with existing data", null, meta));
  }

  @ExceptionHandler(HttpRequestMethodNotSupportedException.class)
  public ResponseEntity<ApiErrorEnvelope> methodNotAllowed(
      HttpRequestMethodNotSupportedException ex, HttpServletRequest req) {
    var meta = ApiMeta.of((String) req.getAttribute(RequestIdFilter.ATTR));
    log.warn("Method not allowed — rid={} — {}", meta.requestId(), ex.getMessage());
    return ResponseEntity.status(HttpStatus.METHOD_NOT_ALLOWED)
        .body(ApiErrorEnvelope.of("METHOD_NOT_ALLOWED", "Method not allowed", null, meta));
  }
}
