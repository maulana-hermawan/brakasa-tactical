CREATE TABLE IF NOT EXISTS categories (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  slug        TEXT    NOT NULL UNIQUE,
  name        TEXT    NOT NULL,
  description TEXT    NOT NULL DEFAULT '',
  sort_order  INTEGER NOT NULL DEFAULT 0,
  created_at  TEXT    NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
);

CREATE TABLE IF NOT EXISTS products (
  id                      INTEGER PRIMARY KEY AUTOINCREMENT,
  sku                     TEXT    NOT NULL UNIQUE,
  slug                    TEXT    NOT NULL UNIQUE,
  name                    TEXT    NOT NULL,
  brand                   TEXT    NOT NULL,
  category_id             INTEGER NOT NULL REFERENCES categories(id) ON DELETE RESTRICT,
  mission_tags_json       TEXT    NOT NULL DEFAULT '[]' CHECK (json_valid(mission_tags_json)),
  platform                TEXT    NOT NULL,
  propulsion              TEXT    NOT NULL,
  loadout_slot            TEXT    NOT NULL,
  price_idr               INTEGER NOT NULL CHECK (price_idr >= 0),
  weight_grams            INTEGER NOT NULL CHECK (weight_grams >= 0),
  fps_min                 INTEGER CHECK (fps_min IS NULL OR fps_min >= 0),
  fps_max                 INTEGER CHECK (fps_max IS NULL OR fps_max >= 0),
  energy_joule            REAL    CHECK (energy_joule IS NULL OR (energy_joule >= 0 AND energy_joule <= 2.0)),
  stock_qty               INTEGER NOT NULL DEFAULT 0 CHECK (stock_qty >= 0),
  low_stock_threshold     INTEGER NOT NULL DEFAULT 5 CHECK (low_stock_threshold >= 0),
  is_featured             INTEGER NOT NULL DEFAULT 0 CHECK (is_featured IN (0, 1)),
  is_active               INTEGER NOT NULL DEFAULT 1 CHECK (is_active IN (0, 1)),
  requires_age_18         INTEGER NOT NULL DEFAULT 0 CHECK (requires_age_18 IN (0, 1)),
  shipping_class          TEXT    NOT NULL DEFAULT 'REGULAR'
                                  CHECK (shipping_class IN ('REGULAR', 'CARGO_BATTERY', 'CARGO_REPLICA', 'CARGO_GAS')),
  short_description       TEXT    NOT NULL DEFAULT '',
  description             TEXT    NOT NULL DEFAULT '',
  specs_json              TEXT    NOT NULL DEFAULT '{}' CHECK (json_valid(specs_json)),
  compatibility_tags_json TEXT    NOT NULL DEFAULT '{}' CHECK (json_valid(compatibility_tags_json)),
  specs_search_text       TEXT    NOT NULL DEFAULT '',
  deleted_at              TEXT,
  created_at              TEXT    NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  updated_at              TEXT    NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
);

CREATE INDEX IF NOT EXISTS idx_products_category ON products(category_id);
CREATE INDEX IF NOT EXISTS idx_products_active_featured ON products(is_active, is_featured, deleted_at);
CREATE INDEX IF NOT EXISTS idx_products_platform_propulsion ON products(platform, propulsion);
CREATE INDEX IF NOT EXISTS idx_products_loadout_slot ON products(loadout_slot);
CREATE INDEX IF NOT EXISTS idx_products_price ON products(price_idr);
CREATE INDEX IF NOT EXISTS idx_products_fps ON products(fps_min, fps_max);
CREATE INDEX IF NOT EXISTS idx_products_stock ON products(is_active, stock_qty, low_stock_threshold);

CREATE VIRTUAL TABLE IF NOT EXISTS products_fts USING fts5(
  sku,
  name,
  brand,
  platform,
  propulsion,
  short_description,
  description,
  specs_search_text,
  content='products',
  content_rowid='id',
  tokenize='unicode61 remove_diacritics 2'
);

CREATE TRIGGER IF NOT EXISTS products_ai AFTER INSERT ON products BEGIN
  INSERT INTO products_fts(
    rowid, sku, name, brand, platform, propulsion,
    short_description, description, specs_search_text
  ) VALUES (
    new.id, new.sku, new.name, new.brand, new.platform, new.propulsion,
    new.short_description, new.description, new.specs_search_text
  );
END;

CREATE TRIGGER IF NOT EXISTS products_ad AFTER DELETE ON products BEGIN
  INSERT INTO products_fts(
    products_fts, rowid, sku, name, brand, platform, propulsion,
    short_description, description, specs_search_text
  ) VALUES (
    'delete', old.id, old.sku, old.name, old.brand, old.platform, old.propulsion,
    old.short_description, old.description, old.specs_search_text
  );
END;

