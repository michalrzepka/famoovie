import { useState, useEffect } from "react";
import MovieSearch from "./components/MovieSearch";
import MovieCard from "./components/MovieCard";

function Toast({ message, type, onClose }) {
  useEffect(() => {
    const timer = setTimeout(onClose, 3000);
    return () => clearTimeout(timer);
  }, [onClose]);

  return (
    <div className={`toast toast-${type}`}>
      <span>{message}</span>
      <button className="toast-close" onClick={onClose}>×</button>
    </div>
  );
}

function ShortlistPage({ showToast }) {
  const [shortlist, setShortlist] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchShortlist();
  }, []);

  async function fetchShortlist() {
    try {
      const res = await fetch("/api/shortlist");
      const data = await res.json();
      setShortlist(data.movies || []);
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }

  async function addToShortlist(movie) {
    try {
      const res = await fetch("/api/shortlist", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          imdbId: movie.imdbId,
          title: movie.title,
          year: movie.year,
          poster: movie.poster,
          plot: movie.plot,
        }),
      });
      if (res.ok) {
        setShortlist([
          { imdb_id: movie.imdbId, title: movie.title, year: movie.year, poster: movie.poster, plot: movie.plot },
          ...shortlist,
        ]);
        showToast("Added to shortlist", "success");
      } else {
        const data = await res.json();
        showToast(data.error || "Failed to add", "error");
      }
    } catch {
      showToast("Failed to add movie", "error");
    }
  }

  async function removeFromShortlist(movie) {
    const imdbId = movie.imdb_id || movie.imdbId;
    try {
      const res = await fetch(`/api/shortlist?imdbId=${encodeURIComponent(imdbId)}`, {
        method: "DELETE",
      });
      if (res.ok) {
        setShortlist(shortlist.filter((m) => m.imdb_id !== imdbId));
        showToast("Removed from shortlist", "success");
      }
    } catch {
      showToast("Failed to remove movie", "error");
    }
  }

  const shortlistIds = shortlist.map((m) => m.imdb_id);

  if (loading) {
    return <p className="subtle">Loading shortlist...</p>;
  }

  return (
    <div className="shortlist-page">
      <MovieSearch onAdd={addToShortlist} shortlistIds={shortlistIds} />
      
      {shortlist.length > 0 && (
        <>
          <h2 className="shortlist-heading">My Shortlist</h2>
          <div className="movie-results">
            {shortlist.map((movie) => (
              <MovieCard
                key={movie.imdb_id}
                movie={{
                  imdbId: movie.imdb_id,
                  title: movie.title,
                  year: movie.year,
                  poster: movie.poster,
                  plot: movie.plot,
                }}
                onRemove={removeFromShortlist}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}

function SettingsPage({ showToast }) {
  const [locations, setLocations] = useState([]);
  const [newLocation, setNewLocation] = useState("");
  const [users, setUsers] = useState([]);
  const [newUsername, setNewUsername] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState({});

  useEffect(() => {
    async function fetchData() {
      try {
        const [usersRes, locationsRes] = await Promise.all([
          fetch("/api/users"),
          fetch("/api/locations"),
        ]);
        const usersData = await usersRes.json();
        const locationsData = await locationsRes.json();
        setUsers((usersData.users || []).map((u) => ({ ...u, password: "" })));
        setLocations(locationsData.locations || []);
      } catch {
        // ignore
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  async function addLocation(e) {
    e.preventDefault();
    if (!newLocation.trim()) return;
    try {
      const res = await fetch("/api/locations", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ name: newLocation.trim() }),
      });
      const data = await res.json();
      if (res.ok) {
        setLocations([...locations, data]);
        setNewLocation("");
        showToast("Location added", "success");
      } else {
        showToast(data.error || "Failed to add location", "error");
      }
    } catch {
      showToast("Failed to add location", "error");
    }
  }

  async function addUser(e) {
    e.preventDefault();
    if (!newUsername.trim() || !newPassword) return;
    try {
      const res = await fetch("/api/users", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ username: newUsername.trim(), password: newPassword }),
      });
      const data = await res.json();
      if (res.ok) {
        setUsers([...users, { ...data, password: "" }]);
        setNewUsername("");
        setNewPassword("");
        showToast("User added", "success");
      } else {
        showToast(data.error || "Failed to add user", "error");
      }
    } catch {
      showToast("Failed to add user", "error");
    }
  }

  function setUserPassword(id, password) {
    setUsers(users.map((u) => (u.id === id ? { ...u, password } : u)));
  }

  async function saveUserPassword(id) {
    const user = users.find((u) => u.id === id);
    if (!user?.password) return;
    setSaving((s) => ({ ...s, [id]: true }));
    try {
      const res = await fetch(`/api/users/${id}/password`, {
        method: "PUT",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ password: user.password }),
      });
      const data = await res.json();
      if (res.ok) {
        setUsers(users.map((u) => (u.id === id ? { ...u, password: "" } : u)));
        showToast("Password updated", "success");
      } else {
        showToast(data.error || "Failed to update password", "error");
      }
    } catch {
      showToast("Failed to update password", "error");
    } finally {
      setSaving((s) => ({ ...s, [id]: false }));
    }
  }

  function formatDate(iso) {
    if (!iso) return "—";
    return new Date(iso).toLocaleDateString();
  }

  function formatDateTime(iso) {
    if (!iso) return "—";
    const d = new Date(iso);
    return `${d.toLocaleDateString()} ${d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`;
  }

  if (loading) {
    return <p className="subtle">Loading settings...</p>;
  }

  return (
    <div className="settings-page">
      <div className="settings-card">
        <h2>Locations</h2>
        <div className="settings-list">
          {locations.map((loc) => (
            <div key={loc.id} className="settings-item">
              <span>{loc.name}</span>
            </div>
          ))}
        </div>
        <form className="settings-add" onSubmit={addLocation}>
          <input
            placeholder="New location"
            value={newLocation}
            onChange={(e) => setNewLocation(e.target.value)}
          />
          <button type="submit">Add</button>
        </form>
      </div>

      <div className="settings-card">
        <h2>Users</h2>
        <div className="users-table-wrap">
          <table className="users-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Created</th>
                <th>Last Login</th>
                <th>Password</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr key={u.id}>
                  <td>{u.username}</td>
                  <td>{formatDate(u.created_at)}</td>
                  <td>{formatDateTime(u.last_login_at)}</td>
                  <td>
                    <input
                      type="password"
                      placeholder="New password"
                      value={u.password}
                      onChange={(e) => setUserPassword(u.id, e.target.value)}
                    />
                  </td>
                  <td>
                    <button
                      className="btn-small"
                      onClick={() => saveUserPassword(u.id)}
                      disabled={!u.password || saving[u.id]}
                    >
                      {saving[u.id] ? "..." : "Save"}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <form className="settings-add" onSubmit={addUser}>
          <input
            placeholder="Username"
            value={newUsername}
            onChange={(e) => setNewUsername(e.target.value)}
          />
          <input
            type="password"
            placeholder="Password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
          />
          <button type="submit" disabled={!newUsername.trim() || !newPassword}>Add</button>
        </form>
      </div>
    </div>
  );
}

export default function App() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [checkingSession, setCheckingSession] = useState(true);
  const [error, setError] = useState("");
  const [user, setUser] = useState(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [page, setPage] = useState("home");
  const [toast, setToast] = useState(null);

  function showToast(message, type = "success") {
    setToast({ message, type, key: Date.now() });
  }

  useEffect(() => {
    async function checkSession() {
      try {
        const res = await fetch("/api/me");
        const data = await res.json();
        if (data?.username) {
          setUser(data);
        }
      } catch {
        // ignore - user will see login form
      } finally {
        setCheckingSession(false);
      }
    }
    checkSession();
  }, []);

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

  function navigateTo(newPage) {
    setPage(newPage);
    setMenuOpen(false);
  }

  const isAdmin = user?.username === "admin";

  const menuContent = (
    <ul className="menu-list">
      <li>
        <button className={page === "home" ? "active" : ""} onClick={() => navigateTo("home")}>
          Home
        </button>
      </li>
      <li>
        <button className={page === "shortlist" ? "active" : ""} onClick={() => navigateTo("shortlist")}>
          Shortlist
        </button>
      </li>
      {isAdmin && (
        <li>
          <button className={page === "settings" ? "active" : ""} onClick={() => navigateTo("settings")}>
            Settings
          </button>
        </li>
      )}
    </ul>
  );

  if (checkingSession) {
    return (
      <div className="container">
        <div className="card">
          <p className="subtle">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      {toast && (
        <Toast
          key={toast.key}
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}

      {user && (
        <>
          <div className={`menu-overlay ${menuOpen ? "open" : ""}`} onClick={() => setMenuOpen(false)} />
          <nav className={`menu-drawer ${menuOpen ? "open" : ""}`}>
            <div className="menu-header">
              <span>Menu</span>
              <button className="btn-icon" onClick={() => setMenuOpen(false)}>×</button>
            </div>
            {menuContent}
          </nav>
        </>
      )}

      <div className="container">
        {user && (
          <header className="app-header">
            <button className="hamburger" onClick={() => setMenuOpen(true)}>
              <span></span>
              <span></span>
              <span></span>
            </button>
            <h1 className="app-title">FaMovie</h1>
          </header>
        )}

        <div className={`card ${user ? "card-with-sidebar" : ""}`}>
          {user ? (
            <>
              <aside className="card-sidebar">
                <div className="sidebar-title">FaMovie</div>
                {menuContent}
              </aside>
              <main className="card-content">
                {page === "home" && (
                  <p className="subtle">Welcome, {user.username}</p>
                )}
                {page === "shortlist" && <ShortlistPage showToast={showToast} />}
                {page === "settings" && isAdmin && <SettingsPage showToast={showToast} />}
              </main>
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
    </>
  );
}
