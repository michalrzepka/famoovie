CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  username TEXT NOT NULL UNIQUE,
  password TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  last_login_at TEXT
);

CREATE TABLE IF NOT EXISTS locations (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Seed admin user (UUID generated once)
INSERT OR IGNORE INTO users (id, username, password)
VALUES ('a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'admin', 'n');

-- Seed default location
INSERT OR IGNORE INTO locations (id, name)
VALUES ('loc-00000001-0000-0000-0000-000000000001', 'home');
