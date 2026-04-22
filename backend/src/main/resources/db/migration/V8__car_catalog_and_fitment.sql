-- Car catalog master + normalized part fitment mapping

CREATE TABLE IF NOT EXISTS car_models (
  id TEXT PRIMARY KEY,
  make TEXT NOT NULL,
  model TEXT NOT NULL,
  variant TEXT,
  model_year SMALLINT,
  fuel TEXT,
  transmission TEXT,
  engine_cc INTEGER,
  image_url TEXT,
  notes TEXT,
  published BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT car_models_make_nonempty CHECK (length(trim(make)) > 0),
  CONSTRAINT car_models_model_nonempty CHECK (length(trim(model)) > 0),
  CONSTRAINT car_models_engine_cc_nonneg CHECK (engine_cc IS NULL OR engine_cc >= 0)
);

CREATE INDEX IF NOT EXISTS idx_car_models_make_model
  ON car_models (lower(make), lower(model));

CREATE TABLE IF NOT EXISTS product_fitment_cars (
  product_id TEXT NOT NULL REFERENCES products (id) ON DELETE CASCADE,
  car_id TEXT NOT NULL REFERENCES car_models (id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (product_id, car_id)
);

CREATE INDEX IF NOT EXISTS idx_product_fitment_cars_car
  ON product_fitment_cars (car_id);

DO $$
BEGIN
  IF to_regclass('public.car_models') IS NOT NULL AND EXISTS (
    SELECT 1 FROM pg_proc WHERE proname = 'set_updated_at'
  ) THEN
    IF NOT EXISTS (
      SELECT 1 FROM pg_trigger WHERE tgname = 'tr_car_models_updated_at'
    ) THEN
      CREATE TRIGGER tr_car_models_updated_at
        BEFORE UPDATE ON car_models
        FOR EACH ROW EXECUTE PROCEDURE set_updated_at();
    END IF;
  END IF;
END $$;
