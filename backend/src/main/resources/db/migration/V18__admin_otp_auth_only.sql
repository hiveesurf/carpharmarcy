-- Admin authentication is phone + OTP only; password_hash is retained for legacy rows but unused.
ALTER TABLE admin_users
  ALTER COLUMN password_hash DROP NOT NULL;

-- Dev/default super-admin: link seeded email to demo OTP phone when missing.
UPDATE admin_users
SET phone_e164 = '9876543210'
WHERE lower(trim(email)) = 'admin@carnalysys.com'
  AND (phone_e164 IS NULL OR trim(phone_e164) = '');
