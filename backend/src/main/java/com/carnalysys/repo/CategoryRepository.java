package com.carnalysys.repo;

import com.carnalysys.domain.Category;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

public interface CategoryRepository extends JpaRepository<Category, String> {
  List<Category> findByDeletedAtIsNull();

  @Query("select c from Category c where c.deletedAt is null")
  List<Category> findAllActive();
}
