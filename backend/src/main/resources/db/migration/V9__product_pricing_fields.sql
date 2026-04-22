ALTER TABLE products
  ADD COLUMN IF NOT EXISTS purchase_price_inr NUMERIC(14, 2) NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS discounted_price_inr NUMERIC(14, 2);

ALTER TABLE products
  DROP CONSTRAINT IF EXISTS products_purchase_price_nonneg,
  ADD CONSTRAINT products_purchase_price_nonneg CHECK (purchase_price_inr >= 0);

ALTER TABLE products
  DROP CONSTRAINT IF EXISTS products_discounted_price_nonneg,
  ADD CONSTRAINT products_discounted_price_nonneg CHECK (discounted_price_inr IS NULL OR discounted_price_inr >= 0);
