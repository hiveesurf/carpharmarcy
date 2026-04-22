-- Track which admin email created a category (nullable for legacy rows).
ALTER TABLE categories
  ADD COLUMN IF NOT EXISTS created_by_admin_email TEXT;
