import api from './api'
import { mockAiRecommendations, mockMovies } from './mockData'

const TMDB_API_KEY = import.meta.env.VITE_TMDB_API_KEY
const TMDB_BASE_URL = 'https://api.themoviedb.org/3'
const CACHE_TTL_MS = 5 * 60 * 1000
const memoryCache = new Map()

const BOLLYWOOD_SEARCH_QUERIES = [
  'hindi',
  'india',
  'bollywood',
  'shah rukh khan',
  'salman khan',
  'amir khan',
]

const TOLLYWOOD_SEARCH_QUERIES = [
  'telugu',
  'india',
  'tollywood',
  'allu arjun',
  'mahesh babu',
  'prabhas',
]

const INDUSTRY_LANGUAGE_MAP = {
  all: ['en-US'],
  hollywood: ['en-US'],
  bollywood: ['hi-IN'],
  tollywood: ['te-IN'],
  others: ['ta-IN', 'ml-IN', 'kn-IN'],
}

const getIndustryLanguages = (industry = 'all') => INDUSTRY_LANGUAGE_MAP[industry] || INDUSTRY_LANGUAGE_MAP.all

const getTmdbUrl = (path) => `${TMDB_BASE_URL}${path}`

const getCache = (key) => {
  const item = memoryCache.get(key)
  if (!item) return null
  if (Date.now() - item.ts > CACHE_TTL_MS) {
    memoryCache.delete(key)
    return null
  }
  return item.value
}

const setCache = (key, value) => {
  memoryCache.set(key, { value, ts: Date.now() })
}

const shuffleArray = (items) => {
  const shuffled = [...items]

  for (let index = shuffled.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(Math.random() * (index + 1))
    ;[shuffled[index], shuffled[swapIndex]] = [shuffled[swapIndex], shuffled[index]]
  }

  return shuffled
}

const dedupeMovies = (items) => {
  const map = new Map()

  items.forEach((movie) => {
    if (!movie?.id || map.has(movie.id)) return
    map.set(movie.id, movie)
  })

  return [...map.values()]
}

const normalizeMovie = (movie) => ({
  id: movie.id || movie.imdbID,
  title: movie.title || movie.name || movie.Title,
  rating:
    movie.vote_average || movie.rating || movie.imdbRating
      ? Number(movie.vote_average || movie.rating || movie.imdbRating || 0).toFixed(1)
      : 'N/A',
  overview: movie.overview || movie.plot || movie.Plot || '',
  genres: Array.isArray(movie.genres)
    ? movie.genres.map((g) => g.name || g)
    : String(movie.genres || movie.Genre || '')
        .split(',')
        .map((g) => g.trim())
        .filter(Boolean),
  language: movie.original_language || movie.language || 'en',
  posterPath: movie.poster_path
    ? `https://image.tmdb.org/t/p/w342${movie.poster_path}`
    : movie.posterPath || movie.poster_path || movie.poster || movie.Poster,
  trailerKey:
    movie.trailerKey ||
    movie.trailer_key ||
    movie.videos?.results?.find((video) => video.type === 'Trailer' && video.site === 'YouTube')?.key ||
    '',
})

export const searchMoviesPage = async (query, page = 1) => {
  const { data } = await api.get('/api/movies/search', {
    params: {
      query,
      page,
    },
  })

  return {
    movies: (data.movies || []).map(normalizeMovie),
    totalResults: Number(data.totalResults || 0),
    page: Number(data.page || page),
  }
}

const searchOmdbKeyword = async (query) => {
  const { data } = await api.get('/api/movies/search', {
    params: {
      query,
      page: 1,
    },
  })

  return Array.isArray(data.movies) ? data.movies.map(normalizeMovie) : []
}

const getOmdbMovieDetails = async (imdbID, fallbackMovie) => {
  const { data } = await api.get('/api/movies/details', {
    params: {
      id: imdbID,
    },
  })

  return normalizeMovie({
    ...fallbackMovie,
    ...data,
    imdbID,
    Poster: data.poster || fallbackMovie?.poster || fallbackMovie?.Poster,
    imdbRating: data.imdbRating || fallbackMovie?.imdbRating,
  })
}

