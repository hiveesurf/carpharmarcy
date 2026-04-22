ALTER TABLE users
  DROP CONSTRAINT IF EXISTS users_role_check;

UPDATE users SET role = 'super_admin' WHERE lower(role) = 'admin';
UPDATE users SET role = 'user' WHERE role IS NULL OR role = '';

ALTER TABLE users
  ADD CONSTRAINT users_role_check CHECK (role IN ('user', 'super_admin', 'sales', 'delivery'));

UPDATE admin_users SET role = 'super_admin' WHERE role IS NULL OR lower(role) = 'admin';

ALTER TABLE admin_users
  ALTER COLUMN role SET DEFAULT 'super_admin';

ALTER TABLE admin_users
  DROP CONSTRAINT IF EXISTS admin_users_role_check,
  ADD CONSTRAINT admin_users_role_check CHECK (role IN ('super_admin', 'sales', 'delivery'));

ALTER TABLE admin_users
  ADD COLUMN IF NOT EXISTS full_name TEXT,
  ADD COLUMN IF NOT EXISTS photo_url TEXT,
  ADD COLUMN IF NOT EXISTS last_logout_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS availability_status TEXT NOT NULL DEFAULT 'offline';

ALTER TABLE admin_users
  DROP CONSTRAINT IF EXISTS admin_users_availability_check,
  ADD CONSTRAINT admin_users_availability_check CHECK (availability_status IN ('free', 'busy', 'offline'));

ALTER TABLE orders
  ADD COLUMN IF NOT EXISTS assigned_delivery_admin_email TEXT,
  ADD COLUMN IF NOT EXISTS assigned_delivery_at TIMESTAMPTZ;

CREATE INDEX IF NOT EXISTS idx_orders_assigned_delivery
  ON orders (assigned_delivery_admin_email, status, placed_at DESC);

CREATE TABLE IF NOT EXISTS product_change_audit (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id TEXT NOT NULL REFERENCES products (id) ON DELETE CASCADE,
  action TEXT NOT NULL,
  actor_role TEXT NOT NULL,
  actor_id TEXT,
  actor_name TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_product_change_audit_product_created
  ON product_change_audit (product_id, created_at DESC);
