-- App role for phone-authenticated users (OTP). Admins use JWT role claim + /api/v1/admin/*.
ALTER TABLE users
  ADD COLUMN role VARCHAR(16) NOT NULL DEFAULT 'user';

ALTER TABLE users
  ADD CONSTRAINT users_role_check CHECK (role IN ('user', 'admin'));

COMMENT ON COLUMN users.role IS 'user | admin — set in DB; next OTP/refresh issues JWT with this role';