CREATE TRIGGER IF NOT EXISTS products_au AFTER UPDATE ON products BEGIN
  INSERT INTO products_fts(
    products_fts, rowid, sku, name, brand, platform, propulsion,
    short_description, description, specs_search_text
  ) VALUES (
    'delete', old.id, old.sku, old.name, old.brand, old.platform, old.propulsion,
    old.short_description, old.description, old.specs_search_text
  );
  INSERT INTO products_fts(
    rowid, sku, name, brand, platform, propulsion,
    short_description, description, specs_search_text
  ) VALUES (
    new.id, new.sku, new.name, new.brand, new.platform, new.propulsion,
    new.short_description, new.description, new.specs_search_text
  );
END;

CREATE TABLE IF NOT EXISTS product_media (
  id           INTEGER PRIMARY KEY AUTOINCREMENT,
  product_id   INTEGER NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  media_type   TEXT    NOT NULL CHECK (media_type IN ('image', 'video')),
  url          TEXT    NOT NULL,
  poster_url   TEXT,
  alt_text     TEXT    NOT NULL DEFAULT '',
  duration_sec REAL    CHECK (duration_sec IS NULL OR duration_sec > 0),
  is_primary   INTEGER NOT NULL DEFAULT 0 CHECK (is_primary IN (0, 1)),
  sort_order   INTEGER NOT NULL DEFAULT 0,
  created_at   TEXT    NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
);

CREATE INDEX IF NOT EXISTS idx_product_media_product ON product_media(product_id, sort_order);
CREATE INDEX IF NOT EXISTS idx_product_media_type ON product_media(media_type, product_id);

CREATE TABLE IF NOT EXISTS vouchers (
  id               INTEGER PRIMARY KEY AUTOINCREMENT,
  code             TEXT    NOT NULL UNIQUE COLLATE NOCASE,
  description      TEXT    NOT NULL DEFAULT '',
  discount_type    TEXT    NOT NULL CHECK (discount_type IN ('PERCENT', 'FIXED')),
  discount_value   INTEGER NOT NULL CHECK (discount_value > 0),
  max_discount_idr INTEGER CHECK (max_discount_idr IS NULL OR max_discount_idr > 0),
  min_subtotal_idr INTEGER NOT NULL DEFAULT 0 CHECK (min_subtotal_idr >= 0),
  max_uses         INTEGER CHECK (max_uses IS NULL OR max_uses > 0),
  used_count       INTEGER NOT NULL DEFAULT 0 CHECK (used_count >= 0),
  starts_at        TEXT,
  expires_at       TEXT,
  is_public        INTEGER NOT NULL DEFAULT 0 CHECK (is_public IN (0, 1)),
  is_active        INTEGER NOT NULL DEFAULT 1 CHECK (is_active IN (0, 1)),
  created_at       TEXT    NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  updated_at       TEXT    NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
);

CREATE TABLE IF NOT EXISTS orders (
  id                      INTEGER PRIMARY KEY AUTOINCREMENT,
  invoice_number          TEXT    NOT NULL UNIQUE,
  status                  TEXT    NOT NULL DEFAULT 'PENDING_PAYMENT'
                                  CHECK (status IN ('PENDING_PAYMENT', 'PAID_VERIFIED', 'PACKED', 'SHIPPED', 'COMPLETED', 'CANCELLED')),
  customer_name           TEXT    NOT NULL,
  customer_email          TEXT    NOT NULL,
  customer_phone          TEXT    NOT NULL,
  shipping_zone           TEXT    NOT NULL,
  shipping_city           TEXT    NOT NULL,
  shipping_district       TEXT    NOT NULL DEFAULT '',
  shipping_postal_code    TEXT    NOT NULL DEFAULT '',
  shipping_address        TEXT    NOT NULL,
  shipping_notes          TEXT,
  shipping_courier        TEXT    NOT NULL,
  shipping_class          TEXT    NOT NULL
                                  CHECK (shipping_class IN ('REGULAR', 'CARGO_BATTERY', 'CARGO_REPLICA', 'CARGO_GAS')),
  wooden_packing          INTEGER NOT NULL DEFAULT 0 CHECK (wooden_packing IN (0, 1)),
  wooden_packing_cost_idr INTEGER NOT NULL DEFAULT 0 CHECK (wooden_packing_cost_idr >= 0),
  shipping_cost_idr       INTEGER NOT NULL DEFAULT 0 CHECK (shipping_cost_idr >= 0),
  tracking_number         TEXT,
  payment_method          TEXT    NOT NULL,
  subtotal_idr            INTEGER NOT NULL CHECK (subtotal_idr >= 0),
  discount_idr            INTEGER NOT NULL DEFAULT 0 CHECK (discount_idr >= 0),
  total_idr               INTEGER NOT NULL CHECK (total_idr >= 0),
  voucher_code            TEXT,
  requires_age_18         INTEGER NOT NULL DEFAULT 0 CHECK (requires_age_18 IN (0, 1)),
  buyer_dob               TEXT,
  buyer_age_years         INTEGER,
  age_18_confirmed        INTEGER NOT NULL DEFAULT 0 CHECK (age_18_confirmed IN (0, 1)),
  sport_use_declaration   INTEGER NOT NULL DEFAULT 0 CHECK (sport_use_declaration IN (0, 1)),
  club_kta_number         TEXT,
  usage_purpose           TEXT,
  stock_restored          INTEGER NOT NULL DEFAULT 0 CHECK (stock_restored IN (0, 1)),
  cancel_reason           TEXT,
  created_at              TEXT    NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  updated_at              TEXT    NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
);

CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_orders_email ON orders(customer_email COLLATE NOCASE);
CREATE INDEX IF NOT EXISTS idx_orders_phone ON orders(customer_phone);

CREATE TABLE IF NOT EXISTS order_items (
  id                    INTEGER PRIMARY KEY AUTOINCREMENT,
  order_id              INTEGER NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  product_id            INTEGER REFERENCES products(id) ON DELETE SET NULL,
  sku_snapshot          TEXT    NOT NULL,
  name_snapshot         TEXT    NOT NULL,
  image_url_snapshot    TEXT    NOT NULL DEFAULT '',
  unit_price_idr        INTEGER NOT NULL CHECK (unit_price_idr >= 0),
  weight_grams_snapshot INTEGER NOT NULL DEFAULT 0 CHECK (weight_grams_snapshot >= 0),
  quantity              INTEGER NOT NULL CHECK (quantity > 0),
  line_total_idr        INTEGER NOT NULL CHECK (line_total_idr >= 0)
);

CREATE INDEX IF NOT EXISTS idx_order_items_order ON order_items(order_id);
CREATE INDEX IF NOT EXISTS idx_order_items_product ON order_items(product_id);

CREATE TABLE IF NOT EXISTS order_status_logs (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  order_id    INTEGER NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  from_status TEXT,
  to_status   TEXT    NOT NULL,
  note        TEXT,
  actor       TEXT    NOT NULL,
  created_at  TEXT    NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
);

CREATE INDEX IF NOT EXISTS idx_order_status_logs_order ON order_status_logs(order_id, created_at ASC);

CREATE TABLE IF NOT EXISTS inventory_mutations (
  id           INTEGER PRIMARY KEY AUTOINCREMENT,
  product_id   INTEGER NOT NULL REFERENCES products(id) ON DELETE RESTRICT,
  delta_qty    INTEGER NOT NULL CHECK (delta_qty != 0),
  stock_before INTEGER NOT NULL CHECK (stock_before >= 0),
  stock_after  INTEGER NOT NULL CHECK (stock_after >= 0),
  reason       TEXT    NOT NULL
                       CHECK (reason IN ('INITIAL_SEED', 'CHECKOUT_DEDUCT', 'ORDER_CANCEL_RESTOCK', 'MANUAL_RESTOCK', 'AUDIT_ADJUSTMENT')),
  reference_id TEXT,
  note         TEXT    NOT NULL DEFAULT '',
  actor        TEXT    NOT NULL,
  created_at   TEXT    NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
);

CREATE INDEX IF NOT EXISTS idx_inventory_mutations_product ON inventory_mutations(product_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_inventory_mutations_created ON inventory_mutations(created_at DESC);

CREATE TABLE IF NOT EXISTS site_settings (
  key        TEXT PRIMARY KEY,
  value_json TEXT NOT NULL CHECK (json_valid(value_json)),
  updated_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
);

CREATE TABLE IF NOT EXISTS admin_users (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  username      TEXT    NOT NULL UNIQUE COLLATE NOCASE,
  email         TEXT    NOT NULL UNIQUE COLLATE NOCASE,
  display_name  TEXT    NOT NULL,
  password_hash TEXT    NOT NULL,
  role          TEXT    NOT NULL DEFAULT 'OPERATIONS_ADMIN'
                        CHECK (role IN ('SUPER_ADMIN', 'OPERATIONS_ADMIN')),
  is_active     INTEGER NOT NULL DEFAULT 1 CHECK (is_active IN (0, 1)),
  created_at    TEXT    NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  updated_at    TEXT    NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
);

CREATE TABLE IF NOT EXISTS admin_sessions (
  token_hash TEXT    PRIMARY KEY,
  admin_id   INTEGER NOT NULL REFERENCES admin_users(id) ON DELETE CASCADE,
  expires_at TEXT    NOT NULL,
  user_agent TEXT,
  ip_address TEXT,
  created_at TEXT    NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
);

CREATE INDEX IF NOT EXISTS idx_admin_sessions_admin ON admin_sessions(admin_id);
CREATE INDEX IF NOT EXISTS idx_admin_sessions_expires ON admin_sessions(expires_at);
