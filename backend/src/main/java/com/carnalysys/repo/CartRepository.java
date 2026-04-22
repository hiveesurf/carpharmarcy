package com.carnalysys.repo;

import com.carnalysys.domain.Cart;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;

public interface CartRepository extends JpaRepository<Cart, UUID> {

  Optional<Cart> findByUser_Id(UUID userId);

  Optional<Cart> findByGuestSession_Id(UUID guestSessionId);
}
