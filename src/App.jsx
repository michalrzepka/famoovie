import { useState } from "react";
import MovieSearch from "./components/MovieSearch";

function SettingsPage() {
  const [locations, setLocations] = useState([{ id: 1, name: "home" }]);
  const [newLocation, setNewLocation] = useState("");
  const [users, setUsers] = useState([
    { id: 1, username: "alice", password: "" },
    { id: 2, username: "bob", password: "" },
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
    setUsers([...users, { id: Date.now(), username: newUsername.trim(), password: "" }]);
    setNewUsername("");
  }

  function removeUser(id) {
    setUsers(users.filter((u) => u.id !== id));
  }

  function setUserPassword(id, password) {
    setUsers(users.map((u) => (u.id === id ? { ...u, password } : u)));
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
        <div className="settings-list">
          {users.map((u) => (
            <div key={u.id} className="settings-user">
              <div className="settings-user-header">
                <span>{u.username}</span>
                <button className="btn-icon" onClick={() => removeUser(u.id)}>×</button>
              </div>
              <input
                type="password"
                placeholder="Set password"
                value={u.password}
                onChange={(e) => setUserPassword(u.id, e.target.value)}
              />
            </div>
          ))}
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
  const [error, setError] = useState("");
  const [user, setUser] = useState(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [page, setPage] = useState("home");

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

  const isAdmin = user?.is_admin;

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

        <div className="card">
          {user ? (
            <>
              {page === "home" && (
                <>
                  <p className="subtle">Welcome, {user.username}</p>
                  <MovieSearch />
                </>
              )}
              {page === "settings" && isAdmin && <SettingsPage />}
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
