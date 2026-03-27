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

  const night = await db.prepare("SELECT id, host_id, status, movie_count FROM movie_nights WHERE id = ?")
    .bind(nightId).first();

  if (!night) {
    return Response.json({ error: "Movie night not found" }, { status: 404 });
  }

  if (night.host_id !== userId) {
    return Response.json({ error: "Only the host can begin voting" }, { status: 403 });
  }

  if (night.status !== "draft") {
    return Response.json({ error: "Voting has already begun" }, { status: 400 });
  }

  const countResult = await db.prepare("SELECT COUNT(*) as count FROM movie_night_movies WHERE movie_night_id = ?")
    .bind(nightId).first();
  const movieCount = countResult?.count || 0;

  if (movieCount !== night.movie_count) {
    return Response.json({ 
      error: `Exactly ${night.movie_count} movies are required to begin voting (currently ${movieCount})` 
    }, { status: 400 });
  }

  await db.prepare("UPDATE movie_nights SET status = 'voting' WHERE id = ?").bind(nightId).run();

  return Response.json({ success: true, status: "voting" });
}
