package com.carnalysys.repo;

import com.carnalysys.domain.WishlistItem;
import com.carnalysys.domain.WishlistItem.WishlistItemId;
import java.util.List;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;

public interface WishlistItemRepository extends JpaRepository<WishlistItem, WishlistItemId> {

  List<WishlistItem> findByUserId(UUID userId);

  boolean existsByUserIdAndProductId(UUID userId, String productId);

  void deleteByUserIdAndProductId(UUID userId, String productId);
}
