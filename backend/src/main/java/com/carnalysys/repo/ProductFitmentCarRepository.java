package com.carnalysys.repo;

import com.carnalysys.domain.ProductFitmentCar;
import com.carnalysys.domain.ProductFitmentCar.ProductFitmentCarId;
import java.util.Collection;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;

public interface ProductFitmentCarRepository extends JpaRepository<ProductFitmentCar, ProductFitmentCarId> {
  List<ProductFitmentCar> findByProductIdIn(Collection<String> productIds);

  List<ProductFitmentCar> findByCarId(String carId);

  void deleteByProductId(String productId);
}
