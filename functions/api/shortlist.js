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

export async function onRequestGet(context) {
  const userId = getUserId(context.request);
  if (!userId) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const db = context.env.DB;
  const { results } = await db
    .prepare("SELECT imdb_id, title, year, poster, plot, added_at FROM shortlist WHERE user_id = ? ORDER BY added_at DESC")
    .bind(userId)
    .all();

  return Response.json({ movies: results });
}

export async function onRequestPost(context) {
  const userId = getUserId(context.request);
  if (!userId) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await context.request.json();
  const { imdbId, title, year, poster, plot } = body;

  if (!imdbId || !title) {
    return Response.json({ error: "imdbId and title are required" }, { status: 400 });
  }

  const db = context.env.DB;
  
  try {
    await db
      .prepare("INSERT INTO shortlist (user_id, imdb_id, title, year, poster, plot) VALUES (?, ?, ?, ?, ?, ?)")
      .bind(userId, imdbId, title, year || null, poster || null, plot || null)
      .run();

    return Response.json({ success: true, imdbId });
  } catch (err) {
    if (err.message?.includes("UNIQUE constraint")) {
      return Response.json({ error: "Movie already in shortlist" }, { status: 409 });
    }
    throw err;
  }
}

export async function onRequestDelete(context) {
  const userId = getUserId(context.request);
  if (!userId) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const url = new URL(context.request.url);
  const imdbId = url.searchParams.get("imdbId");

  if (!imdbId) {
    return Response.json({ error: "imdbId is required" }, { status: 400 });
  }

  const db = context.env.DB;
  await db
    .prepare("DELETE FROM shortlist WHERE user_id = ? AND imdb_id = ?")
    .bind(userId, imdbId)
    .run();

  return Response.json({ success: true });
}
