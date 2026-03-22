import { Link } from 'react-router-dom'
import { useDispatch, useSelector } from 'react-redux'
import toast from 'react-hot-toast'
import { toggleFavoriteThunk, toggleWatchlistThunk } from '../redux/userSlice'

const FALLBACK_POSTER = '/poster-fallback.svg'

const MovieCard = ({ movie }) => {
  const dispatch = useDispatch()
  const { isAuthenticated } = useSelector((state) => state.auth)
  const { favorites, watchlist } = useSelector((state) => state.user)

  const isFavorite = favorites.some((item) => item.id === movie.id)
  const isInWatchlist = watchlist.some((item) => item.id === movie.id)

  const protectedAction = (action) => {
    if (!isAuthenticated) {
      toast.error('Please login to manage favorites and watchlist.')
      return
    }
    action()
  }

  return (
    <article className="movie-card group overflow-hidden rounded-xl border border-zinc-800 bg-zinc-900/75 transition duration-300 hover:-translate-y-1 hover:border-zinc-700 hover:shadow-2xl hover:shadow-black/30">
      <Link to={`/movies/${movie.id}`}>
        <div className="movie-poster relative overflow-hidden bg-zinc-950">
          <div className="movie-poster-shine" />
          <img
            src={movie.posterPath || FALLBACK_POSTER}
            alt={movie.title}
            loading="lazy"
            onError={(event) => {
              event.currentTarget.src = FALLBACK_POSTER
            }}
            className="movie-poster-image h-full w-full object-cover transition duration-500 group-hover:scale-105"
          />
        </div>
      </Link>

      <div className="space-y-2 p-3">
        <Link to={`/movies/${movie.id}`} className="line-clamp-1 text-sm font-semibold text-white hover:text-amber-300">
          {movie.title}
        </Link>
        <p className="text-xs text-zinc-400">Rating: {movie.rating === 'N/A' ? 'N/A' : movie.rating}</p>

        <div className="flex gap-2 pt-1">
          <button
            type="button"
            onClick={() => protectedAction(() => dispatch(toggleFavoriteThunk(movie)))}
            className={`rounded-md px-2 py-1 text-xs transition ${
              isFavorite ? 'bg-pink-700 text-white' : 'bg-zinc-800 text-zinc-200 hover:bg-zinc-700'
            }`}
          >
            {isFavorite ? 'Unfavorite' : 'Favorite'}
          </button>
          <button
            type="button"
            onClick={() => protectedAction(() => dispatch(toggleWatchlistThunk(movie)))}
            className={`rounded-md px-2 py-1 text-xs transition ${
              isInWatchlist ? 'bg-cyan-700 text-white' : 'bg-zinc-800 text-zinc-200 hover:bg-zinc-700'
            }`}
          >
            {isInWatchlist ? 'Remove' : 'Watchlist'}
          </button>
        </div>
      </div>
    </article>
  )
}

export default MovieCard
