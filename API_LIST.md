# API List

Environment/base URL resolution used by frontend:
- `src/api/client.js` `apiV1Base()`:
  - Uses `VITE_API_BASE` if set; appends `/api/v1` when missing.
  - In dev with no `VITE_API_BASE`, uses relative `/api/v1`.
- `vite.config.js`: dev proxy maps `/api` to `VITE_DEV_API_PROXY` (default `http://127.0.0.1:8080`).
- Env files found:
  - `.env.local`: `VITE_API_BASE=`, `VITE_DEV_API_PROXY=http://127.0.0.1:8080`
  - `.env.production`: `VITE_API_BASE=/api/v1`
  - `.env.uat`: `VITE_API_BASE=/api/v1`

Default frontend request headers/auth behavior (`src/api/client.js`):
- Always sends `X-Guest-Session`.
- Sends `Authorization: Bearer <token>` unless `skipAuth` is true.
- Sends cookies via `credentials: include`.
- Auto-refresh flow calls `POST /auth/refresh-token` on 401.

## 1) Auth APIs

| Module | API Name | Method | Endpoint | Source File | Payload Required | Auth Required | Notes |
|---|---|---|---|---|---|---|---|
| Auth | Send OTP | POST | `/api/v1/auth/send-otp` | Frontend: `src/api/authApi.js` (`sendOtp`) / Backend: `AuthV1Controller.sendOtp` | Body: `{ phone }` (digits normalized in service) | No (`skipAuth: true`) | Used by `src/services/authService.js` (`sendOtp`) |
| Auth | Verify OTP | POST | `/api/v1/auth/verify-otp` | Frontend: `src/api/authApi.js` (`verifyOtp`) / Backend: `AuthV1Controller.verifyOtp` | Body: `{ phone, otp }` | No (`skipAuth: true`) | Sets access token client-side; backend also sets refresh cookie |
| Auth | Current Session User | GET | `/api/v1/auth/me` | Frontend: `src/api/authApi.js` (`getSessionUser`) / Backend: `AuthV1Controller.me` | None | Yes (requires logged-in user) | Backend uses `AuthSupport.requireUser()` |
| Auth | Refresh Token | POST | `/api/v1/auth/refresh-token` | Frontend: `src/api/client.js` (`refreshSessionWithCookie`) / Backend: `AuthV1Controller.refresh` | Body often `{}`; optional `refreshToken` fallback | Cookie-based refresh token; no bearer required | Called automatically by API client retry logic |
| Auth | Logout | POST | `/api/v1/auth/logout` | Frontend: `src/api/authApi.js` (`logout`) / Backend: `AuthV1Controller.logout` | Optional `{ refreshToken }` | No (`skipAuth: true`) | Clears refresh cookie server-side |
| Auth/Notifications | User Notifications | GET | `/api/v1/auth/notifications` | Frontend: `src/api/notificationApi.js` / Backend: `AuthV1Controller.notifications` | Query: `cursor?`, `limit`, `unreadOnly` | Yes (requires logged-in user) | Used by `src/services/notificationService.js` |
| Auth/Notifications | Mark User Notifications Read | POST | `/api/v1/auth/notifications/read` | Frontend: `src/api/notificationApi.js` / Backend: `AuthV1Controller.markRead` | Body: `{ ids?: string[], all?: boolean }` | Yes | Used by `src/services/notificationService.js` |
| Auth/Notifications | Subscribe User Push | POST | `/api/v1/auth/notifications/push/subscribe` | Frontend: `src/api/notificationApi.js` / Backend: `AuthV1Controller.subscribePush` | Push subscription object (`endpoint`, `keys.p256dh`, `keys.auth`) | Yes | Used by `subscribeUserPush` service |
| Auth/Notifications | Unsubscribe User Push | POST | `/api/v1/auth/notifications/push/unsubscribe` | Frontend: `src/api/notificationApi.js` / Backend: `AuthV1Controller.unsubscribePush` | Body: `{ endpoint }` | Yes | Used by notification service |

## 2) Product APIs

