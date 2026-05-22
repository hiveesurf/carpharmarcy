package com.carnalysys.repo;

import com.carnalysys.domain.ProductLowStockAlertState;
import org.springframework.data.jpa.repository.JpaRepository;

public interface ProductLowStockAlertStateRepository
    extends JpaRepository<ProductLowStockAlertState, String> {}