const getRegionalMovies = async ({ cacheKey, logLabel, queryList, fallbackMatchers }) => {
  const cached = getCache(cacheKey)
  if (cached) return cached

  console.log(`[${logLabel}] Using OMDb logic`)

  try {
    const results = []

    for (const query of queryList) {
      console.log(`[${logLabel}] query:`, query)
      const movies = await api.get('/api/movies/search', {
        params: {
          query,
          page: 1,
        },
      })

      const searchHits = Array.isArray(movies.data?.movies) ? movies.data.movies : []

      const enrichedMovies = await Promise.all(
        searchHits.slice(0, 10).map(async (item) => {
          if (!item?.imdbID) {
            return normalizeMovie(item)
          }

          try {
            return await getOmdbMovieDetails(item.imdbID, item)
          } catch {
            return normalizeMovie(item)
          }
        })
      )

      results.push(...enrichedMovies)
    }

    const finalResults = shuffleArray(dedupeMovies(results)).slice(0, 50)
    const limitedResults = finalResults.length >= 20 ? finalResults : [...finalResults, ...mockMovies].slice(0, 20)

    setCache(cacheKey, limitedResults)
    return limitedResults
  } catch (error) {
    console.error(`[${logLabel}] OMDb fallback error:`, error.message)
    const fallback = shuffleArray(
      dedupeMovies(
        mockMovies.filter((movie) => {
          const title = movie.title.toLowerCase()
          return fallbackMatchers.some((matcher) => title.includes(matcher))
        }),
      ),
    ).slice(0, 20)

    setCache(cacheKey, fallback)
    return fallback
  }
}

export const getBollywoodMovies = async () =>
  getRegionalMovies({
    cacheKey: 'bollywood:multi-query',
    logLabel: 'bollywood',
    queryList: BOLLYWOOD_SEARCH_QUERIES,
    fallbackMatchers: ['india', 'hindi', 'bollywood', 'khan'],
  })

export const getTollywoodMovies = async () =>
  getRegionalMovies({
    cacheKey: 'tollywood:multi-query',
    logLabel: 'tollywood',
    queryList: TOLLYWOOD_SEARCH_QUERIES,
    fallbackMatchers: ['india', 'telugu', 'tollywood', 'allu', 'mahesh', 'prabhas'],
  })

const withMockPagination = (page = 1, industry = 'all') => {
  const pageSize = 4
  const allowed = getIndustryLanguages(industry).map((code) => code.split('-')[0])
  const filteredMovies = industry === 'all'
    ? mockMovies
    : mockMovies.filter((movie) => allowed.includes(movie.language || 'en'))
  const start = (page - 1) * pageSize
  const chunk = filteredMovies.slice(start, start + pageSize)
  return {
    results: chunk,
    page,
    totalPages: Math.max(1, Math.ceil(filteredMovies.length / pageSize)),
  }
}

const fetchTmdbByLanguages = async (
  endpoint,
  { page = 1, industry = 'all', query, fastMode = false } = {},
) => {
  const languages = fastMode ? [getIndustryLanguages(industry)[0]] : getIndustryLanguages(industry)
  const requests = languages.map((language) =>
    api.get(getTmdbUrl(endpoint), {
      params: {
        api_key: TMDB_API_KEY,
        language,
        page,
        query,
      },
    }),
  )

  const responses = await Promise.all(requests)
  const allResults = responses.flatMap((response) => response.data.results || [])

  const deduped = Array.from(new Map(allResults.map((movie) => [movie.id, movie])).values())

  return {
    results: deduped.map(normalizeMovie),
    page,
    totalPages: Math.min(...responses.map((response) => response.data.total_pages || 1)),
  }
}

export const getTrendingMovies = async ({ page = 1, industry = 'all' } = {}) => {
  const cacheKey = `trending:${industry}:${page}`
  const cached = getCache(cacheKey)
  if (cached) return cached

  try {
    if (TMDB_API_KEY) {
      const data = await fetchTmdbByLanguages('/trending/movie/day', { page, industry })
      setCache(cacheKey, data)
      return data
    }

    const { data } = await api.get(`/api/movies/trending?page=${page}&industry=${industry}`)
    const normalized = {
      results: (data.results || []).map(normalizeMovie),
      page: data.page || page,
      totalPages: data.totalPages || data.total_pages || 1,
    }
    setCache(cacheKey, normalized)
    return normalized
  } catch {
    const mocked = withMockPagination(page, industry)
    const fallback = {
      ...mocked,
      results: mocked.results.map(normalizeMovie),
    }
    setCache(cacheKey, fallback)
    return fallback
  }
}

