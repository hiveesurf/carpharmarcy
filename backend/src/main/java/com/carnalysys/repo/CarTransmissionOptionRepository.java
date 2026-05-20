package com.carnalysys.repo;

import com.carnalysys.domain.CarTransmissionOption;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface CarTransmissionOptionRepository extends JpaRepository<CarTransmissionOption, Long> {

  List<CarTransmissionOption> findAllByOrderBySortOrderAscLabelAsc();

  Optional<CarTransmissionOption> findByLabelIgnoreCase(String label);
}
