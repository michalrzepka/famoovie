function parseCookies(cookieHeader) {
  const cookies = {};
  if (!cookieHeader) return cookies;
  cookieHeader.split(";").forEach((c) => {
    const [key, ...val] = c.trim().split("=");
    cookies[key] = val.join("=");
  });
  return cookies;
}

function getUserId(request) {
  const cookieHeader = request.headers.get("cookie");
  const cookies = parseCookies(cookieHeader);
  return cookies.user_id;
}

export async function onRequestPost(context) {
  const userId = getUserId(context.request);
  if (!userId) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const db = context.env.DB;
  const nightId = context.params.id;

  const night = await db.prepare("SELECT id, host_id, status FROM movie_nights WHERE id = ?").bind(nightId).first();
  if (!night) {
    return Response.json({ error: "Movie night not found" }, { status: 404 });
  }

  if (night.host_id !== userId) {
    return Response.json({ error: "Only the host can add movies" }, { status: 403 });
  }

  if (night.status !== "draft") {
    return Response.json({ error: "Can only add movies in draft status" }, { status: 400 });
  }

  let body;
  try {
    body = await context.request.json();
  } catch {
    return Response.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const { imdbId, title, year, poster, plot } = body;

  if (!imdbId || !title) {
    return Response.json({ error: "imdbId and title are required" }, { status: 400 });
  }

  try {
    await db.prepare(`
      INSERT INTO movie_night_movies (movie_night_id, imdb_id, title, year, poster, plot)
      VALUES (?, ?, ?, ?, ?, ?)
    `).bind(nightId, imdbId, title, year || null, poster || null, plot || null).run();

    return Response.json({ success: true, imdbId });
  } catch (err) {
    if (err.message?.includes("UNIQUE constraint")) {
      return Response.json({ error: "Movie already added to this night" }, { status: 409 });
    }
    throw err;
  }
}

export async function onRequestDelete(context) {
  const userId = getUserId(context.request);
  if (!userId) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const db = context.env.DB;
  const nightId = context.params.id;

  const night = await db.prepare("SELECT id, host_id, status FROM movie_nights WHERE id = ?").bind(nightId).first();
  if (!night) {
    return Response.json({ error: "Movie night not found" }, { status: 404 });
  }

  if (night.host_id !== userId) {
    return Response.json({ error: "Only the host can remove movies" }, { status: 403 });
  }

  if (night.status !== "draft") {
    return Response.json({ error: "Can only remove movies in draft status" }, { status: 400 });
  }

  const url = new URL(context.request.url);
  const imdbId = url.searchParams.get("imdbId");

  if (!imdbId) {
    return Response.json({ error: "imdbId is required" }, { status: 400 });
  }

  await db.prepare("DELETE FROM movie_night_movies WHERE movie_night_id = ? AND imdb_id = ?")
    .bind(nightId, imdbId).run();

  return Response.json({ success: true });
}
