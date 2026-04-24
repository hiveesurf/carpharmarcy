package com.carnalysys.repo;

import com.carnalysys.domain.Product;
import com.carnalysys.domain.ProductType;
import java.util.Collection;
import java.util.List;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;
import jakarta.persistence.LockModeType;

public interface ProductRepository extends JpaRepository<Product, String>, JpaSpecificationExecutor<Product> {

  @Query("select distinct p from Product p join fetch p.category")
  List<Product> findAllWithCategory();

  List<Product> findByPublishedTrueAndDeletedAtIsNull();

  List<Product> findByPublishedTrueAndTypeAndDeletedAtIsNull(ProductType type);

  List<Product> findByPublishedTrueAndCategorySlugAndDeletedAtIsNull(String categorySlug);

  @Query("select p from Product p where p.deletedAt is null")
  List<Product> findAllActive();

  @Lock(LockModeType.PESSIMISTIC_WRITE)
  @Query("select p from Product p where p.id in :ids")
  List<Product> findAllByIdInForUpdate(List<String> ids);

  List<Product> findBySkuInAndDeletedAtIsNull(Collection<String> skus);
}
