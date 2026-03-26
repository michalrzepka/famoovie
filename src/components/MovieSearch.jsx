import { useState, useEffect, useRef } from "react";
import { useDebounce } from "../hooks/useDebounce";
import MovieCard from "./MovieCard";

export default function MovieSearch() {
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
