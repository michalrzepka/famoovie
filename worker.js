function jsonResponse(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "content-type": "application/json; charset=utf-8" },
  });
}

async function handleLogin(request, env) {
  let payload;
  try {
    payload = await request.json();
  } catch {
    return jsonResponse({ error: "Invalid JSON body" }, 400);
  }

  const username = String(payload?.username || "").trim();
  const password = String(payload?.password || "");

  if (!username || !password) {
    return jsonResponse({ error: "Username and password are required" }, 400);
  }

  const userResult = await env.DB.prepare(
    "SELECT id, username, last_login_at FROM users WHERE username = ? AND password = ? LIMIT 1"
  )
    .bind(username, password)
    .first();

  if (!userResult) {
    return jsonResponse({ error: "Invalid credentials" }, 401);
  }

  const now = new Date().toISOString();

  await env.DB.prepare("UPDATE users SET last_login_at = ? WHERE id = ?")
    .bind(now, userResult.id)
    .run();

  const updatedUser = await env.DB.prepare(
    "SELECT username, last_login_at FROM users WHERE id = ? LIMIT 1"
  )
    .bind(userResult.id)
    .first();

  return jsonResponse({
    username: updatedUser.username,
    last_login_at: updatedUser.last_login_at,
  });
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    if (url.pathname === "/api/login" && request.method === "POST") {
      return handleLogin(request, env);
    }

    if (url.pathname.startsWith("/api/")) {
      return jsonResponse({ error: "Not found" }, 404);
    }

    return env.ASSETS.fetch(request);
  },
};
