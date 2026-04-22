ALTER TABLE user_profiles
  ADD COLUMN IF NOT EXISTS secondary_phone VARCHAR(20),
  ADD COLUMN IF NOT EXISTS avatar_storage_key TEXT;