| Module | API Name | Method | Endpoint | Source File | Payload Required | Auth Required | Notes |
|---|---|---|---|---|---|---|---|
| Catalog Product | List Products | GET | `/api/v1/products` | Frontend: `src/api/productApi.js` (`getProducts`) / Backend: `CatalogV1Controller.products` | Query: `type?`, `category?`, `search?`, `carModel?`, `carId?`, `sort?`, `page?`, `pageSize?` | No | Used by `src/services/productService.js` |
| Catalog Product | Get Product By Id | GET | `/api/v1/products/{id}` | Frontend: `src/api/productApi.js` (`getProductById`) / Backend: `CatalogV1Controller.product` | Path: `id` | No | Used by product detail via `productService.fetchProductById` |
| Admin Product | List Products (Admin) | GET | `/api/v1/admin/products` | Frontend: `src/api/adminApi.js` (`adminListProducts`) / Backend: `AdminV1Controller.products` | Query: `page?`, `pageSize?`, `sort?` | Yes (admin session/JWT role) | Used by `adminService.listProductsPage` |
| Admin Product | Get Product (Admin) | GET | `/api/v1/admin/products/{id}` | Frontend: `src/api/adminApi.js` (`adminGetProduct`) / Backend: `AdminV1Controller.getProduct` | Path: `id` | Yes (admin) | Used by edit drawer via `adminService.getProduct` |
| Admin Product | Create Product | POST | `/api/v1/admin/products` | Frontend: `src/api/adminApi.js` (`adminCreateProduct`) / Backend: `AdminV1Controller.createProduct` | Body map; observed fields include `type`, `category`, `sku`, `name`, `price`, `purchasePrice`, `totalStock`, `published`, `imageKey`, `description?`, `primaryImageUrl?`, `galleryExtras?`, `compatibleCarIds?`, `partNumber?`, `brand?`, `unitVolume?`, `supplierName?`, `metadata?` | Yes (admin; product routes allow `SUPER_ADMIN`/`SALES`) | Used by `AddProductPanel` through `adminService.createProduct` |
| Admin Product | Update Product | PUT | `/api/v1/admin/products/{id}` | Frontend: `src/api/adminApi.js` (`adminUpdateProduct`) / Backend: `AdminV1Controller.updateProduct` | Same shape as create; path `id` | Yes (admin; `SUPER_ADMIN`/`SALES`) | Used by `ProductEditDrawer` via `adminService.updateProduct` |
| Admin Product | Delete Product | DELETE | `/api/v1/admin/products/{id}` | Frontend: `src/api/adminApi.js` (`adminDeleteProduct`) / Backend: `AdminV1Controller.deleteProduct` | Path: `id` | Yes (admin; `SUPER_ADMIN`/`SALES`) | Used by admin product actions |
| Admin Product | Publish/Unpublish Product | PATCH | `/api/v1/admin/products/{id}/publish` | Frontend: `src/api/adminApi.js` (`adminPublishProduct`) / Backend: `AdminV1Controller.publish` | Body: `{ published }` | Yes (admin; `SUPER_ADMIN`/`SALES`) | Used by `ProductEditDrawer` quick toggle |
| Admin Product | Product Audit History | GET | `/api/v1/admin/products/{id}/audit` | Frontend: `src/api/adminApi.js` (`adminProductAudit`) / Backend: `AdminV1Controller.productAudit` | Path: `id` | Yes (admin; `SUPER_ADMIN`/`SALES`) | Used by edit drawer "Change history" |
| Admin Product | Bulk Import Products | POST | `/api/v1/admin/products/import-excel` | Frontend: `src/api/adminApi.js` + `src/api/uploadWithProgress.js` / Backend: `AdminV1Controller.importExcel` | Multipart: `file`; query `category?` | Yes (admin; `SUPER_ADMIN`/`SALES`) | XHR upload with progress |

## 3) Car APIs

