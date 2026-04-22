package com.carnalysys.repo;

import com.carnalysys.domain.GuestSession;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;

public interface GuestSessionRepository extends JpaRepository<GuestSession, UUID> {}
