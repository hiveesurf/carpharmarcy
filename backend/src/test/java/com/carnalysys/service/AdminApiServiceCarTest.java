package com.carnalysys.service;



import static org.assertj.core.api.Assertions.assertThat;

import static org.assertj.core.api.Assertions.assertThatThrownBy;

import static org.mockito.ArgumentMatchers.any;

import static org.mockito.ArgumentMatchers.eq;

import static org.mockito.ArgumentMatchers.isNull;

import static org.mockito.Mockito.lenient;

import static org.mockito.Mockito.never;

import static org.mockito.Mockito.verify;

import static org.mockito.Mockito.when;



import com.carnalysys.api.ApiException;

import com.carnalysys.domain.CarFuelOption;
import com.carnalysys.domain.CarModelEntity;
import com.carnalysys.domain.CarTransmissionOption;
import com.carnalysys.repo.AdminUserRepository;
import com.carnalysys.repo.AddressRepository;
import com.carnalysys.repo.CarFuelOptionRepository;
import com.carnalysys.repo.CarModelRepository;
import com.carnalysys.repo.CarTransmissionOptionRepository;

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

import java.util.LinkedHashMap;

import java.util.Map;

import java.util.Optional;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import org.junit.jupiter.api.extension.ExtendWith;

import org.mockito.ArgumentCaptor;

import org.mockito.InjectMocks;

import org.mockito.Mock;

import org.mockito.junit.jupiter.MockitoExtension;

import org.springframework.http.HttpStatus;



@ExtendWith(MockitoExtension.class)

class AdminApiServiceCarTest {



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

  @Mock private CarFuelOptionRepository carFuelOptionRepository;

  @Mock private CarTransmissionOptionRepository carTransmissionOptionRepository;

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

  @BeforeEach
  void stubCarFuelAndTransmissionCatalog() {
    lenient()
        .when(carFuelOptionRepository.findByLabelIgnoreCase(any()))
        .thenAnswer(
            inv -> {
              String l = inv.getArgument(0, String.class);
              CarFuelOption o = new CarFuelOption();
              o.setLabel(l);
              return Optional.of(o);
            });
    lenient()
        .when(carTransmissionOptionRepository.findByLabelIgnoreCase(any()))
        .thenAnswer(
            inv -> {
              String l = inv.getArgument(0, String.class);
              CarTransmissionOption o = new CarTransmissionOption();
              o.setLabel(l);
              return Optional.of(o);
            });
  }



  @Test

  void createCarAllowsSameMakeDifferentVariantAndFuel() {

    when(carModelRepository.findIdentityMatch(

            eq("audi"), eq("a4"), eq((short) 2022), eq("premium"), eq("petrol"), isNull()))

        .thenReturn(Optional.empty());

    when(carModelRepository.findById("audi-a4-2022-premium-petrol")).thenReturn(Optional.empty());

    when(carModelRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));



    Map<String, Object> body = new LinkedHashMap<>();

    body.put("make", "Audi");

    body.put("model", "A4");

    body.put("modelYear", 2022);

    body.put("variant", "Premium");

    body.put("fuel", "Petrol");



    adminApiService.createCar(body);



    ArgumentCaptor<CarModelEntity> captor = ArgumentCaptor.forClass(CarModelEntity.class);

    verify(carModelRepository).save(captor.capture());

    assertThat(captor.getValue().getId()).isEqualTo("audi-a4-2022-premium-petrol");

    assertThat(captor.getValue().getVariant()).isEqualTo("Premium");

