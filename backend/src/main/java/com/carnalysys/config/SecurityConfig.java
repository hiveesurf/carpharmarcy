package com.carnalysys.config;

import com.carnalysys.security.AdminSessionAuthenticationFilter;
import com.carnalysys.security.AdminSessionService;
import com.carnalysys.security.JwtAuthenticationFilter;
import com.carnalysys.security.JwtService;
import com.carnalysys.repo.AdminUserRepository;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.core.annotation.Order;
import org.springframework.security.config.Customizer;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;

@Configuration
@EnableWebSecurity
public class SecurityConfig {

  @Bean
  JwtAuthenticationFilter jwtAuthenticationFilter(JwtService jwtService) {
    return new JwtAuthenticationFilter(jwtService);
  }

  @Bean
  @Order(1)
  SecurityFilterChain adminChain(
      HttpSecurity http,
      AdminSessionService adminSessionService,
      AdminUserRepository adminUserRepository,
      ObjectMapper objectMapper,
      JwtAuthenticationFilter jwtAuthenticationFilter)
      throws Exception {
    var adminFilter = new AdminSessionAuthenticationFilter(adminSessionService, objectMapper, adminUserRepository);
    return http.securityMatcher("/api/v1/admin/**")
        .csrf(AbstractHttpConfigurer::disable)
        .cors(Customizer.withDefaults())
        .sessionManagement(s -> s.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
        .authorizeHttpRequests(
            a ->
                a.requestMatchers("/api/v1/admin/auth/login", "/api/v1/admin/auth/logout")
                    .permitAll()
                    .requestMatchers("/api/v1/admin/delivery/me/availability")
                    .hasRole("DELIVERY")
                    .requestMatchers("/api/v1/admin/employees/**")
                    .hasRole("SUPER_ADMIN")
                    .requestMatchers("/api/v1/admin/orders/*/assign-delivery")
                    .hasRole("SUPER_ADMIN")
                    .requestMatchers("/api/v1/admin/products/**")
                    .hasAnyRole("SUPER_ADMIN", "SALES")
                    .requestMatchers("/api/v1/admin/orders/**")
                    .hasAnyRole("SUPER_ADMIN", "SALES", "DELIVERY")
                    .anyRequest()
                    .hasAnyRole("SUPER_ADMIN", "SALES", "DELIVERY"))
        .addFilterBefore(jwtAuthenticationFilter, UsernamePasswordAuthenticationFilter.class)
        .addFilterAfter(adminFilter, JwtAuthenticationFilter.class)
        .build();
  }

  @Bean
  @Order(2)
  SecurityFilterChain apiChain(HttpSecurity http, JwtAuthenticationFilter jwtAuthenticationFilter)
      throws Exception {
    return http.csrf(AbstractHttpConfigurer::disable)
        .cors(Customizer.withDefaults())
        .sessionManagement(s -> s.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
        .authorizeHttpRequests(a -> a.anyRequest().permitAll())
        .addFilterBefore(jwtAuthenticationFilter, UsernamePasswordAuthenticationFilter.class)
        .build();
  }
}
