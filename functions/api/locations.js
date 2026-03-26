function jsonResponse(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "content-type": "application/json; charset=utf-8" },
  });
}

export async function onRequestGet(context) {
  const { env } = context;

  const result = await env.DB.prepare(
    "SELECT id, name, created_at FROM locations ORDER BY created_at"
  ).all();

  return jsonResponse({ locations: result.results });
}

export async function onRequestPost(context) {
  const { request, env } = context;

  let payload;
  try {
    payload = await request.json();
  } catch {
    return jsonResponse({ error: "Invalid JSON body" }, 400);
  }

  const name = String(payload?.name || "").trim();

  if (!name) {
    return jsonResponse({ error: "Location name is required" }, 400);
  }

  const existing = await env.DB.prepare(
    "SELECT id FROM locations WHERE name = ? LIMIT 1"
  )
    .bind(name)
    .first();

  if (existing) {
    return jsonResponse({ error: "Location already exists" }, 409);
  }

  const id = crypto.randomUUID();
  const now = new Date().toISOString();

  await env.DB.prepare(
    "INSERT INTO locations (id, name, created_at) VALUES (?, ?, ?)"
  )
    .bind(id, name, now)
    .run();

  return jsonResponse({
    id,
    name,
    created_at: now,
  }, 201);
}
