function jsonResponse(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "content-type": "application/json; charset=utf-8" },
  });
}

export async function onRequestGet(context) {
  const { env } = context;

  const result = await env.DB.prepare(
    "SELECT id, username, created_at, last_login_at FROM users ORDER BY created_at"
  ).all();

  return jsonResponse({ users: result.results });
}

export async function onRequestPost(context) {
  const { request, env } = context;

  let payload;
  try {
    payload = await request.json();
  } catch {
    return jsonResponse({ error: "Invalid JSON body" }, 400);
  }

  const username = String(payload?.username || "").trim();
  const password = String(payload?.password || "");

  if (!username) {
    return jsonResponse({ error: "Username is required" }, 400);
  }
  if (!password) {
    return jsonResponse({ error: "Password is required" }, 400);
  }

  const existing = await env.DB.prepare(
    "SELECT id FROM users WHERE username = ? LIMIT 1"
  )
    .bind(username)
    .first();

  if (existing) {
    return jsonResponse({ error: "Username already exists" }, 409);
  }

  const id = crypto.randomUUID();
  const now = new Date().toISOString();

  await env.DB.prepare(
    "INSERT INTO users (id, username, password, created_at) VALUES (?, ?, ?, ?)"
  )
    .bind(id, username, password, now)
    .run();

  return jsonResponse({
    id,
    username,
    created_at: now,
    last_login_at: null,
  }, 201);
}
