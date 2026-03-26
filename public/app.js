const { useState } = React;

function App() {
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
        headers: {
          "content-type": "application/json",
        },
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

  return React.createElement(
    "div",
    { className: "container" },
    React.createElement(
      "div",
      { className: "card" },
      user
        ? React.createElement(
            React.Fragment,
            null,
            React.createElement("h1", null, "Dashboard"),
            React.createElement("p", { className: "subtle" }, "Username: ", user.username),
            React.createElement(
              "p",
              { className: "subtle" },
              "Last login: ",
              user.last_login_at || "Never"
            )
          )
        : React.createElement(
            React.Fragment,
            null,
            React.createElement("h1", null, "Login"),
            React.createElement(
              "form",
              { onSubmit },
              React.createElement(
                "label",
                null,
                "Username",
                React.createElement("input", {
                  value: username,
                  onChange: (event) => setUsername(event.target.value),
                  autoComplete: "username",
                })
              ),
              React.createElement(
                "label",
                null,
                "Password",
                React.createElement("input", {
                  type: "password",
                  value: password,
                  onChange: (event) => setPassword(event.target.value),
                  autoComplete: "current-password",
                })
              ),
              React.createElement(
                "button",
                { type: "submit", disabled: loading },
                loading ? "Signing in..." : "Sign in"
              )
            ),
            error ? React.createElement("p", { className: "error" }, error) : null
          )
    )
  );
}

ReactDOM.createRoot(document.getElementById("root")).render(React.createElement(App));
