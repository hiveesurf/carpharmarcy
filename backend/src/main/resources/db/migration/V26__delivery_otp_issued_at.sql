-- Tracks last delivery OTP issuance (start delivery or resend) for resend cooldown.
ALTER TABLE orders
  ADD COLUMN IF NOT EXISTS delivery_otp_issued_at TIMESTAMPTZ;
