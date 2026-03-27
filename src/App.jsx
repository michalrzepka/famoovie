import { useState, useEffect } from "react";
import MovieSearch from "./components/MovieSearch";
import MovieCard from "./components/MovieCard";
import Pinpad from "./components/Pinpad";
import Toast from "./components/Toast";

function HomePage({ user, showToast }) {
  const [night, setNight] = useState(null);
  const [loading, setLoading] = useState(true);
  const [shortlist, setShortlist] = useState([]);
  const [showShortlist, setShowShortlist] = useState(false);
  const [showSearch, setShowSearch] = useState(false);
  const [beginningVoting, setBeginningVoting] = useState(false);

  const userId = user?.id;
  const isHost = night?.isHost;
  const isDraft = night?.status === "draft";

  useEffect(() => {
    fetchUpcomingNight();
  }, []);

  async function fetchUpcomingNight() {
    try {
      const res = await fetch("/api/movie-nights");
      const data = await res.json();
      const nights = data.movieNights || [];
      const upcoming = nights.find((n) => n.status !== "completed");
      
      if (upcoming) {
        const detailRes = await fetch(`/api/movie-nights/${upcoming.id}`);
        const detail = await detailRes.json();
        setNight(detail);
      }
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }

  async function fetchShortlist() {
    try {
      const res = await fetch("/api/shortlist");
      const data = await res.json();
      setShortlist(data.movies || []);
    } catch {
      // ignore
    }
  }

  async function addMovieToNight(movie) {
    if (!night) return;
    try {
      const res = await fetch(`/api/movie-nights/${night.id}/movies`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          imdbId: movie.imdbId || movie.imdb_id,
          title: movie.title,
          year: movie.year,
          poster: movie.poster,
          plot: movie.plot,
        }),
      });
      if (res.ok) {
        const newMovie = {
          imdb_id: movie.imdbId || movie.imdb_id,
          title: movie.title,
          year: movie.year,
          poster: movie.poster,
          plot: movie.plot,
        };
        setNight({ ...night, movies: [...(night.movies || []), newMovie] });
        showToast("Movie added to night", "success");
      } else {
        const data = await res.json();
        showToast(data.error || "Failed to add movie", "error");
      }
    } catch {
      showToast("Failed to add movie", "error");
    }
  }

  async function removeMovieFromNight(imdbId) {
    if (!night) return;
    try {
      const res = await fetch(`/api/movie-nights/${night.id}/movies?imdbId=${encodeURIComponent(imdbId)}`, {
        method: "DELETE",
      });
      if (res.ok) {
        setNight({ ...night, movies: night.movies.filter((m) => m.imdb_id !== imdbId) });
        showToast("Movie removed", "success");
      }
    } catch {
      showToast("Failed to remove movie", "error");
    }
  }

  async function beginVoting() {
    if (!night) return;
    setBeginningVoting(true);
    try {
      const res = await fetch(`/api/movie-nights/${night.id}/begin-voting`, { method: "POST" });
      const data = await res.json();
      if (res.ok) {
        setNight({ ...night, status: "voting" });
        showToast("Voting has begun!", "success");
      } else {
        showToast(data.error || "Failed to begin voting", "error");
      }
    } catch {
      showToast("Failed to begin voting", "error");
    } finally {
      setBeginningVoting(false);
    }
  }

  function handleShowShortlist() {
    fetchShortlist();
    setShowShortlist(true);
    setShowSearch(false);
  }

  function formatDate(dateStr) {
    if (!dateStr) return "";
    const d = new Date(dateStr);
    return d.toLocaleDateString(undefined, { weekday: "long", month: "long", day: "numeric" });
  }

  const nightMovieIds = (night?.movies || []).map((m) => m.imdb_id);
  const canBeginVoting = isDraft && isHost && night?.movies?.length === night?.movie_count;

  if (loading) {
    return <p className="subtle">Loading...</p>;
  }

  if (!night) {
    return (
      <div className="home-page">
        <p className="subtle">No movie night scheduled.</p>
      </div>
    );
  }

  return (
    <div className="home-page">
      <div className="upcoming-night">
        <h2>Upcoming Movie Night</h2>
        <div className="night-banner">
          <div className="night-banner-date">{formatDate(night.event_date)}</div>
          <div className="night-banner-meta">
            <span>{night.location_name}</span>
            <span className="separator">•</span>
            <span>Hosted by {night.host_name}</span>
          </div>
        </div>

        {isDraft && !isHost && (
          <p className="subtle host-preparing">Host is selecting movies...</p>
        )}

        {isDraft && isHost && (
          <div className="host-controls">
            <div className="host-header">
              <h3>Your Selection ({night.movies?.length || 0}/{night.movie_count})</h3>
              <div className="host-actions">
                <button className="btn-secondary" onClick={handleShowShortlist}>
                  Add from Shortlist
                </button>
                <button className="btn-secondary" onClick={() => { setShowSearch(true); setShowShortlist(false); }}>
                  Search Movies
                </button>
              </div>
            </div>

            {night.movies?.length > 0 && (
              <div className="movie-results draft-movies">
                {night.movies.map((movie) => (
                  <MovieCard
                    key={movie.imdb_id}
                    movie={{
                      imdbId: movie.imdb_id,
                      title: movie.title,
                      year: movie.year,
                      poster: movie.poster,
                      plot: movie.plot,
                    }}
                    onRemove={() => removeMovieFromNight(movie.imdb_id)}
                  />
                ))}
              </div>
            )}

            {canBeginVoting && (
              <button 
                className="btn-begin-voting" 
                onClick={beginVoting}
                disabled={beginningVoting}
              >
                {beginningVoting ? "Starting..." : "Begin Voting"}
              </button>
            )}

            {showShortlist && (
              <div className="add-from-section">
                <h4>Add from Shortlist</h4>
                {shortlist.length === 0 ? (
                  <p className="subtle">Your shortlist is empty.</p>
                ) : (
                  <div className="movie-results">
                    {shortlist.filter((m) => !nightMovieIds.includes(m.imdb_id)).map((movie) => (
                      <MovieCard
                        key={movie.imdb_id}
                        movie={{
                          imdbId: movie.imdb_id,
                          title: movie.title,
                          year: movie.year,
                          poster: movie.poster,
                          plot: movie.plot,
                        }}
                        onAdd={() => addMovieToNight(movie)}
                      />
                    ))}
                  </div>
                )}
              </div>
            )}

            {showSearch && (
              <div className="add-from-section">
                <h4>Search Movies</h4>
                <MovieSearch 
                  onAdd={addMovieToNight} 
                  shortlistIds={nightMovieIds}
                  showToast={showToast}
                />
              </div>
            )}
          </div>
        )}

        {night.status === "voting" && night.movies?.length > 0 && (
          <div className="voting-movies">
            <h3>Movies</h3>
            <div className="movie-results">
              {night.movies.map((movie) => (
                <MovieCard
                  key={movie.imdb_id}
                  movie={{
                    imdbId: movie.imdb_id,
                    title: movie.title,
                    year: movie.year,
                    poster: movie.poster,
                    plot: movie.plot,
                  }}
                />
              ))}
            </div>
          </div>
        )}
      </div>
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
      <MovieSearch onAdd={addToShortlist} shortlistIds={shortlistIds} showToast={showToast} />
      
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

function MovieNightsPage({ showToast }) {
  const [nights, setNights] = useState([]);
  const [locations, setLocations] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ locationId: "", hostId: "", movieCount: 3, eventDate: "" });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    async function fetchData() {
      try {
        const [nightsRes, locationsRes, usersRes] = await Promise.all([
          fetch("/api/movie-nights"),
          fetch("/api/locations"),
          fetch("/api/users"),
        ]);
        const [nightsData, locationsData, usersData] = await Promise.all([
          nightsRes.json(),
          locationsRes.json(),
          usersRes.json(),
        ]);
        setNights(nightsData.movieNights || []);
        setLocations(locationsData.locations || []);
        setUsers(usersData.users || []);
      } catch {
        showToast("Failed to load data", "error");
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  async function createNight(e) {
    e.preventDefault();
    if (!form.locationId || !form.hostId || !form.eventDate) return;
    setSaving(true);
    try {
      const res = await fetch("/api/movie-nights", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (res.ok) {
        const location = locations.find((l) => l.id === form.locationId);
        const host = users.find((u) => u.id === form.hostId);
        setNights([{ ...data, location_name: location?.name, host_name: host?.username }, ...nights]);
        setForm({ locationId: "", hostId: "", movieCount: 3, eventDate: "" });
        setShowForm(false);
        showToast("Movie night created", "success");
      } else {
        showToast(data.error || "Failed to create", "error");
      }
    } catch {
      showToast("Failed to create movie night", "error");
    } finally {
      setSaving(false);
    }
  }

  async function deleteNight(id) {
    if (!confirm("Delete this movie night?")) return;
    try {
      const res = await fetch(`/api/movie-nights/${id}`, { method: "DELETE" });
      if (res.ok) {
        setNights(nights.filter((n) => n.id !== id));
        showToast("Movie night deleted", "success");
      } else {
        const data = await res.json();
        showToast(data.error || "Failed to delete", "error");
      }
    } catch {
      showToast("Failed to delete movie night", "error");
    }
  }

  function formatDate(dateStr) {
    if (!dateStr) return "—";
    return new Date(dateStr).toLocaleDateString();
  }

  function statusBadge(status) {
    const colors = { draft: "bg-yellow-600", voting: "bg-emerald-600", completed: "bg-slate-600" };
    return <span className={`status-badge ${colors[status] || ""}`}>{status}</span>;
  }

  if (loading) {
    return <p className="subtle">Loading movie nights...</p>;
  }

  return (
    <div className="movie-nights-page">
      <div className="page-header">
        <h2>Movie Nights</h2>
        <button className="btn-primary" onClick={() => setShowForm(!showForm)}>
          {showForm ? "Cancel" : "+ New Night"}
        </button>
      </div>

      {showForm && (
        <form className="create-night-form" onSubmit={createNight}>
          <label>
            Location
            <select value={form.locationId} onChange={(e) => setForm({ ...form, locationId: e.target.value })}>
              <option value="">Select location...</option>
              {locations.map((l) => <option key={l.id} value={l.id}>{l.name}</option>)}
            </select>
          </label>
          <label>
            Host
            <select value={form.hostId} onChange={(e) => setForm({ ...form, hostId: e.target.value })}>
              <option value="">Select host...</option>
              {users.map((u) => <option key={u.id} value={u.id}>{u.username}</option>)}
            </select>
          </label>
          <label>
            Movie Count
            <input
              type="number"
              min="1"
              max="10"
              value={form.movieCount}
              onChange={(e) => setForm({ ...form, movieCount: parseInt(e.target.value) || 3 })}
            />
          </label>
          <label>
            Date
            <input
              type="date"
              value={form.eventDate}
              onChange={(e) => setForm({ ...form, eventDate: e.target.value })}
            />
          </label>
          <button type="submit" disabled={saving || !form.locationId || !form.hostId || !form.eventDate}>
            {saving ? "Creating..." : "Create Movie Night"}
          </button>
        </form>
      )}

      {nights.length === 0 ? (
        <p className="subtle">No movie nights yet.</p>
      ) : (
        <div className="nights-list">
          {nights.map((night) => (
            <div key={night.id} className="night-card">
              <div className="night-info">
                <div className="night-date">{formatDate(night.event_date)}</div>
                <div className="night-details">
                  <span>{night.location_name}</span>
                  <span className="separator">•</span>
                  <span>Host: {night.host_name}</span>
                  <span className="separator">•</span>
                  {statusBadge(night.status)}
                </div>
              </div>
              <button className="btn-danger btn-small" onClick={() => deleteNight(night.id)}>Delete</button>
            </div>
          ))}
        </div>
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
                      autoComplete="off"
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
        <form className="settings-add" onSubmit={addUser} autoComplete="off">
          <input
            placeholder="Username"
            value={newUsername}
            autoComplete="off"
            onChange={(e) => setNewUsername(e.target.value)}
          />
          <input
            type="password"
            placeholder="Password"
            value={newPassword}
            autoComplete="off"
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

  async function onSubmit(event, pin) {
    event.preventDefault();
    setLoading(true);

    const pinToUse = pin || password;

    try {
      const response = await fetch("/api/login", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ username, password: pinToUse }),
      });

      const data = await response.json();

      if (!response.ok) {
        showToast(data?.error || "Login failed", "error");
        setLoading(false);
        return;
      }

      setUser(data);
      setLoading(false);
    } catch {
      showToast("Could not reach API", "error");
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
        <>
          <li>
            <button className={page === "movie-nights" ? "active" : ""} onClick={() => navigateTo("movie-nights")}>
              Movie Nights
            </button>
          </li>
          <li>
            <button className={page === "settings" ? "active" : ""} onClick={() => navigateTo("settings")}>
              Settings
            </button>
          </li>
        </>
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
                {page === "home" && <HomePage user={user} showToast={showToast} />}
                {page === "shortlist" && <ShortlistPage showToast={showToast} />}
                {page === "movie-nights" && isAdmin && <MovieNightsPage showToast={showToast} />}
                {page === "settings" && isAdmin && <SettingsPage showToast={showToast} />}
              </main>
            </>
          ) : (
            <>
              <h1>Login</h1>
              <label>
                Username
                <input
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  autoComplete="username"
                />
              </label>
              {username && (
                <Pinpad
                  label="Enter PIN"
                  onSubmit={(pin) => {
                    setPassword(pin);
                    onSubmit({ preventDefault: () => {} }, pin);
                  }}
                  disabled={loading}
                />
              )}
              {loading && <p className="subtle">Signing in...</p>}
            </>
          )}
        </div>
      </div>
    </>
  );
}
