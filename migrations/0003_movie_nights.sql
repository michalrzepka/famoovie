-- Movie nights table
CREATE TABLE movie_nights (
  id TEXT PRIMARY KEY,
  location_id TEXT NOT NULL,
  host_id TEXT NOT NULL,
  movie_count INTEGER NOT NULL DEFAULT 3,
  event_date TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'draft',
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (location_id) REFERENCES locations(id),
  FOREIGN KEY (host_id) REFERENCES users(id)
);
