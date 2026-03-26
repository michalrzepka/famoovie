function jsonResponse(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "content-type": "application/json; charset=utf-8" },
  });
}

export async function onRequestGet(context) {
  const { request, env } = context;

  const url = new URL(request.url);
  const query = url.searchParams.get("q")?.trim();

  if (!query || query.length < 2) {
    return jsonResponse({ results: [] });
  }

  const apiKey = env.OMDB_API_KEY;
  if (!apiKey) {
    return jsonResponse({ error: "OMDB API key not configured" }, 500);
  }

  try {
    const omdbUrl = `https://www.omdbapi.com/?apikey=${apiKey}&s=${encodeURIComponent(query)}&type=movie`;
    const response = await fetch(omdbUrl);
    const data = await response.json();

    if (data.Response === "False") {
      return jsonResponse({ results: [] });
    }

    const results = (data.Search || []).map((movie) => ({
      imdbId: movie.imdbID,
      title: movie.Title,
      year: movie.Year,
      poster: movie.Poster !== "N/A" ? movie.Poster : null,
    }));

    return jsonResponse({ results });
  } catch (err) {
    return jsonResponse({ error: "Failed to search movies" }, 500);
  }
}
