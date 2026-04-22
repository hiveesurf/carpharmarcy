package com.carnalysys.repo;

import com.carnalysys.domain.OrderStatusAuditEntity;
import java.util.List;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

public interface OrderStatusAuditRepository extends JpaRepository<OrderStatusAuditEntity, UUID> {
  List<OrderStatusAuditEntity> findByOrder_IdOrderByCreatedAtAsc(String orderId);

  @Query(
      value =
          """
          WITH sales_orders AS (
            SELECT DISTINCT changed_by_id, order_id
            FROM order_status_audit
            WHERE changed_by_type = 'admin' AND changed_by_id IS NOT NULL
          )
          SELECT so.changed_by_id, COUNT(DISTINCT so.order_id), COALESCE(SUM(ol.quantity), 0)
          FROM sales_orders so
          LEFT JOIN order_lines ol ON ol.order_id = so.order_id
          GROUP BY so.changed_by_id
          """,
      nativeQuery = true)
  List<Object[]> salesOrderAndUnitsByAdminEmail();
}
