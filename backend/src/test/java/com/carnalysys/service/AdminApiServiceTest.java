package com.carnalysys.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.carnalysys.api.ApiException;
import com.carnalysys.domain.AdminUser;
import com.carnalysys.domain.OrderEntity;
import com.carnalysys.repo.AdminUserRepository;
import com.carnalysys.repo.CarModelRepository;
import com.carnalysys.repo.CategoryRepository;
import com.carnalysys.repo.OrderLineRepository;
import com.carnalysys.repo.OrderRepository;
import com.carnalysys.repo.OrderStatusAuditRepository;
import com.carnalysys.repo.ProductChangeAuditRepository;
import com.carnalysys.repo.ProductFitmentCarRepository;
import com.carnalysys.repo.ProductFitmentLabelRepository;
import com.carnalysys.repo.ProductRepository;
import com.carnalysys.repo.ProductVehicleSpecRepository;
import com.carnalysys.repo.UserProfileRepository;
import com.carnalysys.repo.UserRepository;
import com.carnalysys.security.AdminSessionService;
import com.fasterxml.jackson.databind.ObjectMapper;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpStatus;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.password.PasswordEncoder;

@ExtendWith(MockitoExtension.class)
class AdminApiServiceTest {

  @Mock private AdminUserRepository adminUserRepository;
  @Mock private PasswordEncoder passwordEncoder;
  @Mock private AdminSessionService adminSessionService;
  @Mock private UserRepository userRepository;
  @Mock private UserProfileRepository userProfileRepository;
  @Mock private OrderRepository orderRepository;
  @Mock private CategoryRepository categoryRepository;
  @Mock private OrderLineRepository orderLineRepository;
  @Mock private OrderStatusAuditRepository orderStatusAuditRepository;
  @Mock private ProductRepository productRepository;
  @Mock private ProductChangeAuditRepository productChangeAuditRepository;
  @Mock private ProductFitmentLabelRepository fitmentLabelRepository;
  @Mock private ProductFitmentCarRepository fitmentCarRepository;
  @Mock private CarModelRepository carModelRepository;
  @Mock private ProductVehicleSpecRepository vehicleSpecRepository;
  @Mock private CatalogService catalogService;
  @Mock private OrderService orderService;
  @Mock private ObjectMapper objectMapper;
  @Mock private ProductPresenter productPresenter;
  @Mock private UploadStorageService uploadStorageService;
  @Mock private UserAvatarService userAvatarService;

  @InjectMocks private AdminApiService adminApiService;

  @AfterEach
  void clearSecurity() {
    SecurityContextHolder.clearContext();
  }

  @Test
  void createEmployeeRejectsUnsupportedRole() {
    assertThatThrownBy(
            () ->
                adminApiService.createEmployee(
                    Map.of("phone", "+911234567890", "role", "user", "name", "Agent")))
        .isInstanceOf(ApiException.class)
        .satisfies(
            ex -> {
              ApiException ae = (ApiException) ex;
              assertThat(ae.status()).isEqualTo(HttpStatus.BAD_REQUEST);
              assertThat(ae.code()).isEqualTo("VALIDATION_ERROR");
            });
  }

  @Test
  void assignDeliveryRejectsWhenAssigneeNotFree() {
    AdminUser delivery = new AdminUser();
    delivery.setEmail("delivery@test.dev");
    delivery.setRole("delivery");
    delivery.setAvailabilityStatus("busy");
    when(adminUserRepository.findByEmailIgnoreCase("delivery@test.dev")).thenReturn(Optional.of(delivery));

    assertThatThrownBy(() -> adminApiService.assignDelivery("ord_1", "delivery@test.dev"))
        .isInstanceOf(ApiException.class)
        .satisfies(
            ex -> {
              ApiException ae = (ApiException) ex;
              assertThat(ae.status()).isEqualTo(HttpStatus.BAD_REQUEST);
              assertThat(ae.code()).isEqualTo("VALIDATION_ERROR");
            });
  }

  @Test
  void assignDeliveryUpdatesOrderWhenFreeDeliveryUserExists() {
    AdminUser delivery = new AdminUser();
    delivery.setEmail("delivery@test.dev");
    delivery.setRole("delivery");
    delivery.setAvailabilityStatus("free");
    OrderEntity order = new OrderEntity();
    order.setId("ord_1");
    when(adminUserRepository.findByEmailIgnoreCase("delivery@test.dev")).thenReturn(Optional.of(delivery));
    when(orderRepository.findById("ord_1")).thenReturn(Optional.of(order));

    Map<String, Object> result = adminApiService.assignDelivery("ord_1", "delivery@test.dev");

    assertThat(result).containsEntry("assigned", true).containsEntry("orderId", "ord_1");
    verify(orderRepository).save(order);
    assertThat(order.getAssignedDeliveryAdminEmail()).isEqualTo("delivery@test.dev");
    assertThat(order.getAssignedDeliveryAt()).isNotNull();
  }

  @Test
  void listDeliveryOrdersForCurrentFiltersByAuthenticatedAdmin() {
    SecurityContextHolder
        .getContext()
        .setAuthentication(
            new UsernamePasswordAuthenticationToken(
                "delivery@test.dev",
                "n/a",
                List.of(new SimpleGrantedAuthority("ROLE_DELIVERY"))));
    when(orderService.listAllAdmin())
        .thenReturn(
            List.of(
                Map.of("id", "ord_1", "assignedDeliveryAdminEmail", "delivery@test.dev"),
                Map.of("id", "ord_2", "assignedDeliveryAdminEmail", "other@test.dev")));

    List<Map<String, Object>> rows = adminApiService.listDeliveryOrdersForCurrent();

    assertThat(rows).hasSize(1);
    assertThat(rows.get(0)).containsEntry("id", "ord_1");
  }

  @Test
  void setEmployeeAvailabilityRejectsInvalidValue() {
    assertThatThrownBy(() -> adminApiService.setEmployeeAvailability("+911234567890", "online"))
        .isInstanceOf(ApiException.class)
        .satisfies(
            ex -> {
              ApiException ae = (ApiException) ex;
              assertThat(ae.status()).isEqualTo(HttpStatus.BAD_REQUEST);
              assertThat(ae.code()).isEqualTo("VALIDATION_ERROR");
            });
  }

  @Test
  void setEmployeeAvailabilityUpdatesEmployee() {
    AdminUser employee = new AdminUser();
    employee.setPhoneE164("+911234567890");
    employee.setRole("delivery");
    employee.setEmail("emp@test.dev");
    when(adminUserRepository.findByPhoneE164("+911234567890")).thenReturn(Optional.of(employee));

    Map<String, Object> result = adminApiService.setEmployeeAvailability("+911234567890", "free");

    assertThat(result).containsKey("employee");
    assertThat(employee.getAvailabilityStatus()).isEqualTo("free");
    verify(adminUserRepository).save(employee);
  }
}
