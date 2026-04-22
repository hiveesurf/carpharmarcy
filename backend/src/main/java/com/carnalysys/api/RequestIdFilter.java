package com.carnalysys.api;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import java.io.IOException;
import java.util.UUID;
import org.springframework.core.Ordered;
import org.springframework.core.annotation.Order;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

@Component
@Order(Ordered.HIGHEST_PRECEDENCE)
public class RequestIdFilter extends OncePerRequestFilter {

  public static final String ATTR = "com.carnalysys.requestId";

  @Override
  protected void doFilterInternal(
      HttpServletRequest request, HttpServletResponse response, FilterChain filterChain)
      throws ServletException, IOException {
    String rid = request.getHeader("X-Request-Id");
    if (rid == null || rid.isBlank()) {
      rid = UUID.randomUUID().toString();
    }
    request.setAttribute(ATTR, rid);
    response.setHeader("X-Request-Id", rid);
    filterChain.doFilter(request, response);
  }
}
