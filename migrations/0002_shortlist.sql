CREATE TABLE IF NOT EXISTS shortlist (
  user_id TEXT NOT NULL,
  imdb_id TEXT NOT NULL,
  title TEXT NOT NULL,
  year TEXT,
  poster TEXT,
  plot TEXT,
  added_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (user_id, imdb_id),
  FOREIGN KEY (user_id) REFERENCES users(id)
);
