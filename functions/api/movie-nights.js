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

  const isAdmin = user.username === "admin";

  let query = `
    SELECT 
      mn.id, mn.location_id, mn.host_id, mn.movie_count, mn.event_date, mn.status, mn.created_at,
      l.name as location_name,
      u.username as host_name
    FROM movie_nights mn
    JOIN locations l ON mn.location_id = l.id
    JOIN users u ON mn.host_id = u.id
  `;

  if (!isAdmin) {
    query += ` WHERE mn.event_date >= date('now') ORDER BY mn.event_date ASC`;
  } else {
    query += ` ORDER BY mn.event_date DESC`;
  }

  const { results } = await db.prepare(query).all();

  return Response.json({ movieNights: results });
}

export async function onRequestPost(context) {
  const userId = getUserId(context.request);
  if (!userId) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const db = context.env.DB;
  const user = await getUser(db, userId);
  if (!user || user.username !== "admin") {
    return Response.json({ error: "Admin access required" }, { status: 403 });
  }

  let body;
  try {
    body = await context.request.json();
  } catch {
    return Response.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const { locationId, hostId, movieCount = 3, eventDate } = body;

  if (!locationId) {
    return Response.json({ error: "Location is required" }, { status: 400 });
  }
  if (!hostId) {
    return Response.json({ error: "Host is required" }, { status: 400 });
  }
  if (!eventDate) {
    return Response.json({ error: "Event date is required" }, { status: 400 });
  }

  const location = await db.prepare("SELECT id FROM locations WHERE id = ?").bind(locationId).first();
  if (!location) {
    return Response.json({ error: "Location not found" }, { status: 400 });
  }

  const host = await db.prepare("SELECT id, username FROM users WHERE id = ?").bind(hostId).first();
  if (!host) {
    return Response.json({ error: "Host not found" }, { status: 400 });
  }

  const id = crypto.randomUUID();
  const now = new Date().toISOString();

  await db.prepare(`
    INSERT INTO movie_nights (id, location_id, host_id, movie_count, event_date, status, created_at)
    VALUES (?, ?, ?, ?, ?, 'draft', ?)
  `).bind(id, locationId, hostId, movieCount, eventDate, now).run();

  return Response.json({
    id,
    location_id: locationId,
    host_id: hostId,
    movie_count: movieCount,
    event_date: eventDate,
    status: "draft",
    created_at: now,
    host_name: host.username,
  }, { status: 201 });
}
