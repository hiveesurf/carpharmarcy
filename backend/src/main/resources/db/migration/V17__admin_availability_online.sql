ALTER TABLE admin_users
DROP CONSTRAINT IF EXISTS admin_users_availability_check;

UPDATE admin_users
SET availability_status = 'online'
WHERE availability_status = 'free';

ALTER TABLE admin_users
ADD CONSTRAINT admin_users_availability_check
CHECK (availability_status IN ('online', 'busy', 'offline'));
