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

async function getUser(db, userId) {
  if (!userId) return null;
  return db.prepare("SELECT id, username FROM users WHERE id = ?").bind(userId).first();
}

export async function onRequestGet(context) {
  const userId = getUserId(context.request);
  if (!userId) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const db = context.env.DB;
  const user = await getUser(db, userId);
  if (!user) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const nightId = context.params.id;

  const night = await db.prepare(`
    SELECT 
      mn.id, mn.location_id, mn.host_id, mn.movie_count, mn.event_date, mn.status, mn.created_at,
      l.name as location_name,
      u.username as host_name
    FROM movie_nights mn
    JOIN locations l ON mn.location_id = l.id
    JOIN users u ON mn.host_id = u.id
    WHERE mn.id = ?
  `).bind(nightId).first();

  if (!night) {
    return Response.json({ error: "Movie night not found" }, { status: 404 });
  }

  const isHost = night.host_id === userId;
  const canSeeMovies = night.status !== "draft" || isHost;

  let movies = [];
  if (canSeeMovies) {
    const { results } = await db.prepare(`
      SELECT imdb_id, title, year, poster, plot, added_at
      FROM movie_night_movies
      WHERE movie_night_id = ?
      ORDER BY added_at
    `).bind(nightId).all();
    movies = results;
  }

  return Response.json({
    ...night,
    movies,
    isHost,
  });
}

export async function onRequestDelete(context) {
  const userId = getUserId(context.request);
  if (!userId) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const db = context.env.DB;
  const user = await getUser(db, userId);
  if (!user || user.username !== "admin") {
    return Response.json({ error: "Admin access required" }, { status: 403 });
  }

  const nightId = context.params.id;

  const night = await db.prepare("SELECT id FROM movie_nights WHERE id = ?").bind(nightId).first();
  if (!night) {
    return Response.json({ error: "Movie night not found" }, { status: 404 });
  }

  await db.prepare("DELETE FROM movie_night_movies WHERE movie_night_id = ?").bind(nightId).run();
  await db.prepare("DELETE FROM movie_nights WHERE id = ?").bind(nightId).run();

  return Response.json({ success: true });
}
