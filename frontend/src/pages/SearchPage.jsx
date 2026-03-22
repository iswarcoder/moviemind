import { useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { useDispatch, useSelector } from 'react-redux'
import MovieCard from '../components/MovieCard'
import Loader from '../components/Loader'
import ErrorState from '../components/ErrorState'
import useDebounce from '../hooks/useDebounce'
import IndustryFilterDropdown from '../components/IndustryFilterDropdown'
import { setIndustry } from '../redux/filterSlice'
import { searchMoviesPage } from '../services/movieService'

const SearchPage = () => {
  const [params, setParams] = useSearchParams()
  const initialQuery = useMemo(() => params.get('q') || '', [params])
  const industryFromUrl = useMemo(() => params.get('industry') || 'all', [params])
  const [query, setQuery] = useState(initialQuery)
  const [movies, setMovies] = useState([])
  const [page, setPage] = useState(1)
  const [totalResults, setTotalResults] = useState(0)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const debouncedQuery = useDebounce(query, 450)
  const dispatch = useDispatch()
  const { selectedIndustry } = useSelector((state) => state.filter)

  const hasMore = movies.length > 0 && movies.length < totalResults && !error

  const dedupeMovies = (items) => {
    const map = new Map()

    items.forEach((movie) => {
      if (!movie?.id || map.has(movie.id)) return
      map.set(movie.id, movie)
    })

    return [...map.values()]
  }

  const loadMovies = async (searchQuery, targetPage, shouldAppend = false) => {
    const trimmedQuery = searchQuery.trim()

    if (!trimmedQuery) {
      setMovies([])
      setTotalResults(0)
      setPage(1)
      setError(null)
      return
    }

    console.log('[search] page:', targetPage)
    setLoading(true)
    setError(null)

    try {
      const response = await searchMoviesPage(trimmedQuery, targetPage)
      const nextMovies = response.movies || []

      setMovies((prev) => {
        const merged = shouldAppend ? [...prev, ...nextMovies] : nextMovies
        return dedupeMovies(merged)
      })
      setTotalResults(Number(response.totalResults || 0))
      setPage(Number(response.page || targetPage))
      setParams({ q: trimmedQuery, industry: selectedIndustry, page: String(targetPage) })
    } catch (fetchError) {
      setError(fetchError.message || 'Failed to search movies')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    dispatch(setIndustry(industryFromUrl))
  }, [dispatch, industryFromUrl])

  useEffect(() => {
    if (!debouncedQuery.trim()) {
      setMovies([])
      setTotalResults(0)
      setPage(1)
      setError(null)
      setParams({ industry: selectedIndustry })
      return
    }

    loadMovies(debouncedQuery, 1, false)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedQuery, selectedIndustry])

  useEffect(() => {
    if (initialQuery && initialQuery !== query) {
      setQuery(initialQuery)
    }
  }, [initialQuery, query])

  const handleLoadMore = () => {
    if (loading || !hasMore) return
    loadMovies(debouncedQuery, page + 1, true)
  }

  return (
    <main className="mx-auto max-w-7xl px-4 py-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-3xl font-semibold text-white">Search Movies</h1>
        <IndustryFilterDropdown />
      </div>
      <input
        value={query}
        onChange={(event) => setQuery(event.target.value)}
        placeholder="Search by movie title or industry"
        className="mt-4 w-full max-w-xl rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-2.5 text-zinc-100 outline-none ring-red-500 transition focus:ring-2"
      />

      {error ? <div className="mt-5"><ErrorState message={error} /></div> : null}

      <section className="mt-6">
        {loading && movies.length === 0 ? (
          <Loader />
        ) : movies.length > 0 ? (
          <>
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
            {movies.map((movie) => (
              <MovieCard key={movie.id} movie={movie} />
            ))}
            </div>

            <div className="mt-8 flex justify-center">
              <button
                type="button"
                onClick={handleLoadMore}
                disabled={!hasMore || loading}
                className="inline-flex items-center gap-2 rounded-xl bg-red-600 px-5 py-3 font-medium text-white transition hover:bg-red-500 disabled:cursor-not-allowed disabled:bg-zinc-700"
              >
                {loading ? (
                  <span className="inline-flex items-center gap-2">
                    <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                    Loading...
                  </span>
                ) : hasMore ? (
                  'Load More'
                ) : (
                  'No more movies'
                )}
              </button>
            </div>
          </>
        ) : (
          <p className="text-zinc-400">No movies found. Try a different query.</p>
        )}
      </section>
    </main>
  )
}

export default SearchPage
