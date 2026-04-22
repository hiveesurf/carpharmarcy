ALTER TABLE products
  ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;

ALTER TABLE car_models
  ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;

ALTER TABLE categories
  ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;

ALTER TABLE addresses
  ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;

ALTER TABLE cart_items
  ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;

ALTER TABLE products
  DROP CONSTRAINT IF EXISTS products_sku_unique;

CREATE UNIQUE INDEX IF NOT EXISTS ux_products_sku_active
  ON products (sku)
  WHERE deleted_at IS NULL;

ALTER TABLE cart_items
  DROP CONSTRAINT IF EXISTS cart_items_unique_product;

CREATE UNIQUE INDEX IF NOT EXISTS ux_cart_items_cart_product_active
  ON cart_items (cart_id, product_id)
  WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_products_deleted_at ON products (deleted_at);
CREATE INDEX IF NOT EXISTS idx_car_models_deleted_at ON car_models (deleted_at);
CREATE INDEX IF NOT EXISTS idx_categories_deleted_at ON categories (deleted_at);
CREATE INDEX IF NOT EXISTS idx_addresses_user_active ON addresses (user_id, created_at DESC) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_cart_items_cart_active ON cart_items (cart_id) WHERE deleted_at IS NULL;
