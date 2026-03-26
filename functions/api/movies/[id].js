function jsonResponse(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "content-type": "application/json; charset=utf-8" },
  });
}

export async function onRequestGet(context) {
  const { env, params } = context;

  const imdbId = params.id;
  if (!imdbId) {
    return jsonResponse({ error: "Movie ID required" }, 400);
  }

  const apiKey = env.OMDB_API_KEY;
  if (!apiKey) {
    return jsonResponse({ error: "OMDB API key not configured" }, 500);
  }

  try {
    const omdbUrl = `https://www.omdbapi.com/?apikey=${apiKey}&i=${encodeURIComponent(imdbId)}&plot=short`;
    const response = await fetch(omdbUrl);
    const data = await response.json();

    if (data.Response === "False") {
      return jsonResponse({ error: "Movie not found" }, 404);
    }

    return jsonResponse({
      imdbId: data.imdbID,
      title: data.Title,
      year: data.Year,
      plot: data.Plot !== "N/A" ? data.Plot : null,
      poster: data.Poster !== "N/A" ? data.Poster : null,
      rating: data.imdbRating !== "N/A" ? data.imdbRating : null,
      runtime: data.Runtime !== "N/A" ? data.Runtime : null,
      genre: data.Genre !== "N/A" ? data.Genre : null,
    });
  } catch (err) {
    return jsonResponse({ error: "Failed to fetch movie details" }, 500);
  }
}
