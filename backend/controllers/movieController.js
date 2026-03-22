const axios = require('axios')

const OMDB_BASE_URL = 'http://www.omdbapi.com/'
const omdbClient = axios.create({
  baseURL: OMDB_BASE_URL,
  timeout: 10000,
})

const getOMDBApiKey = () => {
  const apiKey = process.env.OMDB_API_KEY
  console.log(
    '[omdb] api key loaded:',
    Boolean(apiKey),
    apiKey ? `${apiKey.slice(0, 4)}...${apiKey.slice(-4)}` : 'missing'
  )

  if (!apiKey) {
    const error = new Error('OMDB_API_KEY is missing in environment')
    error.status = 500
    throw error
  }

  return apiKey
}

const cleanMovie = (movie) => ({
  title: movie.Title || '',
  year: movie.Year || '',
  poster: movie.Poster && movie.Poster !== 'N/A' ? movie.Poster : null,
  imdbRating: movie.imdbRating && movie.imdbRating !== 'N/A' ? movie.imdbRating : 'N/A',
  plot: movie.Plot || '',
  imdbID: movie.imdbID || '',
})

const fetchMovieDetailsById = async (id, apiKey) => {
  const response = await omdbClient.get('/', {
    params: {
      i: id,
      apikey: apiKey,
      plot: 'short',
    },
  })

  if (response.data?.Response === 'False') {
    const error = new Error(response.data?.Error || 'Movie not found')
    error.response = { status: 400, data: response.data }
    throw error
  }

  return cleanMovie(response.data)
}

const sendOmdbError = (res, error, fallbackMessage) => {
  console.error('[omdb] request error:', {
    message: error.message,
    status: error.response?.status,
    data: error.response?.data,
    stack: error.stack,
  })

  if (error.status === 500 || error.message === 'OMDB_API_KEY is missing in environment') {
    return res.status(500).json({ message: error.message })
  }

  const status = error.response?.status || error.status || 400
  const message = error.response?.data?.Error || error.message || fallbackMessage
  return res.status(status).json({ message })
}

const searchMovies = async (req, res) => {
  try {
    const query = String(req.query.query || '').trim()
    const pageNumber = Math.max(1, Number.parseInt(req.query.page, 10) || 1)

    if (!query) {
      return res.status(400).json({ message: 'query is required' })
    }

    const apiKey = getOMDBApiKey()
    console.log('[omdb] search request:', {
      query,
      page: pageNumber,
      url: `${OMDB_BASE_URL}?s=${encodeURIComponent(query)}&page=${pageNumber}&apikey=***masked***`,
    })

    const response = await omdbClient.get('/', {
      params: {
        s: query,
        page: pageNumber,
        apikey: apiKey,
      },
    })

    if (response.data?.Response === 'False') {
      return res.json({ movies: [], totalResults: 0, page: pageNumber })
    }

    const movies = Array.isArray(response.data?.Search) ? response.data.Search : []

    return res.json({
      movies,
      totalResults: response.data?.totalResults || 0,
      page: pageNumber,
    })
  } catch (error) {
    return sendOmdbError(res, error, 'Failed to search movies')
  }
}

const getMovieDetails = async (req, res) => {
  try {
    const id = String(req.query.id || '').trim()

    if (!id) {
      return res.status(400).json({ message: 'id is required' })
    }

    const apiKey = getOMDBApiKey()
    console.log('[omdb] details request:', {
      id,
      url: `${OMDB_BASE_URL}?i=${encodeURIComponent(id)}&apikey=***masked***`,
    })

    const response = await omdbClient.get('/', {
      params: {
        i: id,
        apikey: apiKey,
      },
    })

    if (response.data?.Response === 'False') {
      return res.status(400).json({ message: response.data?.Error || 'Movie not found' })
    }

    const movie = response.data || {}

    return res.json({
      title: movie.Title || '',
      year: movie.Year || '',
      poster: movie.Poster && movie.Poster !== 'N/A' ? movie.Poster : null,
      imdbRating: movie.imdbRating && movie.imdbRating !== 'N/A' ? movie.imdbRating : 'N/A',
      plot: movie.Plot || '',
    })
  } catch (error) {
    return sendOmdbError(res, error, 'Failed to fetch movie details')
  }
}

const getMovieApiInfo = (req, res) => {
  res.json({
    status: 'ok',
    service: 'Movie API using OMDb',
    routes: {
      health: '/api/health',
      search: '/api/movies/search?query=movie_name&page=1',
      details: '/api/movies/details?id=imdbID',
    },
  })
}

module.exports = {
  searchMovies,
  getMovieDetails,
  getMovieApiInfo,
}