package com.carnalysys.repo;

import com.carnalysys.domain.ProductVehicleSpec;
import java.util.Collection;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;

public interface ProductVehicleSpecRepository extends JpaRepository<ProductVehicleSpec, String> {

  List<ProductVehicleSpec> findByProductIdIn(Collection<String> productIds);
}