| Module | API Name | Method | Endpoint | Source File | Payload Required | Auth Required | Notes |
|---|---|---|---|---|---|---|---|
| Vehicle Catalog | List Cars (legacy) | GET | `/api/v1/cars` | Frontend: `src/api/vehicle.js` (`fetchCars`) / Backend: `MiscV1Controller.cars` | None | No | Used by fitment UI services |
| Vehicle Fitment | Vehicle Brands | GET | `/api/v1/vehicle/brands` | Frontend: `src/api/vehicle.js` / Backend: `MiscV1Controller.brands` | None | No | Used by `fitmentService` |
| Vehicle Fitment | Vehicle Models | GET | `/api/v1/vehicle/models` | Frontend: `src/api/vehicle.js` / Backend: `MiscV1Controller.models` | Query: `brandId` (required) | No | Used by fitment flow |
| Vehicle Fitment | Vehicle Years | GET | `/api/v1/vehicle/years` | Frontend: `src/api/vehicle.js` / Backend: `MiscV1Controller.years` | None | No | Used by fitment flow |
| Vehicle Fitment | Vehicle Variants | GET | `/api/v1/vehicle/variants` | Frontend: `src/api/vehicle.js` / Backend: `MiscV1Controller.variants` | None | No | Used by fitment flow |
| Vehicle Search | Submit Vehicle Search | POST | `/api/v1/search/vehicle` | Frontend: `src/api/vehicle.js` (`submitVehicleSearch`) / Backend: `MiscV1Controller.searchVehicle` | Body: flexible filters map | No | Returns `{ accepted, filters, nextPath }` |
| Vehicle Enquiry | Submit Enquiry For Car | POST | `/api/v1/compat/vehicle-enquiry/{carId}` | Frontend: `src/api/carsApi.js` (`submitCarEnquiry`) / Backend: `MiscV1Controller.vehicleEnquiry` | Path: `carId`; body map (optional) | No (`skipAuth: true` in client) | Used by `vehicleEnquiryService` |
| Admin Car | List Cars (admin) | GET | `/api/v1/admin/cars` | Frontend: `src/api/adminApi.js` (`adminListCars`) / Backend: `AdminV1Controller.cars` | Query: `published?`, `brand?`, `page`, `size` | Yes (admin role) | Used by car admin screens |
| Admin Car | Get Car (admin) | GET | `/api/v1/admin/cars/{id}` | Frontend: `src/api/adminApi.js` / Backend: `AdminV1Controller.getCar` | Path: `id` | Yes (admin role) | Used by `adminService.getCar` |
| Admin Car | Create Car | POST | `/api/v1/admin/cars` | Frontend: `src/api/adminApi.js` / Backend: `AdminV1Controller.createCar` | Body map: Need to verify full schema | Yes (admin role) | Used by `adminService.createCar` |
| Admin Car | Update Car | PUT | `/api/v1/admin/cars/{id}` | Frontend: `src/api/adminApi.js` / Backend: `AdminV1Controller.updateCar` | Path: `id`; body map: Need to verify full schema | Yes (admin role) | Used by `adminService.updateCar` |
| Admin Car | Delete Car | DELETE | `/api/v1/admin/cars/{id}` | Frontend: `src/api/adminApi.js` / Backend: `AdminV1Controller.deleteCar` | Path: `id` | Yes (admin role) | Used by `adminService.removeCar` |

## 4) Category/Brand APIs

| Module | API Name | Method | Endpoint | Source File | Payload Required | Auth Required | Notes |
|---|---|---|---|---|---|---|---|
| Catalog Category | List Categories | GET | `/api/v1/categories` | Frontend: `src/api/categoryApi.js` / Backend: `CatalogV1Controller.categories` | None | No | Used by `categoryService.fetchCategories` |
| Admin Category | List Categories (page) | GET | `/api/v1/admin/categories` | Frontend: `src/api/adminApi.js` / Backend: `AdminV1Controller.categories` | Query: `page`, `size` | Yes (admin role) | Used by `adminService.listCategories*` |
| Admin Category | Category Overview | GET | `/api/v1/admin/categories/overview` | Frontend: `src/api/adminApi.js` / Backend: `AdminV1Controller.categoriesOverview` | None | Yes (admin role) | Used by admin category dashboard |
| Admin Category | Create Category | POST | `/api/v1/admin/categories` | Frontend: `src/api/adminApi.js` / Backend: `AdminV1Controller.createCategory` | Body: `{ name }` | Yes (admin role) | Used by `adminService.createCategory` |
| Admin Category | Update Category | PUT | `/api/v1/admin/categories/{id}` | Frontend: `src/api/adminApi.js` / Backend: `AdminV1Controller.updateCategory` | Path: `id`; body map | Yes (admin role) | Used by admin category edit |
| Admin Category | Delete Category | DELETE | `/api/v1/admin/categories/{id}` | Frontend: `src/api/adminApi.js` / Backend: `AdminV1Controller.deleteCategory` | Path: `id` | Yes (admin role) | Used by `adminService.removeCategory` |

