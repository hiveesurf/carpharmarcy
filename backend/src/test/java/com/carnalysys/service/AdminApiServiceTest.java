package com.carnalysys.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.carnalysys.api.ApiException;
import com.carnalysys.domain.AdminUser;
import com.carnalysys.domain.OrderEntity;
import com.carnalysys.domain.OrderStatus;
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
import java.time.Instant;
import java.util.Arrays;
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
  @Mock private NotificationService notificationService;
  @Mock private ProductExcelParser productExcelParser;

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
    OrderEntity existingOrder = new OrderEntity();
    existingOrder.setId("ord_1");
    when(orderRepository.findById("ord_1")).thenReturn(Optional.of(existingOrder));

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
    AdminUser deliveryAdmin = new AdminUser();
    deliveryAdmin.setEmail("delivery@test.dev");
    deliveryAdmin.setRole("delivery");
    when(adminUserRepository.findByEmailIgnoreCase("delivery@test.dev")).thenReturn(Optional.of(deliveryAdmin));

    OrderEntity ord = new OrderEntity();
    ord.setId("ord_1");
    ord.setStatus(OrderStatus.delivered);
    ord.setUpdatedAt(Instant.parse("2026-05-10T12:00:00Z"));
    when(orderRepository.findByAssignedDeliveryAdminEmailIgnoreCaseAndStatusInOrderByUpdatedAtDesc(
            eq("delivery@test.dev"),
            eq(
                Arrays.asList(
                    OrderStatus.placed,
                    OrderStatus.confirmed,
                    OrderStatus.processing,
                    OrderStatus.shipped,
                    OrderStatus.delivered))))
        .thenReturn(List.of(ord));
    when(orderLineRepository.findByOrder_Id("ord_1")).thenReturn(List.of());
    when(orderService.toDeliveryPartnerOrderMap(eq(ord), any()))
        .thenReturn(Map.of("id", "ord_1", "status", "delivered"));

    List<Map<String, Object>> rows = adminApiService.listDeliveryOrdersForCurrent(null, null, null);

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
    when(adminUserRepository.findByPhoneE164("1234567890")).thenReturn(Optional.of(employee));

    Map<String, Object> result = adminApiService.setEmployeeAvailability("+911234567890", "free");

    assertThat(result).containsKey("employee");
    assertThat(employee.getAvailabilityStatus()).isEqualTo("free");
    verify(adminUserRepository).save(employee);
  }

  @Test
  void patchOrderStatusUsesDeliveryPathWhenAdminRoleIsDelivery() {
    SecurityContextHolder
        .getContext()
        .setAuthentication(
            new UsernamePasswordAuthenticationToken(
                "dp@test.dev",
                "n/a",
                List.of(new SimpleGrantedAuthority("ROLE_DELIVERY"))));
    AdminUser delivery = new AdminUser();
    delivery.setEmail("dp@test.dev");
    delivery.setRole("delivery");
    when(adminUserRepository.findByEmailIgnoreCase("dp@test.dev")).thenReturn(Optional.of(delivery));
    when(orderService.patchStatusAsDeliveryPartner("ord_1", "delivered", "dp@test.dev"))
        .thenReturn(Map.of("order", Map.of("id", "ord_1", "status", "delivered")));

    Map<String, Object> result = adminApiService.patchOrderStatus("ord_1", "delivered");

    assertThat(result).containsKey("order");
    verify(orderService).patchStatusAsDeliveryPartner(eq("ord_1"), eq("delivered"), eq("dp@test.dev"));
    verify(orderService, never()).patchStatusAdmin(any(), any());
  }

  @Test
  void patchOrderStatusUsesAdminPathWhenRoleIsSuperAdmin() {
    SecurityContextHolder
        .getContext()
        .setAuthentication(
            new UsernamePasswordAuthenticationToken(
                "sa@test.dev",
                "n/a",
                List.of(new SimpleGrantedAuthority("ROLE_SUPER_ADMIN"))));
    AdminUser admin = new AdminUser();
    admin.setEmail("sa@test.dev");
    admin.setRole("super_admin");
    when(adminUserRepository.findByEmailIgnoreCase("sa@test.dev")).thenReturn(Optional.of(admin));
    when(orderService.patchStatusAdmin("ord_1", "shipped")).thenReturn(Map.of("order", Map.of("id", "ord_1")));

    Map<String, Object> result = adminApiService.patchOrderStatus("ord_1", "shipped");

    assertThat(result).containsKey("order");
    verify(orderService).patchStatusAdmin("ord_1", "shipped");
    verify(orderService, never()).patchStatusAsDeliveryPartner(any(), any(), any());
  }
}
