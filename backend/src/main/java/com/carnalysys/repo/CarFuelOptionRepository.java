package com.carnalysys.repo;

import com.carnalysys.domain.CarFuelOption;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface CarFuelOptionRepository extends JpaRepository<CarFuelOption, Long> {

  List<CarFuelOption> findAllByOrderBySortOrderAscLabelAsc();

  Optional<CarFuelOption> findByLabelIgnoreCase(String label);
}
