import { useState } from "react";
import MovieSearch from "./components/MovieSearch";

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
