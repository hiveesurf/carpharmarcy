package com.carnalysys.repo;

import com.carnalysys.domain.OrderLine;
import java.util.List;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

public interface OrderLineRepository extends JpaRepository<OrderLine, UUID> {

  List<OrderLine> findByOrder_Id(String orderId);

  @Query(
      value =
          """
          SELECT p.category_slug, COALESCE(SUM(ol.line_total_inr), 0)
          FROM order_lines ol
          INNER JOIN products p ON p.id = ol.product_id
          INNER JOIN orders o ON o.id = ol.order_id
          WHERE o.status::text NOT IN ('draft', 'cancelled', 'refunded')
          GROUP BY p.category_slug
          """,
      nativeQuery = true)
  List<Object[]> sumLineTotalsInrByCategorySlug();

  @Query(
      value =
          """
          SELECT ol.product_id, COALESCE(SUM(ol.quantity), 0), COALESCE(SUM(ol.line_total_inr), 0)
          FROM order_lines ol
          INNER JOIN orders o ON o.id = ol.order_id
          WHERE o.status::text NOT IN ('draft', 'cancelled', 'refunded')
          GROUP BY ol.product_id
          """,
      nativeQuery = true)
  List<Object[]> sumSoldAndRevenueByProductId();
}
