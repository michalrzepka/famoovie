import { useState, useEffect, useRef } from "react";

function useDebounce(value, delay) {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedValue(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);

  return debouncedValue;
}

function MovieCard({ movie }) {
  return (
    <div className="movie-card">
      {movie.poster ? (
        <img src={movie.poster} alt={movie.title} className="movie-poster" />
      ) : (
        <div className="movie-poster-placeholder">No Poster</div>
      )}
      <div className="movie-info">
        <h3 className="movie-title">{movie.title}</h3>
        <p className="movie-year">{movie.year}</p>
        {movie.plot && <p className="movie-plot">{movie.plot}</p>}
      </div>
    </div>
  );
}

function MovieSearch() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const debouncedQuery = useDebounce(query, 400);
  const abortRef = useRef(null);

  useEffect(() => {
    if (!debouncedQuery || debouncedQuery.length < 2) {
      setResults([]);
      return;
    }

    async function search() {
      if (abortRef.current) {
        abortRef.current.abort();
      }
      abortRef.current = new AbortController();

      setLoading(true);
      setError("");

      try {
        const res = await fetch(
          `/api/movies/search?q=${encodeURIComponent(debouncedQuery)}`,
          { signal: abortRef.current.signal }
        );
        const data = await res.json();

        if (!res.ok) {
          setError(data?.error || "Search failed");
          setResults([]);
          return;
        }

        const movieIds = data.results.slice(0, 6).map((m) => m.imdbId);
        const details = await Promise.all(
          movieIds.map(async (id) => {
            const detailRes = await fetch(`/api/movies/${id}`);
            return detailRes.json();
          })
        );

        setResults(details.filter((d) => !d.error));
      } catch (err) {
        if (err.name !== "AbortError") {
          setError("Search failed");
        }
      } finally {
        setLoading(false);
      }
    }

    search();
  }, [debouncedQuery]);

  return (
    <div className="movie-search">
      <input
        type="text"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Search movies..."
        className="search-input"
      />
      {loading && <p className="subtle">Searching...</p>}
      {error && <p className="error">{error}</p>}
      {results.length > 0 && (
        <div className="movie-results">
          {results.map((movie) => (
            <MovieCard key={movie.imdbId} movie={movie} />
          ))}
        </div>
      )}
      {!loading && !error && query.length >= 2 && results.length === 0 && (
        <p className="subtle">No movies found</p>
      )}
    </div>
  );
}

export default function App() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [user, setUser] = useState(null);

  async function onSubmit(event) {
    event.preventDefault();
    setError("");
    setLoading(true);

    try {
      const response = await fetch("/api/login", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ username, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data?.error || "Login failed");
        setLoading(false);
        return;
      }

      setUser(data);
      setLoading(false);
    } catch {
      setError("Could not reach API");
      setLoading(false);
    }
  }

  return (
    <div className="container">
      <div className="card">
        {user ? (
          <>
            <h1>FaMovie</h1>
            <p className="subtle">Welcome, {user.username}</p>
            <MovieSearch />
          </>
        ) : (
          <>
            <h1>Login</h1>
            <form onSubmit={onSubmit}>
              <label>
                Username
                <input
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  autoComplete="username"
                />
              </label>
              <label>
                Password
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete="current-password"
                />
              </label>
              <button type="submit" disabled={loading}>
                {loading ? "Signing in..." : "Sign in"}
              </button>
            </form>
            {error && <p className="error">{error}</p>}
          </>
        )}
      </div>
    </div>
  );
}
