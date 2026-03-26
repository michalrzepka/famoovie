function jsonResponse(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "content-type": "application/json; charset=utf-8" },
  });
}

function parseCookies(cookieHeader) {
  const cookies = {};
  if (!cookieHeader) return cookies;
  cookieHeader.split(";").forEach((c) => {
    const [key, ...val] = c.trim().split("=");
    cookies[key] = val.join("=");
  });
  return cookies;
}

export async function onRequestGet(context) {
  const { request, env } = context;

  const cookieHeader = request.headers.get("cookie");
  const cookies = parseCookies(cookieHeader);
  const userId = cookies.user_id;

  if (!userId) {
    return jsonResponse({ user: null });
  }

  const user = await env.DB.prepare(
    "SELECT username, last_login_at FROM users WHERE id = ? LIMIT 1"
  )
    .bind(userId)
    .first();

  if (!user) {
    return jsonResponse({ user: null });
  }

  return jsonResponse({
    username: user.username,
    last_login_at: user.last_login_at,
  });
}