## 5) Upload/Image APIs

| Module | API Name | Method | Endpoint | Source File | Payload Required | Auth Required | Notes |
|---|---|---|---|---|---|---|---|
| User Avatar | Upload Avatar | POST | `/api/v1/user/avatar` | Frontend: `src/api/userApi.js` (`postAvatar`) / Backend: `UserV1Controller.postAvatar` | Multipart form: `file` | Yes (logged-in user) | Uses direct `fetch`; includes bearer + `X-Guest-Session` |
| Public Image | Read Vehicle Upload Asset | GET | `/api/v1/public/uploads/vehicles/{partition}/{filename}` | Backend: `PublicUploadsV1Controller.vehicleAsset`; URL resolved in frontend libs | Path: `partition`, `filename` | No | Used for product/car image serving |
| Public Avatar | Read Avatar | GET | `/api/v1/public/avatars/{userId}` | Backend: `PublicAvatarV1Controller.avatar` | Path: `userId` (UUID) | No | Public avatar fetch URL |
| Admin Upload | Bulk Product Import Upload | POST | `/api/v1/admin/products/import-excel` | Frontend: `src/api/uploadWithProgress.js` + `adminApi.js` / Backend: `AdminV1Controller.importExcel` | Multipart `file`, query `category?` | Yes (admin role) | XHR + upload progress callback |

## 6) Admin/Dashboard APIs

