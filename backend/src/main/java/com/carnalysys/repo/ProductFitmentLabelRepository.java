package com.carnalysys.repo;

import com.carnalysys.domain.ProductFitmentLabel;
import com.carnalysys.domain.ProductFitmentLabel.ProductFitmentLabelId;
import java.util.Collection;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;

public interface ProductFitmentLabelRepository
    extends JpaRepository<ProductFitmentLabel, ProductFitmentLabelId> {

  List<ProductFitmentLabel> findByProductIdIn(Collection<String> productIds);

  void deleteByProductId(String productId);
}
