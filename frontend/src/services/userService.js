import api from './api'

const FAVORITES_KEY = 'favorites'
const WATCHLIST_KEY = 'watchlist'
const RECENTLY_VIEWED_KEY = 'recentlyViewed'
const FEEDBACK_KEY = 'movieFeedback'

const getLocalCollection = (key) => {
  const raw = localStorage.getItem(key)
  return raw ? JSON.parse(raw) : []
}

const setLocalCollection = (key, data) => {
  localStorage.setItem(key, JSON.stringify(data))
}

const toMovieObject = (movie) => ({
  id: movie.id,
  title: movie.title || movie.name,
  rating: Number(movie.vote_average || movie.rating || 0).toFixed(1),
  overview: movie.overview || '',
  posterPath: movie.poster_path
    ? `https://image.tmdb.org/t/p/w342${movie.poster_path}`
    : movie.posterPath,
  trailerKey:
    movie.trailerKey ||
    movie.trailer_key ||
    movie.videos?.results?.find((video) => video.type === 'Trailer' && video.site === 'YouTube')?.key ||
    '',
})

const hydrateMovieIds = async (items) => {
  if (!Array.isArray(items) || items.length === 0) return []
  if (typeof items[0] !== 'string') return items

  const requests = items.map((id) => api.get(`/api/movies/${id}`).then((res) => toMovieObject(res.data)))
  return Promise.all(requests)
}

export const getFavorites = async () => {
  try {
    const { data } = await api.get('/api/user/favorites')
    return await hydrateMovieIds(data.results || data.favorites || [])
  } catch {
    return getLocalCollection(FAVORITES_KEY)
  }
}

export const getWatchlist = async () => {
  try {
    const { data } = await api.get('/api/user/watchlist')
    return await hydrateMovieIds(data.results || data.watchlist || [])
  } catch {
    return getLocalCollection(WATCHLIST_KEY)
  }
}

const toggleInCollection = (collection, movie) => {
  const exists = collection.some((item) => item.id === movie.id)
  if (exists) {
    return collection.filter((item) => item.id !== movie.id)
  }
  return [movie, ...collection]
}

export const toggleFavorite = async (movie) => {
  try {
    const { data } = await api.post('/api/user/favorites/toggle', { movieId: movie.id })
    return await hydrateMovieIds(data.results || data.favorites || [])
  } catch {
    const updated = toggleInCollection(getLocalCollection(FAVORITES_KEY), movie)
    setLocalCollection(FAVORITES_KEY, updated)
    return updated
  }
}

export const toggleWatchlist = async (movie) => {
  try {
    const { data } = await api.post('/api/user/watchlist/toggle', { movieId: movie.id })
    return await hydrateMovieIds(data.results || data.watchlist || [])
  } catch {
    const updated = toggleInCollection(getLocalCollection(WATCHLIST_KEY), movie)
    setLocalCollection(WATCHLIST_KEY, updated)
    return updated
  }
}

export const getRecentlyViewed = async () => {
  try {
    const { data } = await api.get('/api/user/recently-viewed')
    return data.results || []
  } catch {
    return getLocalCollection(RECENTLY_VIEWED_KEY)
  }
}

export const addRecentlyViewed = async (movie) => {
  try {
    const { data } = await api.post('/api/user/recently-viewed', { movieId: movie.id })
    return data.results || []
  } catch {
    const existing = getLocalCollection(RECENTLY_VIEWED_KEY)
    const filtered = existing.filter((item) => item.id !== movie.id)
    const updated = [movie, ...filtered].slice(0, 12)
    setLocalCollection(RECENTLY_VIEWED_KEY, updated)
    return updated
  }
}

export const getMovieFeedback = async () => {
  try {
    const { data } = await api.get('/api/user/feedback')
    return data.results || {}
  } catch {
    return getLocalCollection(FEEDBACK_KEY)
  }
}

export const saveMovieFeedback = async ({ movieId, rating, review }) => {
  try {
    const { data } = await api.post('/api/user/feedback', { movieId, rating, review })
    return data.results || {}
  } catch {
    const feedback = getLocalCollection(FEEDBACK_KEY)
    const updated = {
      ...feedback,
      [movieId]: {
        rating,
        review,
        updatedAt: new Date().toISOString(),
      },
    }
    setLocalCollection(FEEDBACK_KEY, updated)
    return updated
  }
}
