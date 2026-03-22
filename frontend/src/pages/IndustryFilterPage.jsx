import { useEffect } from 'react'
import { useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import IndustryFilterDropdown from '../components/IndustryFilterDropdown'
import Loader from '../components/Loader'
import MovieCard from '../components/MovieCard'
import { fetchTrendingMovies } from '../redux/movieSlice'
import { getBollywoodMovies, getTollywoodMovies } from '../services/movieService'

const IndustryFilterPage = () => {
  const dispatch = useDispatch()
  const { selectedIndustry } = useSelector((state) => state.filter)
  const { trending, loadingTrending } = useSelector((state) => state.movies)
  const [regionalMovies, setRegionalMovies] = useState([])
  const [loadingRegional, setLoadingRegional] = useState(false)

  useEffect(() => {
    let active = true

    const loadMovies = async () => {
      if (selectedIndustry === 'bollywood' || selectedIndustry === 'tollywood') {
        setLoadingRegional(true)

        try {
          const movies = selectedIndustry === 'tollywood' ? await getTollywoodMovies() : await getBollywoodMovies()
          if (active) {
            setRegionalMovies(movies)
          }
        } finally {
          if (active) {
            setLoadingRegional(false)
          }
        }

        return
      }

      setRegionalMovies([])
      dispatch(fetchTrendingMovies({ page: 1, industry: selectedIndustry }))
    }

    loadMovies()

    return () => {
      active = false
    }
  }, [dispatch, selectedIndustry])

  return (
    <main className="mx-auto max-w-7xl px-4 py-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-3xl font-semibold text-white">Industry Filter</h1>
          <p className="mt-1 text-zinc-400">Switch language/industry to discover regional movie trends.</p>
        </div>
        <IndustryFilterDropdown />
      </div>

      <section className="mt-6">
        {loadingTrending || loadingRegional ? (
          <Loader />
        ) : selectedIndustry === 'bollywood' || selectedIndustry === 'tollywood' ? (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
            {regionalMovies.map((movie) => (
              <MovieCard key={`${movie.id}-${movie.title}`} movie={movie} />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
            {trending.map((movie) => (
              <MovieCard key={`${movie.id}-${movie.title}`} movie={movie} />
            ))}
          </div>
        )}
      </section>
    </main>
  )
}

export default IndustryFilterPage