| Module | API Name | Method | Endpoint | Source File | Payload Required | Auth Required | Notes |
|---|---|---|---|---|---|---|---|
| Admin Auth | Admin Login | POST | `/api/v1/admin/auth/login` | Frontend: `src/api/adminApi.js` / Backend: `AdminV1Controller.login` | Body: `{ email, password }` | No (`permitAll`) | Creates admin session cookie |
| Admin Auth | Admin Logout | POST | `/api/v1/admin/auth/logout` | Frontend: `src/api/adminApi.js` (indirect) / Backend: `AdminV1Controller.logout` | None | No (`permitAll`) | Clears admin session cookie |
| Admin Dashboard | Get Dashboard | GET | `/api/v1/admin/dashboard` | Frontend: `src/api/adminApi.js`; direct fetch in `src/components/auth/AdminRoute.jsx`; Backend: `AdminV1Controller.dashboard` | None | Yes (admin role) | Used to validate admin cookie session in `AdminRoute` |
| Admin Orders | List Orders | GET | `/api/v1/admin/orders` | Frontend: `src/api/adminApi.js` / Backend: `AdminV1Controller.orders` | Query: `phone?`, `page`, `size` | Yes (roles: `SUPER_ADMIN`/`SALES`/`DELIVERY`) | Used by `adminService.listOrders` |
| Admin Orders | Patch Order Status | PATCH | `/api/v1/admin/orders/{id}/status` | Frontend: `src/api/adminApi.js` / Backend: `AdminV1Controller.orderStatus` | Path: `id`; body: `{ status }` | Yes (admin order roles) | Used by `adminService.patchOrderStatus` |
| Admin Orders | Assign Delivery | PATCH | `/api/v1/admin/orders/{id}/assign-delivery` | Frontend: `src/api/adminApi.js` / Backend: `AdminV1Controller.assignDelivery` | Path: `id`; body: `{ deliveryAdminEmail }` | Yes (`SUPER_ADMIN` only per security matcher) | Used by `adminService.assignDelivery` |
| Admin Delivery | List Delivery Orders | GET | `/api/v1/admin/delivery/orders` | Frontend: `src/api/adminApi.js` / Backend: `AdminV1Controller.deliveryOrders` | None | Yes (admin role) | Used by `adminService.listDeliveryOrders` |
| Admin Users | List Users | GET | `/api/v1/admin/users` | Frontend: `src/api/adminApi.js` / Backend: `AdminV1Controller.users` | Query: `page`, `size` | Yes (admin role) | Used by `adminService.listUsers*` |
| Admin Users | Get User | GET | `/api/v1/admin/users/{id}` | Frontend: `src/api/adminApi.js` / Backend: `AdminV1Controller.user` | Path: `id` | Yes (admin role) | Used by `adminService.adminGetUser` flow |
| Admin Employees | List Employees | GET | `/api/v1/admin/employees` | Frontend: `src/api/adminApi.js` / Backend: `AdminV1Controller.employees` | Query: `page`, `size` | Yes (`SUPER_ADMIN` only) | Used by `adminService.listEmployees*` |
| Admin Employees | Create Employee | POST | `/api/v1/admin/employees` | Frontend: `src/api/adminApi.js` / Backend: `AdminV1Controller.createEmployee` | Body map: Need to verify exact schema | Yes (`SUPER_ADMIN` only) | Used by `adminService.createEmployee` |
| Admin Employees | Set Availability | PATCH | `/api/v1/admin/employees/{phone}/availability` | Frontend: `src/api/adminApi.js` / Backend: `AdminV1Controller.setAvailability` | Path: `phone`; body: `{ availability }` | Yes (`SUPER_ADMIN` only) | Used by `adminService.setEmployeeAvailability` |
| Admin Notifications | List Admin Notifications | GET | `/api/v1/admin/notifications` | Frontend: `src/api/notificationApi.js` / Backend: `AdminV1Controller.notifications` | Query: `cursor?`, `limit`, `unreadOnly` | Yes (admin role) | Used by `notificationService.listAdminNotifications` |
| Admin Notifications | Mark Admin Notifications Read | POST | `/api/v1/admin/notifications/read` | Frontend: `src/api/notificationApi.js` / Backend: `AdminV1Controller.markRead` | Body: `{ ids?: string[], all?: boolean }` | Yes (admin role) | Used by notification service |
| Admin Notifications | Subscribe Admin Push | POST | `/api/v1/admin/notifications/push/subscribe` | Frontend: `src/api/notificationApi.js` / Backend: `AdminV1Controller.subscribePush` | Push subscription object | Yes (admin role) | Used by `subscribeAdminPush` |
| Admin Notifications | Unsubscribe Admin Push | POST | `/api/v1/admin/notifications/push/unsubscribe` | Frontend: `src/api/notificationApi.js` / Backend: `AdminV1Controller.unsubscribePush` | Body: `{ endpoint }` | Yes (admin role) | Used by notification service |

## 7) Other APIs Found

