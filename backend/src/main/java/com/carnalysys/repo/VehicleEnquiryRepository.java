package com.carnalysys.repo;

import com.carnalysys.domain.VehicleEnquiry;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;

public interface VehicleEnquiryRepository extends JpaRepository<VehicleEnquiry, UUID> {}