export const getTopRatedMovies = async (industry = 'all') => {
  const cacheKey = `topRated:${industry}`
  const cached = getCache(cacheKey)
  if (cached) return cached

  try {
    if (TMDB_API_KEY) {
      const data = await fetchTmdbByLanguages('/movie/top_rated', { industry })
      setCache(cacheKey, data.results)
      return data.results
    }

    const { data } = await api.get(`/api/movies/top-rated?industry=${industry}`)
    const normalized = (data.results || []).map(normalizeMovie)
    setCache(cacheKey, normalized)
    return normalized
  } catch {
    const allowed = getIndustryLanguages(industry).map((code) => code.split('-')[0])
    const fallback = [...mockMovies]
      .filter((movie) => industry === 'all' || allowed.includes(movie.language || 'en'))
      .sort((a, b) => b.rating - a.rating)
      .map(normalizeMovie)
    setCache(cacheKey, fallback)
    return fallback
  }
}

export const getNowPlayingMovies = async (industry = 'all') => {
  const cacheKey = `nowPlaying:${industry}`
  const cached = getCache(cacheKey)
  if (cached) return cached

  try {
    if (TMDB_API_KEY) {
      const data = await fetchTmdbByLanguages('/movie/now_playing', { industry })
      setCache(cacheKey, data.results)
      return data.results
    }

    const { data } = await api.get(`/api/movies/now-playing?industry=${industry}`)
    const normalized = (data.results || []).map(normalizeMovie)
    setCache(cacheKey, normalized)
    return normalized
  } catch {
    const allowed = getIndustryLanguages(industry).map((code) => code.split('-')[0])
    const fallback = mockMovies
      .filter((movie) => industry === 'all' || allowed.includes(movie.language || 'en'))
      .slice(0, 8)
      .map(normalizeMovie)
    setCache(cacheKey, fallback)
    return fallback
  }
}

export const getUpcomingMovies = async (industry = 'all') => {
  const cacheKey = `upcoming:${industry}`
  const cached = getCache(cacheKey)
  if (cached) return cached

  try {
    if (TMDB_API_KEY) {
      const data = await fetchTmdbByLanguages('/movie/upcoming', { industry })
      setCache(cacheKey, data.results)
      return data.results
    }

    const { data } = await api.get(`/api/movies/upcoming?industry=${industry}`)
    const normalized = (data.results || []).map(normalizeMovie)
    setCache(cacheKey, normalized)
    return normalized
  } catch {
    const allowed = getIndustryLanguages(industry).map((code) => code.split('-')[0])
    const fallback = [...mockMovies]
      .filter((movie) => industry === 'all' || allowed.includes(movie.language || 'en'))
      .reverse()
      .slice(0, 8)
      .map(normalizeMovie)
    setCache(cacheKey, fallback)
    return fallback
  }
}

export const searchMovies = async (query, industry = 'all', options = {}) => {
  if (!query?.trim()) return []
  const cacheKey = `search:${query.toLowerCase()}:1`
  const cached = getCache(cacheKey)
  if (cached) return cached

  try {
    const data = await searchMoviesPage(query, 1)
    setCache(cacheKey, data.movies)
    return data.movies
  } catch {
    const allowed = getIndustryLanguages(industry).map((code) => code.split('-')[0])
    const fallback = mockMovies
      .filter((movie) => {
        const titleMatch = movie.title.toLowerCase().includes(query.toLowerCase())
        const languageMatch = industry === 'all' || allowed.includes(movie.language || 'en')
        return titleMatch && languageMatch
      })
      .map(normalizeMovie)
    setCache(cacheKey, fallback)
    return fallback
  }
}

export const getMovieDetails = async (id) => {
  try {
    if (TMDB_API_KEY) {
      const { data } = await api.get(getTmdbUrl(`/movie/${id}`), {
        params: {
          api_key: TMDB_API_KEY,
          append_to_response: 'videos',
        },
      })
      return normalizeMovie(data)
    }

    const { data } = await api.get(`/api/movies/${id}`)
    return normalizeMovie(data)
  } catch {
    const movie = mockMovies.find((item) => String(item.id) === String(id)) || mockMovies[0]
    return normalizeMovie(movie)
  }
}

export const getAiRecommendations = async (prompt) => {
  try {
    const { data } = await api.post('/api/recommend', {
      favorites: prompt,
    })

    return (data.recommendations || []).map(normalizeMovie)
  } catch {
    return mockAiRecommendations.map(normalizeMovie)
  }
}