| Module | API Name | Method | Endpoint | Source File | Payload Required | Auth Required | Notes |
|---|---|---|---|---|---|---|---|
| Cart | Get Cart | GET | `/api/v1/cart` | Frontend: `src/api/cartApi.js` / Backend: `CartV1Controller.get` | None | Guest or user (optional auth) | Uses guest cookie/header when anonymous |
| Cart | Add Cart Item | POST | `/api/v1/cart` | Frontend: `src/api/cartApi.js` / Backend: `CartV1Controller.add` | Body: `{ productId, quantity }`; optional header `Idempotency-Key` | Guest or user | Frontend stores `guestSessionId` from response |
| Cart | Clear Cart | DELETE | `/api/v1/cart` | Frontend: `src/api/cartApi.js` / Backend: `CartV1Controller.clear` | None | Guest or user | Clears resolved cart context |
| Cart | Update Cart Item | PUT | `/api/v1/cart/{itemId}` | Frontend: `src/api/cartApi.js` / Backend: `CartV1Controller.update` | Path: `itemId`; body: `{ quantity }` | Guest or user | Item id parsed as UUID |
| Cart | Delete Cart Item | DELETE | `/api/v1/cart/{itemId}` | Frontend: `src/api/cartApi.js` / Backend: `CartV1Controller.remove` | Path: `itemId` | Guest or user | Removes one line |
| Orders | Place Order | POST | `/api/v1/orders` | Frontend: `src/api/orderApi.js` / Backend: `OrderV1Controller.place` | Body may include `addressId`, `paymentMethod`, `paymentTxnId`, `demoPaymentOutcome`; optional `Idempotency-Key` header | Yes (logged-in user) | Used by `orderService.placeOrder` |
| Orders | List My Orders | GET | `/api/v1/orders` | Frontend: `src/api/orderApi.js` / Backend: `OrderV1Controller.list` | Query: `phone?`, `page`, `size` | Yes | Used by `orderService.listOrders` |
| Orders | Get My Order By Id | GET | `/api/v1/orders/{id}` | Frontend: `src/api/orderApi.js` / Backend: `OrderV1Controller.one` | Path: `id` | Yes | Used by `orderService.getOrder` |
| Payments | Initiate Payment | POST | `/api/v1/payments/initiate` | Frontend: `src/services/paymentService.js` (direct `apiPost`) / Backend: `PaymentV1Controller.initiate` | Body includes `orderId` (if present) | Yes (logged-in user) | No dedicated `src/api/paymentApi.js`; called from service |
| Payments | Confirm Payment | POST | `/api/v1/payments/confirm` | Frontend: `src/services/paymentService.js` / Backend: `PaymentV1Controller.confirm` | Body map: Need to verify exact gateway fields | Yes (logged-in user) | Used after checkout callback |
| Payments | Webhook | POST | `/api/v1/payments/webhook` | Backend: `PaymentV1Controller.webhook` | Body map + headers: `X-Signature` required, `X-Provider?`, `X-Event-Id?`, `X-Event-Timestamp?` | Server-to-server signature auth | No frontend usage found |
| User Profile | Get Profile | GET | `/api/v1/user/profile` | Frontend: `src/api/userApi.js` / Backend: `UserV1Controller.getProfile` | None | Yes (logged-in user) | Used by `userService.loadProfile` |
| User Profile | Update Profile | PUT | `/api/v1/user/profile` | Frontend: `src/api/userApi.js` / Backend: `UserV1Controller.putProfile` | Body map: Need to verify full schema | Yes | Used by `userService.saveProfile` |
| Addresses | List Addresses | GET | `/api/v1/addresses` | Frontend: `src/api/userApi.js` / Backend: `AddressV1Controller.list` | None | Yes | Used by checkout/profile flows |
| Addresses | Create Address | POST | `/api/v1/addresses` | Frontend: `src/api/userApi.js` / Backend: `AddressV1Controller.create` | Body map: Need to verify exact fields | Yes | Used by `userService.createAddress` |
| Addresses | Update Address | PUT | `/api/v1/addresses/{id}` | Frontend: `src/api/userApi.js` / Backend: `AddressV1Controller.update` | Path: `id`; body map | Yes | Used by `userService.updateAddress` |
| Addresses | Delete Address | DELETE | `/api/v1/addresses/{id}` | Frontend: `src/api/userApi.js` / Backend: `AddressV1Controller.delete` | Path: `id` | Yes | Used by `userService.deleteAddress` |
| Wishlist | List Wishlist | GET | `/api/v1/wishlist` | Frontend: `src/api/wishlistApi.js` / Backend: `WishlistV1Controller.list` | None | Yes (logged-in user) | Used by `wishlistService.loadWishlist` |
| Wishlist | Toggle Wishlist Product | POST | `/api/v1/wishlist/toggle` | Frontend: `src/api/wishlistApi.js` / Backend: `WishlistV1Controller.toggle` | Body: `{ productId }` | Yes | Used by `wishlistService.toggleWishlistProduct` |
| Leads | Seller Lead | POST | `/api/v1/leads/seller` | Frontend: `src/api/leads.js` / Backend: `MiscV1Controller.sellerLead` | Body map (lead details): Need to verify | No (`skipAuth: true`) | Used by `leadService.submitSellerLead` |
| Search | Search By Plate | POST | `/api/v1/search/plate` | Backend: `MiscV1Controller.searchPlate` | Body: `{ plate }` | No | No direct frontend API wrapper found |
| Health | API Health | GET | `/api/v1/health` | Backend: `HealthV1Controller.health` | None | No | No frontend service call found |

