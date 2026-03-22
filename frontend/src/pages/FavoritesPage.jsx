import { useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import MovieCard from '../components/MovieCard'
import Loader from '../components/Loader'
import { fetchFavorites } from '../redux/userSlice'

const FavoritesPage = () => {
  const dispatch = useDispatch()
  const { favorites, loading } = useSelector((state) => state.user)

  useEffect(() => {
    dispatch(fetchFavorites())
  }, [dispatch])

  return (
    <main className="mx-auto max-w-7xl px-4 py-6">
      <h1 className="text-3xl font-semibold text-white">Favorites</h1>
      <p className="mt-1 text-zinc-400">Movies you loved the most.</p>

      <section className="mt-6">
        {loading ? (
          <Loader />
        ) : favorites.length > 0 ? (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
            {favorites.map((movie) => (
              <MovieCard key={movie.id} movie={movie} />
            ))}
          </div>
        ) : (
          <p className="text-zinc-400">No favorite movies yet.</p>
        )}
      </section>
    </main>
  )
}

export default FavoritesPage
