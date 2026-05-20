-- One active catalog row per make + model + year + variant + fuel (soft-deleted rows excluded).
CREATE UNIQUE INDEX IF NOT EXISTS uq_car_models_identity_active
  ON car_models (
    lower(trim(make)),
    lower(trim(model)),
    coalesce(model_year, -1::smallint),
    lower(trim(coalesce(variant, ''))),
    lower(trim(coalesce(fuel, '')))
  )
  WHERE deleted_at IS NULL;
