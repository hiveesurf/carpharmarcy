package com.carnalysys.repo;

import com.carnalysys.domain.CarModelEntity;
import java.util.List;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

public interface CarModelRepository extends JpaRepository<CarModelEntity, String> {
  List<CarModelEntity> findByPublishedTrueOrderByMakeAscModelAscModelYearDesc();

  List<CarModelEntity> findByMakeIgnoreCaseOrderByMakeAscModelAscModelYearDesc(String make);

  List<CarModelEntity> findByPublishedTrueAndMakeIgnoreCaseOrderByMakeAscModelAscModelYearDesc(
      String make);

  Page<CarModelEntity> findByMakeIgnoreCase(String make, Pageable pageable);

  List<CarModelEntity> findByDeletedAtIsNullOrderByMakeAscModelAscModelYearDesc();

  List<CarModelEntity> findByPublishedTrueAndDeletedAtIsNullOrderByMakeAscModelAscModelYearDesc();

  List<CarModelEntity> findByMakeIgnoreCaseAndDeletedAtIsNullOrderByMakeAscModelAscModelYearDesc(
      String make);

  List<CarModelEntity>
      findByPublishedTrueAndMakeIgnoreCaseAndDeletedAtIsNullOrderByMakeAscModelAscModelYearDesc(
          String make);

  Page<CarModelEntity> findByMakeIgnoreCaseAndDeletedAtIsNull(String make, Pageable pageable);

  Page<CarModelEntity> findByDeletedAtIsNull(Pageable pageable);
}
