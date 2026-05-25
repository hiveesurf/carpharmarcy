ALTER TABLE admin_users
  ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS deleted_reason TEXT,
  ADD COLUMN IF NOT EXISTS deleted_by VARCHAR(255);

DROP INDEX IF EXISTS uq_admin_users_phone_e164;

CREATE UNIQUE INDEX IF NOT EXISTS uq_admin_users_phone_e164_active
  ON admin_users (phone_e164)
  WHERE phone_e164 IS NOT NULL
    AND length(trim(phone_e164)) > 0
    AND deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_admin_users_deleted_at ON admin_users (deleted_at);
