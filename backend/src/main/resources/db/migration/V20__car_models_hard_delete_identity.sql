-- Cars use hard delete; remove legacy soft-deleted rows and enforce global normalized identity.
DELETE FROM car_models WHERE deleted_at IS NOT NULL;

DROP INDEX IF EXISTS uq_car_models_identity_active;

CREATE UNIQUE INDEX IF NOT EXISTS uq_car_models_identity ON car_models (
  lower(regexp_replace(trim(make), '\s+', ' ', 'g')),
  lower(regexp_replace(trim(model), '\s+', ' ', 'g')),
  coalesce(model_year, -1::smallint),
  lower(regexp_replace(trim(coalesce(variant, '')), '\s+', ' ', 'g')),
  lower(regexp_replace(trim(coalesce(fuel, '')), '\s+', ' ', 'g'))
);
