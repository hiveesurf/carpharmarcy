-- =============================================================================
-- CARNALYSYS — PostgreSQL schema (v1)
-- Target: PostgreSQL 16+
-- Apply to an empty database (Docker init runs this once on first volume).
-- =============================================================================

SET client_min_messages = WARNING;
SET search_path = public;

-- Extensions (gen_random_uuid, digest; pg_trgm for fitment search index)
CREATE EXTENSION IF NOT EXISTS pgcrypto;
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- -----------------------------------------------------------------------------
-- Enumerated types
-- -----------------------------------------------------------------------------
CREATE TYPE product_type AS ENUM ('part', 'vehicle');

CREATE TYPE vehicle_condition AS ENUM ('first-hand', 'second-hand');

CREATE TYPE order_status AS ENUM (
  'draft',
  'placed',
  'confirmed',
  'processing',
  'shipped',
  'delivered',
  'cancelled',
  'refunded'
);

-- -----------------------------------------------------------------------------
-- Catalog: categories & products
-- -----------------------------------------------------------------------------
CREATE TABLE categories (
  slug TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  display_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT categories_name_nonempty CHECK (length(trim(name)) > 0),
  CONSTRAINT categories_slug_nonempty CHECK (length(trim(slug)) > 0)
);

CREATE TABLE products (
  id TEXT PRIMARY KEY,
  category_slug TEXT NOT NULL REFERENCES categories (slug) ON UPDATE CASCADE ON DELETE RESTRICT,
  type product_type NOT NULL,
  sku TEXT NOT NULL,
  name TEXT NOT NULL,
  price_inr NUMERIC(14, 2) NOT NULL,
  stock_quantity INTEGER NOT NULL DEFAULT 0,
  published BOOLEAN NOT NULL DEFAULT TRUE,
  image_key TEXT,
  description TEXT,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT products_sku_unique UNIQUE (sku),
  CONSTRAINT products_name_nonempty CHECK (length(trim(name)) > 0),
  CONSTRAINT products_price_nonneg CHECK (price_inr >= 0),
  CONSTRAINT products_stock_nonneg CHECK (stock_quantity >= 0),
  CONSTRAINT products_vehicle_stock CHECK (type <> 'vehicle' OR stock_quantity <= 1)
);

CREATE INDEX idx_products_category_published ON products (category_slug) WHERE published;
CREATE INDEX idx_products_type_published ON products (type) WHERE published;
CREATE INDEX idx_products_sku_lower ON products (lower(sku));

COMMENT ON TABLE products IS 'Sellable SKU: part or vehicle listing; prices in INR (decimal rupees).';

-- Optional vehicle-specific attributes (1:1 with products where type = vehicle)
CREATE TABLE product_vehicle_specs (
  product_id TEXT PRIMARY KEY REFERENCES products (id) ON DELETE CASCADE,
  model_year SMALLINT,
  condition vehicle_condition NOT NULL DEFAULT 'second-hand',
  odometer_km INTEGER,
  CONSTRAINT product_vehicle_specs_odometer_nonneg CHECK (odometer_km IS NULL OR odometer_km >= 0),
  fuel TEXT,
  transmission TEXT,
  location TEXT,
  primary_image_url TEXT,
  image_alt TEXT,
  gallery JSONB NOT NULL DEFAULT '[]'::jsonb,
  CONSTRAINT product_vehicle_specs_gallery_is_array CHECK (jsonb_typeof(gallery) = 'array')
);

-- Part fitment labels (denormalized strings from mock compatibleCars[])
CREATE TABLE product_fitment_labels (
  product_id TEXT NOT NULL REFERENCES products (id) ON DELETE CASCADE,
  label TEXT NOT NULL,
  PRIMARY KEY (product_id, label),
  CONSTRAINT product_fitment_labels_label_nonempty CHECK (length(trim(label)) > 0)
);

CREATE INDEX idx_fitment_label_trgm ON product_fitment_labels USING gin (label gin_trgm_ops);