    assertThat(captor.getValue().getFuel()).isEqualTo("Petrol");

  }



  @Test

  void createCarRejectsCaseInsensitiveDuplicateIdentity() {

    CarModelEntity existing = new CarModelEntity();

    existing.setId("audi-a4-2022-premium-petrol");

    when(carModelRepository.findIdentityMatch(

            eq("audi"), eq("a4"), eq((short) 2022), eq("premium"), eq("petrol"), isNull()))

        .thenReturn(Optional.of(existing));



    Map<String, Object> body =

        Map.of(

            "make", "AUDI",

            "model", "a4",

            "modelYear", 2022,

            "variant", "Premium",

            "fuel", "Petrol");



    assertThatThrownBy(() -> adminApiService.createCar(body))

        .isInstanceOf(ApiException.class)

        .satisfies(

            ex -> {

              ApiException ae = (ApiException) ex;

              assertThat(ae.status()).isEqualTo(HttpStatus.BAD_REQUEST);

              assertThat(ae.getMessage()).contains("make, model, year, variant, and fuel");

            });



    verify(carModelRepository, never()).save(any());

  }



  @Test

  void createCarRejectsExtraSpacesDuplicateIdentity() {

    when(carModelRepository.findIdentityMatch(

            eq("audi"), eq("a4"), eq((short) 2022), eq("premium"), eq("petrol"), isNull()))

        .thenReturn(Optional.of(new CarModelEntity()));



    Map<String, Object> body =

        Map.of(

            "make", "  Audi  ",

            "model", "A4   ",

            "modelYear", 2022,

            "variant", "  Premium",

            "fuel", "Petrol  ");



    assertThatThrownBy(() -> adminApiService.createCar(body)).isInstanceOf(ApiException.class);



    verify(carModelRepository, never()).save(any());

  }



  @Test

  void updateCarChangesOnlySelectedRowAndRejectsDuplicateTarget() {

    CarModelEntity current = new CarModelEntity();

    current.setId("audi-a6-2023-diesel-technology");

    current.setMake("Audi");

    current.setModel("A6");

    current.setModelYear((short) 2023);

    current.setVariant("Technology");

    current.setFuel("Diesel");



    when(carModelRepository.findById("audi-a6-2023-diesel-technology")).thenReturn(Optional.of(current));

    when(carModelRepository.findIdentityMatch(

            eq("audi"), eq("a4"), eq((short) 2022), eq("premium"), eq("petrol"), eq("audi-a6-2023-diesel-technology")))

        .thenReturn(Optional.of(new CarModelEntity()));



    Map<String, Object> body =

        Map.of(

            "make", "Audi",

            "model", "A4",

            "modelYear", 2022,

            "variant", "Premium",

            "fuel", "Petrol");



    assertThatThrownBy(() -> adminApiService.updateCar("audi-a6-2023-diesel-technology", body))

        .isInstanceOf(ApiException.class);



    verify(carModelRepository, never()).save(any());

  }



  @Test

  void updateCarPersistsOnlySelectedRow() {

    CarModelEntity current = new CarModelEntity();

    current.setId("audi-a6-2023-diesel-technology");

    current.setMake("Audi");

    current.setModel("A6");

    current.setModelYear((short) 2023);

    current.setVariant("Technology");

    current.setFuel("Diesel");



    when(carModelRepository.findById("audi-a6-2023-diesel-technology")).thenReturn(Optional.of(current));

    when(carModelRepository.findIdentityMatch(

            eq("audi"), eq("a6"), eq((short) 2023), eq("sport"), eq("diesel"), eq("audi-a6-2023-diesel-technology")))

        .thenReturn(Optional.empty());

    when(carModelRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));



    Map<String, Object> body =

        Map.of(

            "make", "Audi",

            "model", "A6",

            "modelYear", 2023,

            "variant", "Sport",

            "fuel", "Diesel");



    adminApiService.updateCar("audi-a6-2023-diesel-technology", body);



    ArgumentCaptor<CarModelEntity> captor = ArgumentCaptor.forClass(CarModelEntity.class);

    verify(carModelRepository).save(captor.capture());

    assertThat(captor.getValue().getId()).isEqualTo("audi-a6-2023-diesel-technology");

    assertThat(captor.getValue().getVariant()).isEqualTo("Sport");

  }



  @Test
  void createCarAcceptsYear1970() {
    when(carModelRepository.findIdentityMatch(
            eq("audi"), eq("a4"), eq((short) 1970), eq("premium"), eq("petrol"), isNull()))
        .thenReturn(Optional.empty());
    when(carModelRepository.findById("audi-a4-1970-premium-petrol")).thenReturn(Optional.empty());
    when(carModelRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));

    Map<String, Object> body =
        Map.of(
            "make", "Audi",
            "model", "A4",
            "modelYear", 1970,
            "variant", "Premium",
            "fuel", "Petrol");

    adminApiService.createCar(body);

    ArgumentCaptor<CarModelEntity> captor = ArgumentCaptor.forClass(CarModelEntity.class);
    verify(carModelRepository).save(captor.capture());
    assertThat(captor.getValue().getModelYear()).isEqualTo((short) 1970);
  }

  @Test
  void createCarAcceptsYear2050() {
    when(carModelRepository.findIdentityMatch(
            eq("audi"), eq("a4"), eq((short) 2050), eq("premium"), eq("petrol"), isNull()))
        .thenReturn(Optional.empty());
    when(carModelRepository.findById("audi-a4-2050-premium-petrol")).thenReturn(Optional.empty());
    when(carModelRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));

    Map<String, Object> body =
        Map.of(
            "make", "Audi",
            "model", "A4",
            "modelYear", 2050,
            "variant", "Premium",
            "fuel", "Petrol");

    adminApiService.createCar(body);

    ArgumentCaptor<CarModelEntity> captor = ArgumentCaptor.forClass(CarModelEntity.class);
    verify(carModelRepository).save(captor.capture());
    assertThat(captor.getValue().getModelYear()).isEqualTo((short) 2050);
  }

  @Test
  void createCarRejectsYearZero() {
    Map<String, Object> body =
        Map.of(
            "make", "Audi",
            "model", "A4",
            "modelYear", 0,
            "variant", "Premium",
            "fuel", "Petrol");

    assertThatThrownBy(() -> adminApiService.createCar(body))
        .isInstanceOf(ApiException.class)
        .satisfies(
            ex ->
                assertThat(((ApiException) ex).getMessage())
                    .contains("positive whole number"));

    verify(carModelRepository, never()).save(any());
  }

  @Test
  void createCarRejectsNegativeYear() {
    Map<String, Object> body =
        Map.of(
            "make", "Audi",
            "model", "A4",
            "modelYear", -5,
            "variant", "Premium",
            "fuel", "Petrol");

    assertThatThrownBy(() -> adminApiService.createCar(body)).isInstanceOf(ApiException.class);

    verify(carModelRepository, never()).save(any());
  }

  @Test
  void createCarRejectsDecimalYear() {
    Map<String, Object> body = new LinkedHashMap<>();
    body.put("make", "Audi");
    body.put("model", "A4");
    body.put("modelYear", 2022.5);
    body.put("variant", "Premium");
    body.put("fuel", "Petrol");

    assertThatThrownBy(() -> adminApiService.createCar(body)).isInstanceOf(ApiException.class);

    verify(carModelRepository, never()).save(any());
  }

  @Test
  void createCarRejectsNonNumericYearString() {
    Map<String, Object> body =
        Map.of(
            "make", "Audi",
            "model", "A4",
            "modelYear", "abc",
            "variant", "Premium",
            "fuel", "Petrol");

    assertThatThrownBy(() -> adminApiService.createCar(body)).isInstanceOf(ApiException.class);

    verify(carModelRepository, never()).save(any());
  }

  @Test

  void deleteCarRemovesRowPermanently() {

    CarModelEntity current = new CarModelEntity();

    current.setId("audi-a4-2022-premium-petrol");

    when(carModelRepository.findById("audi-a4-2022-premium-petrol")).thenReturn(Optional.of(current));



    adminApiService.deleteCar("audi-a4-2022-premium-petrol");



    verify(carModelRepository).delete(current);

    verify(carModelRepository, never()).save(any());

  }

}

