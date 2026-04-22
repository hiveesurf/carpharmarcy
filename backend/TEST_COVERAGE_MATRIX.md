# Backend Test Coverage Matrix

This matrix tracks API and core service test coverage for the backend module.

## API Controllers (`/api/v1`)

| Controller | Endpoint Group | Test File | Status |
|---|---|---|---|
| `AuthV1Controller` | `me`, `send-otp`, `verify-otp`, `refresh-token`, `logout` | `src/test/java/com/carnalysys/web/v1/AuthV1ControllerWebMvcTest.java` | Covered |
| `AdminV1Controller` | auth, dashboard, products, categories, orders, users | `src/test/java/com/carnalysys/web/v1/AdminV1ControllerWebMvcTest.java` | Covered |
| `AdminV1Controller` | cars, employees, delivery assignment, product audit, delivery orders | `src/test/java/com/carnalysys/web/v1/AdminV1ControllerWebMvcTest.java` | Added in this change |
| `CatalogV1Controller` | products list/detail, categories | `src/test/java/com/carnalysys/web/v1/CatalogV1ControllerWebMvcTest.java` | Covered |
| `CartV1Controller` | get/add/update/remove cart lines | `src/test/java/com/carnalysys/web/v1/CartV1ControllerWebMvcTest.java` | Covered |
| `OrderV1Controller` | place/list/get orders | `src/test/java/com/carnalysys/web/v1/OrderV1ControllerWebMvcTest.java` | Covered |
| `UserV1Controller` | profile read/update, avatar upload | `src/test/java/com/carnalysys/web/v1/UserV1ControllerWebMvcTest.java` | Covered |
| `AddressV1Controller` | CRUD addresses | `src/test/java/com/carnalysys/web/v1/AddressV1ControllerWebMvcTest.java` | Covered |
| `WishlistV1Controller` | list/toggle wishlist | `src/test/java/com/carnalysys/web/v1/WishlistV1ControllerWebMvcTest.java` | Covered |
| `PaymentV1Controller` | initiate, confirm, webhook endpoints | `src/test/java/com/carnalysys/web/v1/PaymentV1ControllerWebMvcTest.java` | Covered |
| `MiscV1Controller` | vehicle search, lead/enquiry | `src/test/java/com/carnalysys/web/v1/MiscV1ControllerWebMvcTest.java` | Covered |
| `HealthV1Controller` | health endpoint | `src/test/java/com/carnalysys/web/v1/HealthV1ControllerWebMvcTest.java` | Covered |
| `PublicAvatarV1Controller` | public avatar endpoint | `src/test/java/com/carnalysys/web/v1/PublicAvatarV1ControllerWebMvcTest.java` | Covered |

## Core Services

| Service | Test File | Focus | Status |
|---|---|---|---|
| `OrderService` | `src/test/java/com/carnalysys/service/OrderServiceTest.java` | place order + status transitions | Covered |
| `PaymentWebhookService` | `src/test/java/com/carnalysys/service/PaymentWebhookServiceTest.java` | signature + replay logic | Covered |
| `RazorpayPaymentService` | `src/test/java/com/carnalysys/service/RazorpayPaymentServiceTest.java` | checkout signature verification | Added in this change |
| `AuthService` | `src/test/java/com/carnalysys/service/AuthServiceTest.java` | OTP and token refresh/logout behavior | Added in this change |
| `CatalogService` | `src/test/java/com/carnalysys/service/CatalogServiceTest.java` | pagination/filter output + public product lookup | Added in this change |
| `AdminApiService` | `src/test/java/com/carnalysys/service/AdminApiServiceTest.java` | validation and role-specific admin actions | Added in this change |

## Payment Lifecycle Checklist (Razorpay)

- `POST /api/v1/orders` with non-COD method creates order with `payment_status=pending`.
- `POST /api/v1/payments/initiate` creates `payment_transactions` row (`status=created`) before provider checkout.
- Provider order id is stored in both `payment_transactions.provider_order_id` and `orders.payment_order_ref`.
- `POST /api/v1/payments/confirm` or webhook updates transaction (`authorized/paid/failed`) and order summary atomically.
- `payment_events` rows contain `order_id` and `transaction_id` so every state change is traceable per attempt.
- Duplicate webhook event id is ignored (`uq_payment_events_provider_event`), preventing double updates.