-- -----------------------------------------------------------------------------
-- Users & profiles (phone OTP auth)
-- -----------------------------------------------------------------------------
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  phone_e164 VARCHAR(20) NOT NULL,
  display_name TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT users_phone_unique UNIQUE (phone_e164),
  CONSTRAINT users_phone_nonempty CHECK (length(trim(phone_e164)) >= 10)
);

CREATE INDEX idx_users_phone ON users (phone_e164);

CREATE TABLE user_profiles (
  user_id UUID PRIMARY KEY REFERENCES users (id) ON DELETE CASCADE,
  full_name TEXT,
  email TEXT,
  phone VARCHAR(20),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT user_profiles_email_format CHECK (
    email IS NULL OR email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$'
  )
);

-- OTP challenges (store hash only, never plaintext codes in production)
CREATE TABLE otp_challenges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  phone_e164 VARCHAR(20) NOT NULL,
  code_hash TEXT NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  consumed_at TIMESTAMPTZ,
  attempt_count SMALLINT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT otp_challenges_attempts_nonneg CHECK (attempt_count >= 0),
  CONSTRAINT otp_challenges_expires_future CHECK (expires_at > created_at)
);

CREATE INDEX idx_otp_challenges_phone_active ON otp_challenges (phone_e164, expires_at DESC)
  WHERE consumed_at IS NULL;

-- Refresh tokens (opaque token stored as SHA-256 hash)
CREATE TABLE refresh_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users (id) ON DELETE CASCADE,
  token_hash TEXT NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  revoked_at TIMESTAMPTZ,
  CONSTRAINT refresh_tokens_hash_unique UNIQUE (token_hash),
  CONSTRAINT refresh_tokens_expires_after_created CHECK (expires_at > created_at)
);

CREATE INDEX idx_refresh_tokens_user ON refresh_tokens (user_id) WHERE revoked_at IS NULL;

-- -----------------------------------------------------------------------------
-- Guest sessions & carts
-- -----------------------------------------------------------------------------
CREATE TABLE guest_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE carts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users (id) ON DELETE CASCADE,
  guest_session_id UUID REFERENCES guest_sessions (id) ON DELETE CASCADE,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT carts_one_owner CHECK (
    (user_id IS NOT NULL AND guest_session_id IS NULL)
    OR (user_id IS NULL AND guest_session_id IS NOT NULL)
  )
);

CREATE UNIQUE INDEX carts_one_per_user ON carts (user_id) WHERE user_id IS NOT NULL;

CREATE UNIQUE INDEX carts_one_per_guest ON carts (guest_session_id) WHERE guest_session_id IS NOT NULL;

CREATE TABLE cart_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cart_id UUID NOT NULL REFERENCES carts (id) ON DELETE CASCADE,
  product_id TEXT NOT NULL REFERENCES products (id) ON DELETE RESTRICT,
  quantity INTEGER NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT cart_items_quantity_pos CHECK (quantity > 0),
  CONSTRAINT cart_items_unique_product UNIQUE (cart_id, product_id)
);

CREATE INDEX idx_cart_items_cart ON cart_items (cart_id);

-- -----------------------------------------------------------------------------
-- Wishlist
-- -----------------------------------------------------------------------------
CREATE TABLE wishlist_items (
  user_id UUID NOT NULL REFERENCES users (id) ON DELETE CASCADE,
  product_id TEXT NOT NULL REFERENCES products (id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, product_id)
);

-- -----------------------------------------------------------------------------
-- Addresses & orders
-- -----------------------------------------------------------------------------
CREATE TABLE addresses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users (id) ON DELETE CASCADE,
  line1 TEXT NOT NULL,
  line2 TEXT,
  city TEXT NOT NULL,
  state TEXT,
  pincode VARCHAR(12) NOT NULL,
  country CHAR(2) NOT NULL DEFAULT 'IN',
  label TEXT,
  is_default BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT addresses_line1_nonempty CHECK (length(trim(line1)) > 0),
  CONSTRAINT addresses_city_nonempty CHECK (length(trim(city)) > 0),
  CONSTRAINT addresses_pincode_nonempty CHECK (length(trim(pincode)) > 0)
);

