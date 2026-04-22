package com.carnalysys.repo;

import com.carnalysys.domain.SellerLead;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;

public interface SellerLeadRepository extends JpaRepository<SellerLead, UUID> {}
