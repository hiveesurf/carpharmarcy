CREATE TABLE product_low_stock_alert_state (
    product_id VARCHAR(64) PRIMARY KEY REFERENCES products(id) ON DELETE CASCADE,
    last_alert_at TIMESTAMPTZ NOT NULL,
    stock_at_alert INT NOT NULL
);

CREATE INDEX idx_product_low_stock_alert_state_last_alert
    ON product_low_stock_alert_state (last_alert_at);
