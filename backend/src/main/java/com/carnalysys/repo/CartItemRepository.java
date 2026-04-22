package com.carnalysys.repo;

import com.carnalysys.domain.CartItem;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;

public interface CartItemRepository extends JpaRepository<CartItem, UUID> {

  List<CartItem> findByCart_IdAndDeletedAtIsNull(UUID cartId);

  Optional<CartItem> findByCart_IdAndProduct_IdAndDeletedAtIsNull(UUID cartId, String productId);
}
