-- Canonical fuel and transmission choices for admin car catalog (API-driven dropdowns).

CREATE TABLE car_fuel_options (
  id BIGSERIAL PRIMARY KEY,
  label TEXT NOT NULL UNIQUE,
  sort_order SMALLINT NOT NULL DEFAULT 0
);

CREATE TABLE car_transmission_options (
  id BIGSERIAL PRIMARY KEY,
  label TEXT NOT NULL UNIQUE,
  sort_order SMALLINT NOT NULL DEFAULT 0
);

INSERT INTO car_fuel_options (label, sort_order) VALUES
  ('Petrol', 10),
  ('Diesel', 20),
  ('CNG', 30),
  ('Electric', 40);

INSERT INTO car_transmission_options (label, sort_order) VALUES
  ('Semi', 10),
  ('Automatic', 20),
  ('Manual', 30),
  ('Electric', 40);
