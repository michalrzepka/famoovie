export default function MovieCard({ movie, onAdd, onRemove, inShortlist }) {
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
        {onAdd && !inShortlist && (
          <button className="btn-add" onClick={() => onAdd(movie)}>Add</button>
        )}
        {onRemove && (
          <button className="btn-remove" onClick={() => onRemove(movie)}>Remove</button>
        )}
        {inShortlist && !onRemove && (
          <span className="in-shortlist">In shortlist</span>
        )}
      </div>
    </div>
  );
}
