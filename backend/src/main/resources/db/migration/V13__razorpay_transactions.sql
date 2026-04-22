-- Razorpay transaction-first model

CREATE TABLE IF NOT EXISTS payment_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id TEXT NOT NULL REFERENCES orders (id) ON DELETE CASCADE,
  provider TEXT NOT NULL,
  status TEXT NOT NULL,
  amount_inr NUMERIC(14, 2) NOT NULL,
  currency CHAR(3) NOT NULL DEFAULT 'INR',
  provider_order_id TEXT,
  provider_payment_id TEXT,
  attempt_no INTEGER NOT NULL DEFAULT 1,
  error_code TEXT,
  error_message TEXT,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT payment_transactions_status_check
    CHECK (status IN ('created', 'authorized', 'paid', 'failed', 'cancelled', 'refunded'))
);

CREATE INDEX IF NOT EXISTS idx_payment_transactions_order_created
  ON payment_transactions (order_id, created_at DESC);

CREATE UNIQUE INDEX IF NOT EXISTS uq_payment_transactions_provider_order
  ON payment_transactions (provider, provider_order_id)
  WHERE provider_order_id IS NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS uq_payment_transactions_provider_payment
  ON payment_transactions (provider, provider_payment_id)
  WHERE provider_payment_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_payment_transactions_status_created
  ON payment_transactions (status, created_at DESC);

ALTER TABLE payment_events
  ADD COLUMN IF NOT EXISTS transaction_id UUID REFERENCES payment_transactions (id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_payment_events_transaction
  ON payment_events (transaction_id, created_at DESC);

-- Backfill one transaction per existing order so historic rows remain traceable.
INSERT INTO payment_transactions (
  order_id,
  provider,
  status,
  amount_inr,
  currency,
  provider_order_id,
  provider_payment_id,
  attempt_no,
  error_message,
  metadata,
  created_at,
  updated_at
)
SELECT
  o.id,
  COALESCE(NULLIF(o.payment_provider, ''), 'legacy'),
  CASE o.payment_status
    WHEN 'pending' THEN 'created'
    WHEN 'authorized' THEN 'authorized'
    WHEN 'paid' THEN 'paid'
    WHEN 'failed' THEN 'failed'
    WHEN 'cancelled' THEN 'cancelled'
    WHEN 'refunded' THEN 'refunded'
    ELSE 'created'
  END,
  o.total_inr,
  COALESCE(NULLIF(o.currency, ''), 'INR'),
  o.payment_order_ref,
  o.payment_txn_id,
  GREATEST(1, COALESCE(o.payment_attempt_count, 1)),
  o.payment_last_error,
  '{}'::jsonb,
  COALESCE(o.placed_at, now()),
  COALESCE(o.updated_at, now())
FROM orders o
WHERE NOT EXISTS (
  SELECT 1 FROM payment_transactions pt WHERE pt.order_id = o.id
);

CREATE TRIGGER tr_payment_transactions_updated_at
  BEFORE UPDATE ON payment_transactions
  FOR EACH ROW EXECUTE PROCEDURE set_updated_at();
