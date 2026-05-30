-- Remove plaintext OTP; use nonce + HMAC-derived OTP verified via bcrypt hash only.

ALTER TABLE orders DROP COLUMN IF EXISTS delivery_otp_code;

ALTER TABLE orders ADD COLUMN IF NOT EXISTS delivery_otp_nonce TEXT;
