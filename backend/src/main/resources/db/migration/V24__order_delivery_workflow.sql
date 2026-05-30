-- Delivery workflow stages, OTP, timestamps, failure reason, proof photo

ALTER TABLE orders
  ADD COLUMN IF NOT EXISTS delivery_stage TEXT,
  ADD COLUMN IF NOT EXISTS delivery_accepted_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS delivery_out_for_delivery_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS delivery_delivered_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS delivery_failed_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS delivery_failed_reason TEXT,
  ADD COLUMN IF NOT EXISTS delivery_failed_reason_note TEXT,
  ADD COLUMN IF NOT EXISTS delivery_otp_hash TEXT,
  ADD COLUMN IF NOT EXISTS delivery_otp_code VARCHAR(6),
  ADD COLUMN IF NOT EXISTS delivery_otp_expires_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS delivery_otp_verified_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS proof_photo_url TEXT;

ALTER TABLE orders
  DROP CONSTRAINT IF EXISTS orders_delivery_stage_check;

ALTER TABLE orders
  ADD CONSTRAINT orders_delivery_stage_check CHECK (
    delivery_stage IS NULL
    OR delivery_stage IN (
      'assigned',
      'accepted',
      'out_for_delivery',
      'otp_pending',
      'delivered',
      'delivery_failed'
    )
  );

ALTER TABLE orders
  DROP CONSTRAINT IF EXISTS orders_delivery_failed_reason_check;

ALTER TABLE orders
  ADD CONSTRAINT orders_delivery_failed_reason_check CHECK (
    delivery_failed_reason IS NULL
    OR delivery_failed_reason IN (
      'customer_not_available',
      'phone_not_reachable',
      'wrong_address',
      'customer_refused',
      'other'
    )
  );

CREATE INDEX IF NOT EXISTS idx_orders_delivery_stage
  ON orders (assigned_delivery_admin_email, delivery_stage, updated_at DESC);

-- Backfill: assigned orders without a stage
UPDATE orders
SET delivery_stage = 'assigned'
WHERE assigned_delivery_admin_email IS NOT NULL
  AND trim(assigned_delivery_admin_email) <> ''
  AND delivery_stage IS NULL
  AND status NOT IN ('delivered', 'cancelled', 'refunded');

UPDATE orders
SET delivery_stage = 'delivered',
    delivery_delivered_at = COALESCE(delivery_delivered_at, updated_at)
WHERE status = 'delivered'
  AND assigned_delivery_admin_email IS NOT NULL
  AND trim(assigned_delivery_admin_email) <> ''
  AND (delivery_stage IS NULL OR delivery_stage NOT IN ('delivery_failed'));
