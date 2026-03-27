-- Movie night movies table (movies added to a movie night)
CREATE TABLE movie_night_movies (
  movie_night_id TEXT NOT NULL,
  imdb_id TEXT NOT NULL,
  title TEXT NOT NULL,
  year TEXT,
  poster TEXT,
  plot TEXT,
  added_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (movie_night_id, imdb_id),
  FOREIGN KEY (movie_night_id) REFERENCES movie_nights(id)
);
