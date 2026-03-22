import { useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import MovieCard from '../components/MovieCard'
import Loader from '../components/Loader'
import { fetchRecentlyViewed } from '../redux/userSlice'

const WatchHistoryPage = () => {
  const dispatch = useDispatch()
  const { recentlyViewed, loading } = useSelector((state) => state.user)

  useEffect(() => {
    dispatch(fetchRecentlyViewed())
  }, [dispatch])

  return (
    <main className="mx-auto max-w-7xl px-4 py-6">
      <div className="max-w-2xl">
        <h1 className="text-3xl font-semibold text-white">Watch History</h1>
        <p className="mt-2 text-zinc-400">Movies you opened recently will appear here automatically.</p>
      </div>

      <section className="mt-8">
        {loading ? (
          <Loader />
        ) : recentlyViewed.length > 0 ? (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
            {recentlyViewed.map((movie) => (
              <MovieCard key={movie.id} movie={movie} />
            ))}
          </div>
        ) : (
          <div className="rounded-2xl border border-dashed border-zinc-700 bg-zinc-900/50 p-8 text-center text-zinc-400">
            No watch history yet. Open a movie page to start building it.
          </div>
        )}
      </section>
    </main>
  )
}

export default WatchHistoryPage