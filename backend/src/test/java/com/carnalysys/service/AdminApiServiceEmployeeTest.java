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
import com.carnalysys.domain.UserEntity;
import com.carnalysys.repo.AddressRepository;
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
import com.fasterxml.jackson.databind.ObjectMapper;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;

@ExtendWith(MockitoExtension.class)
class AdminApiServiceEmployeeTest {

  @Mock private AdminUserRepository adminUserRepository;
  @Mock private UserRepository userRepository;
  @Mock private UserProfileRepository userProfileRepository;
  @Mock private AddressRepository addressRepository;
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

  @BeforeEach
  void asSuperAdmin() {
    SecurityContextHolder
        .getContext()
        .setAuthentication(
            new UsernamePasswordAuthenticationToken(
                "550e8400-e29b-41d4-a716-446655440099",
                "n/a",
                List.of(new SimpleGrantedAuthority("ROLE_SUPER_ADMIN"))));
  }

  @Test
  void createEmployeePersistsSalesWorkforceRow() {
    when(adminUserRepository.findByPhoneE164("9876543210")).thenReturn(Optional.empty());
    when(adminUserRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));

    Map<String, Object> result =
        adminApiService.createEmployee(
            Map.of("phone", "9876543210", "role", "sales", "name", "Agent One"));

