import { useCallback, useEffect, useMemo, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import toast from 'react-hot-toast'
import MovieCard from '../components/MovieCard'
import MovieCarousel from '../components/MovieCarousel'
import Loader from '../components/Loader'
import ErrorState from '../components/ErrorState'
import useInfiniteScroll from '../hooks/useInfiniteScroll'
import { getBollywoodMovies, getTollywoodMovies } from '../services/movieService'
import {
  fetchNowPlayingMovies,
  fetchTopRatedMovies,
  fetchTrendingMovies,
  fetchUpcomingMovies,
  getAiRecommendationsThunk,
} from '../redux/movieSlice'

const suggestionPresets = [
  'Inception, Interstellar, Dune',
  'Action, Thriller, Sci-Fi',
  'The Dark Knight, Joker, Se7en',
  'Romance, Drama, Feel-good',
]

const HomePage = () => {
  const dispatch = useDispatch()
  const { selectedIndustry } = useSelector((state) => state.filter)
  const {
    trending,
    nowPlaying,
    upcoming,
    topRated,
    aiRecommendations,
    trendingPage,
    hasMoreTrending,
    loadingTrending,
    loadingNowPlaying,
    loadingUpcoming,
    loadingTopRated,
    loadingAi,
    error,
  } = useSelector((state) => state.movies)

  const [aiPrompt, setAiPrompt] = useState('Inception, Interstellar, sci-fi, thriller')
  const [isFocused, setIsFocused] = useState(false)
  const [regionalMovies, setRegionalMovies] = useState([])
  const [loadingRegional, setLoadingRegional] = useState(false)

  const recommendationHint = useMemo(() => {
    if (aiPrompt.trim().length === 0) {
      return 'Type favorite titles or genres, separated by commas.'
    }

    if (aiPrompt.toLowerCase().includes('inception')) {
      return 'We’ll look for smart sci-fi and thriller matches.'
    }

    if (/action|thriller|drama|sci/i.test(aiPrompt)) {
      return 'Great. We can infer matching genres from that input.'
    }

    return 'Tip: use movie titles for stronger matching.'
  }, [aiPrompt])

  const displayedRecommendations = useMemo(() => {
    if (selectedIndustry === 'bollywood' || selectedIndustry === 'tollywood') {
      return regionalMovies
    }

    return aiRecommendations
  }, [aiRecommendations, regionalMovies, selectedIndustry])

  const regionalNowPlaying = useMemo(() => regionalMovies.slice(0, 8), [regionalMovies])
  const regionalUpcoming = useMemo(() => regionalMovies.slice(8, 16), [regionalMovies])
  const regionalTopRated = useMemo(
    () => [...regionalMovies].sort((a, b) => Number(b.rating || 0) - Number(a.rating || 0)).slice(0, 8),
    [regionalMovies],
  )
  const regionalTrending = useMemo(() => regionalMovies.slice(16, 28), [regionalMovies])

  const isRegionalMode = selectedIndustry === 'bollywood' || selectedIndustry === 'tollywood'
  const nowPlayingMovies = isRegionalMode ? regionalNowPlaying : nowPlaying
  const upcomingMovies = isRegionalMode ? regionalUpcoming : upcoming
  const topRatedMovies = isRegionalMode ? regionalTopRated : topRated
  const trendingMovies = isRegionalMode ? regionalTrending : trending

  useEffect(() => {
    if (selectedIndustry === 'bollywood' || selectedIndustry === 'tollywood') {
      return
    }

    dispatch(fetchTrendingMovies({ page: 1, industry: selectedIndustry }))
    // Defer non-critical sections so first paint is faster on slower networks.
    const timer = setTimeout(() => {
      dispatch(fetchNowPlayingMovies(selectedIndustry))
      dispatch(fetchUpcomingMovies(selectedIndustry))
      dispatch(fetchTopRatedMovies(selectedIndustry))
    }, 350)

    return () => clearTimeout(timer)
  }, [dispatch, selectedIndustry])

  useEffect(() => {
    let active = true

    const loadBollywoodMovies = async () => {
      if (selectedIndustry !== 'bollywood' && selectedIndustry !== 'tollywood') {
        setRegionalMovies([])
        setLoadingRegional(false)
        return
      }

      setLoadingRegional(true)

      try {
        const movies = selectedIndustry === 'tollywood' ? await getTollywoodMovies() : await getBollywoodMovies()
        if (active) {
          setRegionalMovies(movies)
        }
      } catch {
        if (active) {
          setRegionalMovies([])
        }
      } finally {
        if (active) {
          setLoadingRegional(false)
        }
      }
    }

    loadBollywoodMovies()

    return () => {
      active = false
    }
  }, [selectedIndustry])

  const handleLoadMore = useCallback(() => {
    dispatch(fetchTrendingMovies({ page: trendingPage + 1, append: true, industry: selectedIndustry }))
  }, [dispatch, trendingPage, selectedIndustry])

  const sentinelRef = useInfiniteScroll({
    hasMore: hasMoreTrending,
    isLoading: loadingTrending,
    onLoadMore: handleLoadMore,
  })

  const submitAiPrompt = async (event) => {
    event.preventDefault()
    if (!aiPrompt.trim()) return

    const resultAction = await dispatch(getAiRecommendationsThunk(aiPrompt.trim()))
    if (getAiRecommendationsThunk.rejected.match(resultAction)) {
      toast.error(resultAction.payload || 'Failed to fetch AI recommendations')
    }
  }

  return (
    <main className="mx-auto max-w-7xl px-4 py-6">
      <section className="recommendation-hero relative overflow-hidden rounded-[2rem] border border-white/10 p-6 shadow-[0_30px_120px_rgba(0,0,0,0.45)] sm:p-8 lg:p-10">
        <div className="recommendation-aurora" />
        <div className="relative grid gap-8 lg:grid-cols-[1.15fr_0.85fr] lg:items-center">
          <div className="space-y-6">
            <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs uppercase tracking-[0.3em] text-zinc-200 backdrop-blur">
              <span className="recommendation-dot" />
              AI movie recommendation lab
            </div>

            <h1 className="max-w-3xl text-4xl font-black tracking-tight text-white sm:text-6xl">
              Build a smarter watchlist from the movies and genres you actually love.
            </h1>

            <p className="max-w-2xl text-base leading-7 text-zinc-300 sm:text-lg">
              Drop in a few favorite titles or genres and let the app pull matching movies from OMDb with a fast, cinematic layout and fluid motion.
            </p>

            <div className="flex flex-wrap gap-2">
              {suggestionPresets.map((preset) => (
                <button
                  key={preset}
                  type="button"
                  onClick={() => setAiPrompt(preset)}
                  className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm text-zinc-100 transition duration-300 hover:-translate-y-0.5 hover:border-red-400/50 hover:bg-red-500/10"
                >
                  {preset}
                </button>
              ))}
            </div>

            <p className="text-sm text-zinc-400">Active industry: {selectedIndustry}</p>
          </div>

          <div className="recommendation-panel relative rounded-[1.75rem] border border-white/10 bg-zinc-950/70 p-5 backdrop-blur-xl sm:p-6">
            <div className="absolute inset-0 rounded-[1.75rem] bg-gradient-to-br from-red-500/15 via-transparent to-amber-300/10 opacity-60 blur-2xl" />
            <div className="relative space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs uppercase tracking-[0.3em] text-zinc-400">Recommendation prompt</p>
                  <h2 className="mt-1 text-xl font-semibold text-white">Tell us what you like</h2>
                </div>
                <div className="rounded-full border border-emerald-400/30 bg-emerald-400/10 px-3 py-1 text-xs text-emerald-300">
                  OMDb connected
                </div>
              </div>

              <form onSubmit={submitAiPrompt} className="space-y-3">
                <textarea
                  value={aiPrompt}
                  onChange={(event) => setAiPrompt(event.target.value)}
                  onFocus={() => setIsFocused(true)}
                  onBlur={() => setIsFocused(false)}
                  rows={4}
                  className="recommendation-textarea w-full resize-none rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white outline-none transition placeholder:text-zinc-500 focus:border-red-400/60 focus:bg-white/8"
                  placeholder="Example: Inception, Interstellar, sci-fi, thriller"
                />

                <div className="flex items-center justify-between gap-3">
                  <p className={`text-xs transition ${isFocused ? 'text-red-300' : 'text-zinc-400'}`}>
                    {recommendationHint}
                  </p>
                  <button
                    type="submit"
                    className="group inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-red-600 via-red-500 to-orange-400 px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-red-500/20 transition duration-300 hover:-translate-y-0.5 hover:shadow-red-500/30 disabled:cursor-not-allowed disabled:opacity-60"
                    disabled={loadingAi}
                  >
                    <span className="recommendation-arrow transition-transform duration-300 group-hover:translate-x-0.5">➜</span>
                    Recommend
                  </button>
                </div>
              </form>

              <div className="grid gap-3 rounded-2xl border border-white/10 bg-black/20 p-4 text-sm text-zinc-300 sm:grid-cols-3">
                <div>
                  <p className="text-xs uppercase tracking-[0.25em] text-zinc-500">Input</p>
                  <p className="mt-1">Titles or genres</p>
                </div>
                <div>
                  <p className="text-xs uppercase tracking-[0.25em] text-zinc-500">Source</p>
                  <p className="mt-1">OMDb API</p>
                </div>
                <div>
                  <p className="text-xs uppercase tracking-[0.25em] text-zinc-500">Output</p>
                  <p className="mt-1">
                    {selectedIndustry === 'bollywood' ? 'Many Bollywood movies' : 'Ranked movie suggestions'}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="mt-8 rounded-[1.75rem] border border-white/10 bg-zinc-950/70 p-4 shadow-[0_20px_80px_rgba(0,0,0,0.3)] sm:p-6">
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-[0.3em] text-zinc-500">Generated picks</p>
            <h2 className="mt-1 text-2xl font-semibold text-white">Recommended for you</h2>
          </div>
          {loadingAi ? (
            <div className="rounded-full border border-red-400/20 bg-red-500/10 px-3 py-1 text-xs text-red-200">
              Generating…
            </div>
          ) : null}
        </div>

        {loadingAi || loadingRegional ? (
          <div className="mt-6">
            <Loader count={3} />
          </div>
        ) : displayedRecommendations.length > 0 ? (
          <div
            className={selectedIndustry === 'bollywood'
              ? 'mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5'
              : 'mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5'}
          >
            {displayedRecommendations.map((movie, index) => (
              <article
                key={`${movie.id}-${movie.title}`}
                className={`recommendation-result group relative overflow-hidden rounded-[1.5rem] border border-white/10 bg-white/5 p-3 transition duration-500 hover:-translate-y-1 hover:border-red-400/30 hover:bg-white/8 ${
                  selectedIndustry === 'bollywood' ? '' : ''
                }`}
                style={{ animationDelay: `${index * 90}ms` }}
              >
                <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-black/70 opacity-0 transition duration-500 group-hover:opacity-100" />
                <div className="relative overflow-hidden rounded-[1.25rem]">
                  <MovieCard movie={movie} />
                </div>
                <div className="pointer-events-none absolute inset-x-3 bottom-3 rounded-xl bg-black/40 px-3 py-2 text-xs text-white opacity-0 backdrop-blur-sm transition duration-500 group-hover:opacity-100">
                  {movie.title} • Rating {movie.rating}
                </div>
              </article>
            ))}
          </div>
        ) : (
          <div className="mt-6 rounded-2xl border border-dashed border-white/10 bg-white/5 p-8 text-center text-zinc-400">
            {isRegionalMode
              ? `${selectedIndustry === 'tollywood' ? 'Tollywood' : 'Bollywood'} movies will appear here from OMDb multi-keyword search.`
              : 'Enter a few favorites above to generate suggestions.'}
          </div>
        )}
      </section>

      <section className="mt-10">
        {isRegionalMode && loadingRegional ? <Loader /> : <MovieCarousel title="Now Playing" movies={nowPlayingMovies} />}
      </section>

      <section className="mt-10">
        {isRegionalMode && loadingRegional ? <Loader /> : <MovieCarousel title="Upcoming" movies={upcomingMovies} />}
      </section>

      <section className="mt-10">
        {isRegionalMode && loadingRegional ? <Loader /> : <MovieCarousel title="Top Rated" movies={topRatedMovies} />}
      </section>

      <section className="mt-10">
        <h2 className="mb-4 text-2xl font-semibold text-white">Trending Now</h2>

        {error ? <ErrorState message={error} /> : null}

        {isRegionalMode && loadingRegional ? (
          <Loader />
        ) : (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
            {(isRegionalMode ? trendingMovies : trending).map((movie) => (
              <MovieCard key={`${movie.id}-${movie.title}`} movie={movie} />
            ))}
          </div>
        )}

        {!isRegionalMode ? <div ref={sentinelRef} className="h-10" /> : null}
        {!isRegionalMode && loadingTrending && trending.length > 0 ? <p className="text-center text-zinc-400">Loading more movies...</p> : null}
      </section>
    </main>
  )
}

export default HomePage
