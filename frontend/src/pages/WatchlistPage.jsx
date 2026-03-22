import { useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import MovieCard from '../components/MovieCard'
import Loader from '../components/Loader'
import { fetchWatchlist } from '../redux/userSlice'

const WatchlistPage = () => {
  const dispatch = useDispatch()
  const { watchlist, loading } = useSelector((state) => state.user)

  useEffect(() => {
    dispatch(fetchWatchlist())
  }, [dispatch])

  return (
    <main className="mx-auto max-w-7xl px-4 py-6">
      <h1 className="text-3xl font-semibold text-white">Watchlist</h1>
      <p className="mt-1 text-zinc-400">Movies queued for your next movie night.</p>

      <section className="mt-6">
        {loading ? (
          <Loader />
        ) : watchlist.length > 0 ? (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
            {watchlist.map((movie) => (
              <MovieCard key={movie.id} movie={movie} />
            ))}
          </div>
        ) : (
          <p className="text-zinc-400">Your watchlist is empty.</p>
        )}
      </section>
    </main>
  )
}

export default WatchlistPage
