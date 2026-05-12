ALTER TABLE car_models
  ALTER COLUMN updated_at DROP NOT NULL;

ALTER TABLE car_models
  ALTER COLUMN updated_at DROP DEFAULT;