    ArgumentCaptor<AdminUser> captor = ArgumentCaptor.forClass(AdminUser.class);
    verify(adminUserRepository).save(captor.capture());
    assertThat(captor.getValue().getRole()).isEqualTo("sales");
    assertThat(captor.getValue().getEmail()).isEqualTo("emp_9876543210@carnalysys.local");
    assertThat(result).containsKey("employee");
  }

  @Test
  void updateEmployeeChangesFieldsAndReassignsOrdersWhenEmailChanges() {
    AdminUser existing = new AdminUser();
    existing.setPhoneE164("9876543210");
    existing.setEmail("emp_9876543210@carnalysys.local");
    existing.setRole("delivery");
    existing.setFullName("Old Name");
    when(adminUserRepository.findByPhoneE164("9876543210")).thenReturn(Optional.of(existing));
    when(adminUserRepository.findByPhoneE164("9123456789")).thenReturn(Optional.empty());
    when(adminUserRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));
    OrderEntity order = new OrderEntity();
    order.setId("ord_1");
    when(orderRepository.findByAssignedDeliveryAdminEmailIgnoreCase("emp_9876543210@carnalysys.local"))
        .thenReturn(List.of(order));

    adminApiService.updateEmployee(
        "9876543210",
        Map.of("phone", "9123456789", "role", "delivery", "name", "New Name"));

    assertThat(existing.getPhoneE164()).isEqualTo("9123456789");
    assertThat(existing.getEmail()).isEqualTo("emp_9123456789@carnalysys.local");
    assertThat(existing.getFullName()).isEqualTo("New Name");
    assertThat(order.getAssignedDeliveryAdminEmail()).isEqualTo("emp_9123456789@carnalysys.local");
  }

  @Test
  void deleteEmployeeHardDeletesAndClearsAssignments() {
    AdminUser employee = new AdminUser();
    employee.setPhoneE164("9876543210");
    employee.setEmail("emp_9876543210@carnalysys.local");
    employee.setRole("delivery");
    when(adminUserRepository.findByPhoneE164("9876543210")).thenReturn(Optional.of(employee));
    stubCurrentSuperAdmin("8888888888");
    OrderEntity order = new OrderEntity();
    order.setId("ord_1");
    order.setAssignedDeliveryAdminEmail("emp_9876543210@carnalysys.local");
    when(orderRepository.findByAssignedDeliveryAdminEmailIgnoreCase("emp_9876543210@carnalysys.local"))
        .thenReturn(List.of(order));

    adminApiService.deleteEmployee("9876543210");

    verify(adminUserRepository).delete(employee);
    assertThat(order.getAssignedDeliveryAdminEmail()).isNull();
    verify(adminUserRepository, never()).save(employee);
  }

  @Test
  void deleteEmployeeRejectsSelfDelete() {
    AdminUser employee = new AdminUser();
    employee.setPhoneE164("9876543210");
    employee.setRole("delivery");
    AdminUser superAdmin = new AdminUser();
    superAdmin.setPhoneE164("9876543210");
    superAdmin.setRole("super_admin");
    when(adminUserRepository.findByPhoneE164("9876543210"))
        .thenReturn(Optional.of(employee), Optional.of(superAdmin));
    stubCurrentSuperAdminUserOnly("9876543210");

    assertThatThrownBy(() -> adminApiService.deleteEmployee("9876543210"))
        .isInstanceOf(ApiException.class)
        .satisfies(
            ex -> assertThat(((ApiException) ex).status()).isEqualTo(HttpStatus.BAD_REQUEST));

    verify(adminUserRepository, never()).delete(any());
  }

  @Test
  void createEmployeeForbiddenForSalesPrincipal() {
    SecurityContextHolder
        .getContext()
        .setAuthentication(
            new UsernamePasswordAuthenticationToken(
                "user",
                "n/a",
                List.of(new SimpleGrantedAuthority("ROLE_SALES"))));

    assertThatThrownBy(
            () ->
                adminApiService.createEmployee(
                    Map.of("phone", "9876543210", "role", "sales", "name", "Agent")))
        .isInstanceOf(ApiException.class)
        .satisfies(ex -> assertThat(((ApiException) ex).status()).isEqualTo(HttpStatus.FORBIDDEN));

    verify(adminUserRepository, never()).save(any());
  }

  @Test
  void listEmployeesPageUsesWorkforceRolesOnly() {
    AdminUser sales = new AdminUser();
    sales.setRole("sales");
    sales.setPhoneE164("9111111111");
    Page<AdminUser> page = new PageImpl<>(List.of(sales));
    when(adminUserRepository.findByRoleIn(eq(List.of("sales", "delivery")), any(Pageable.class)))
        .thenReturn(page);

    Map<String, Object> result = adminApiService.listEmployeesPage(0, 5);

    assertThat(result.get("items")).asList().hasSize(1);
    verify(adminUserRepository).findByRoleIn(eq(List.of("sales", "delivery")), any(Pageable.class));
    verify(adminUserRepository, never()).findAll(any(Pageable.class));
  }

  @Test
  void createEmployeeRejectsDuplicatePhone() {
    when(adminUserRepository.findByPhoneE164("9876543210"))
        .thenReturn(Optional.of(new AdminUser()));

    assertThatThrownBy(
            () ->
                adminApiService.createEmployee(
                    Map.of("phone", "9876543210", "role", "sales", "name", "Agent")))
        .isInstanceOf(ApiException.class)
        .satisfies(
            ex ->
                assertThat(((ApiException) ex).getMessage()).contains("Employee already exists"));

    verify(adminUserRepository, never()).save(any());
  }

  @Test
  void createEmployeeRejectsSuperAdminRole() {
    assertThatThrownBy(
            () ->
                adminApiService.createEmployee(
                    Map.of("phone", "9876543210", "role", "super_admin", "name", "Bad")))
        .isInstanceOf(ApiException.class);

    verify(adminUserRepository, never()).save(any());
  }

  private void stubCurrentSuperAdminUserOnly(String phone) {
    UUID uid = UUID.fromString("550e8400-e29b-41d4-a716-446655440099");
    UserEntity user = new UserEntity();
    user.setId(uid);
    user.setPhoneE164(phone);
    when(userRepository.findById(uid)).thenReturn(Optional.of(user));
  }

  private void stubCurrentSuperAdmin(String phone) {
    AdminUser admin = new AdminUser();
    admin.setPhoneE164(phone);
    admin.setRole("super_admin");
    stubCurrentSuperAdminUserOnly(phone);
    when(adminUserRepository.findByPhoneE164(phone)).thenReturn(Optional.of(admin));
  }
}
