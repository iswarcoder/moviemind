import { useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useDispatch, useSelector } from 'react-redux'
import MovieCard from '../components/MovieCard'
import { getAiRecommendationsThunk } from '../redux/movieSlice'
import { clearMovieError } from '../redux/movieSlice'
import { fetchFavorites, fetchRecentlyViewed, fetchWatchlist } from '../redux/userSlice'

const DashboardPage = () => {
  const dispatch = useDispatch()
  const { user } = useSelector((state) => state.auth)
  const { favorites, watchlist, recentlyViewed } = useSelector((state) => state.user)
  const { aiRecommendations } = useSelector((state) => state.movies)
  const { selectedIndustry } = useSelector((state) => state.filter)

  const displayedRecommendations = aiRecommendations

  useEffect(() => {
    dispatch(clearMovieError())
    dispatch(fetchFavorites())
    dispatch(fetchWatchlist())
    dispatch(fetchRecentlyViewed())
    dispatch(getAiRecommendationsThunk('Inception, Interstellar, sci-fi, drama'))
  }, [dispatch])

  return (
    <main className="mx-auto max-w-6xl px-4 py-6">
      <h1 className="text-3xl font-semibold text-white">Welcome, {user?.name || 'Movie Lover'}</h1>
      <p className="mt-2 text-zinc-300">Track your curation stats and quickly jump back to saved picks.</p>

      <section className="mt-8 grid gap-4 sm:grid-cols-3">
        <article className="rounded-xl border border-zinc-800 bg-zinc-900/60 p-5">
          <p className="text-sm text-zinc-400">Favorites</p>
          <p className="mt-2 text-3xl font-bold text-white">{favorites.length}</p>
          <Link to="/favorites" className="mt-4 inline-flex text-sm text-red-400 hover:text-red-300">
            View favorites
          </Link>
        </article>
        <article className="rounded-xl border border-zinc-800 bg-zinc-900/60 p-5">
          <p className="text-sm text-zinc-400">Watchlist</p>
          <p className="mt-2 text-3xl font-bold text-white">{watchlist.length}</p>
          <Link to="/watchlist" className="mt-4 inline-flex text-sm text-red-400 hover:text-red-300">
            View watchlist
          </Link>
        </article>
        <article className="rounded-xl border border-zinc-800 bg-zinc-900/60 p-5">
          <p className="text-sm text-zinc-400">Watch History</p>
          <p className="mt-2 text-3xl font-bold text-white">{recentlyViewed.length}</p>
          <Link to="/history" className="mt-4 inline-flex text-sm text-red-400 hover:text-red-300">
            View history
          </Link>
        </article>
      </section>

      <section className="mt-10">
        <h2 className="text-2xl font-semibold text-white">Recently Viewed</h2>
        {recentlyViewed.length > 0 ? (
          <div className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
            {recentlyViewed.map((movie) => (
              <MovieCard key={movie.id} movie={movie} />
            ))}
          </div>
        ) : (
          <p className="mt-2 text-zinc-400">No recently viewed movies yet.</p>
        )}
      </section>

      <section className="mt-10">
        <h2 className="text-2xl font-semibold text-white">AI Recommendations</h2>
        {displayedRecommendations.length > 0 ? (
          <div className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
            {displayedRecommendations.map((movie) => (
              <MovieCard key={movie.id} movie={movie} />
            ))}
          </div>
        ) : (
          <p className="mt-2 text-zinc-400">
            No AI recommendations generated yet.
          </p>
        )}
      </section>
    </main>
  )
}

export default DashboardPage
