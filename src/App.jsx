import { useState, useEffect } from "react";
import MovieSearch from "./components/MovieSearch";

function SettingsPage() {
  const [locations, setLocations] = useState([{ id: 1, name: "home" }]);
  const [newLocation, setNewLocation] = useState("");
  const [users, setUsers] = useState([
    { id: 1, username: "alice", created_at: "2026-03-26", last_login_at: "2026-03-27 10:15:32", password: "" },
    { id: 2, username: "bob", created_at: "2026-03-26", last_login_at: null, password: "" },
  ]);
  const [newUsername, setNewUsername] = useState("");

  function addLocation(e) {
    e.preventDefault();
    if (!newLocation.trim()) return;
    setLocations([...locations, { id: Date.now(), name: newLocation.trim() }]);
    setNewLocation("");
  }

  function removeLocation(id) {
    setLocations(locations.filter((l) => l.id !== id));
  }

  function addUser(e) {
    e.preventDefault();
    if (!newUsername.trim()) return;
    const today = new Date().toISOString().split("T")[0];
    setUsers([...users, { id: Date.now(), username: newUsername.trim(), created_at: today, last_login_at: null, password: "" }]);
    setNewUsername("");
  }

  function setUserPassword(id, password) {
    setUsers(users.map((u) => (u.id === id ? { ...u, password } : u)));
  }

  function saveUserPassword(id) {
    const user = users.find((u) => u.id === id);
    if (user?.password) {
      alert(`Password for ${user.username} would be saved (no DB yet)`);
    }
  }

  return (
    <div className="settings-page">
      <div className="settings-card">
        <h2>Locations</h2>
        <div className="settings-list">
          {locations.map((loc) => (
            <div key={loc.id} className="settings-item">
              <span>{loc.name}</span>
              <button className="btn-icon" onClick={() => removeLocation(loc.id)}>×</button>
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
                  <td>{u.created_at}</td>
                  <td>{u.last_login_at || "—"}</td>
                  <td>
                    <input
                      type="password"
                      placeholder="Password"
                      value={u.password}
                      onChange={(e) => setUserPassword(u.id, e.target.value)}
                    />
                  </td>
                  <td>
                    <button className="btn-small" onClick={() => saveUserPassword(u.id)}>Save</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <form className="settings-add" onSubmit={addUser}>
          <input
            placeholder="New username"
            value={newUsername}
            onChange={(e) => setNewUsername(e.target.value)}
          />
          <button type="submit">Add</button>
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
                  <>
                    <p className="subtle">Welcome, {user.username}</p>
                    <MovieSearch />
                  </>
                )}
                {page === "settings" && isAdmin && <SettingsPage />}
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