CREATE INDEX idx_addresses_user ON addresses (user_id);

CREATE TABLE orders (
  id TEXT PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES users (id) ON DELETE RESTRICT,
  status order_status NOT NULL DEFAULT 'placed',
  total_inr NUMERIC(14, 2) NOT NULL,
  currency CHAR(3) NOT NULL DEFAULT 'INR',
  shipping_address_id UUID REFERENCES addresses (id) ON DELETE SET NULL,
  placed_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT orders_total_nonneg CHECK (total_inr >= 0)
);

CREATE INDEX idx_orders_user_placed ON orders (user_id, placed_at DESC);

CREATE TABLE order_lines (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id TEXT NOT NULL REFERENCES orders (id) ON DELETE CASCADE,
  product_id TEXT NOT NULL,
  product_name_snapshot TEXT NOT NULL,
  sku_snapshot TEXT NOT NULL,
  quantity INTEGER NOT NULL,
  unit_price_inr NUMERIC(14, 2) NOT NULL,
  line_total_inr NUMERIC(14, 2) NOT NULL,
  CONSTRAINT order_lines_qty_pos CHECK (quantity > 0),
  CONSTRAINT order_lines_prices_nonneg CHECK (unit_price_inr >= 0 AND line_total_inr >= 0)
);

COMMENT ON COLUMN order_lines.product_id IS 'Catalog id at order time; no FK so rows survive product removal.';

CREATE INDEX idx_order_lines_order ON order_lines (order_id);

-- -----------------------------------------------------------------------------
-- Admin (separate from phone users; password hash = app responsibility e.g. argon2)
-- -----------------------------------------------------------------------------
CREATE TABLE admin_users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL,
  password_hash TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'admin',
  last_login_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT admin_users_email_unique UNIQUE (email),
  CONSTRAINT admin_users_email_nonempty CHECK (length(trim(email)) > 0),
  CONSTRAINT admin_users_email_format CHECK (email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$')
);

-- -----------------------------------------------------------------------------
-- Leads & enquiries (marketing / CRM)
-- -----------------------------------------------------------------------------
CREATE TABLE seller_leads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  source TEXT,
  message TEXT,
  payload JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE vehicle_enquiries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id TEXT NOT NULL REFERENCES products (id) ON DELETE RESTRICT,
  user_id UUID REFERENCES users (id) ON DELETE SET NULL,
  contact_phone VARCHAR(20),
  payload JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_vehicle_enquiries_product ON vehicle_enquiries (product_id);

-- -----------------------------------------------------------------------------
-- updated_at maintenance
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER tr_categories_updated_at
  BEFORE UPDATE ON categories
  FOR EACH ROW EXECUTE PROCEDURE set_updated_at();

CREATE TRIGGER tr_products_updated_at
  BEFORE UPDATE ON products
  FOR EACH ROW EXECUTE PROCEDURE set_updated_at();

CREATE TRIGGER tr_users_updated_at
  BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE PROCEDURE set_updated_at();

CREATE TRIGGER tr_user_profiles_updated_at
  BEFORE UPDATE ON user_profiles
  FOR EACH ROW EXECUTE PROCEDURE set_updated_at();

CREATE TRIGGER tr_cart_items_updated_at
  BEFORE UPDATE ON cart_items
  FOR EACH ROW EXECUTE PROCEDURE set_updated_at();

CREATE TRIGGER tr_carts_updated_at
  BEFORE UPDATE ON carts
  FOR EACH ROW EXECUTE PROCEDURE set_updated_at();

CREATE TRIGGER tr_addresses_updated_at
  BEFORE UPDATE ON addresses
  FOR EACH ROW EXECUTE PROCEDURE set_updated_at();

CREATE TRIGGER tr_orders_updated_at
  BEFORE UPDATE ON orders
  FOR EACH ROW EXECUTE PROCEDURE set_updated_at();

CREATE TRIGGER tr_admin_users_updated_at
  BEFORE UPDATE ON admin_users
  FOR EACH ROW EXECUTE PROCEDURE set_updated_at();
