ALTER TABLE admin_users
  ADD COLUMN IF NOT EXISTS phone_e164 TEXT,
  ADD COLUMN IF NOT EXISTS onboarding_status TEXT NOT NULL DEFAULT 'pending',
  ADD COLUMN IF NOT EXISTS first_login_at TIMESTAMPTZ;

ALTER TABLE admin_users
  DROP CONSTRAINT IF EXISTS admin_users_onboarding_status_check,
  ADD CONSTRAINT admin_users_onboarding_status_check CHECK (onboarding_status IN ('pending', 'success'));

CREATE UNIQUE INDEX IF NOT EXISTS uq_admin_users_phone_e164
  ON admin_users (phone_e164)
  WHERE phone_e164 IS NOT NULL AND length(trim(phone_e164)) > 0;
