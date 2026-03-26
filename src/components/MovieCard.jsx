export default function MovieCard({ movie }) {
  return (
    <div className="movie-card">
      {movie.poster ? (
        <img src={movie.poster} alt={movie.title} className="movie-poster" />
      ) : (
        <div className="movie-poster-placeholder">No Poster</div>
      )}
      <div className="movie-info">
        <h3 className="movie-title">{movie.title}</h3>
        <p className="movie-year">{movie.year}</p>
        {movie.plot && <p className="movie-plot">{movie.plot}</p>}
      </div>
    </div>
  );
}
