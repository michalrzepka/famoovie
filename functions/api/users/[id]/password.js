function jsonResponse(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "content-type": "application/json; charset=utf-8" },
  });
}

export async function onRequestPut(context) {
  const { request, env, params } = context;
  const userId = params.id;

  let payload;
  try {
    payload = await request.json();
  } catch {
    return jsonResponse({ error: "Invalid JSON body" }, 400);
  }

  const password = String(payload?.password || "");

  if (!password) {
    return jsonResponse({ error: "Password is required" }, 400);
  }

  const user = await env.DB.prepare("SELECT id FROM users WHERE id = ? LIMIT 1")
    .bind(userId)
    .first();

  if (!user) {
    return jsonResponse({ error: "User not found" }, 404);
  }

  await env.DB.prepare("UPDATE users SET password = ? WHERE id = ?")
    .bind(password, userId)
    .run();

  return jsonResponse({ success: true });
}
