const axios = require('axios')
const jwt = require('jsonwebtoken')
const User = require('../models/User')
const History = require('../models/History')

const OMDB_BASE_URL = 'http://www.omdbapi.com/'
const GEMINI_API_BASE = 'https://generativelanguage.googleapis.com/v1beta'
const GEMINI_MODELS = ['gemini-2.0-flash', 'gemini-1.5-flash', 'gemini-1.5-pro']

const omdbClient = axios.create({
  baseURL: OMDB_BASE_URL,
  timeout: 10000,
})

const geminiClient = axios.create({
  baseURL: GEMINI_API_BASE,
  timeout: 15000,
})

const MIN_RESULTS = 20
const MAX_RESULTS = 50
const SEARCH_RESULTS_PER_QUERY = 10
const MAX_QUERIES = 6
const MAX_MOVIE_IDS_TO_RESOLVE = 6

const GENRE_SYNONYMS = {
  action: ['action', 'war', 'battle', 'mission'],
  adventure: ['adventure', 'journey', 'quest', 'explore'],
  animation: ['animation', 'animated', 'cartoon', 'family'],
  comedy: ['comedy', 'funny', 'friends', 'humor'],
  crime: ['crime', 'detective', 'police', 'heist'],
  drama: ['drama', 'family', 'life', 'emotional'],
  fantasy: ['fantasy', 'magic', 'myth', 'wizard'],
  horror: ['horror', 'ghost', 'evil', 'nightmare'],
  mystery: ['mystery', 'detective', 'case', 'secret'],
  romance: ['romance', 'love', 'relationship', 'heart'],
  'sci-fi': ['sci fi', 'science fiction', 'space', 'future', 'alien'],
  thriller: ['thriller', 'suspense', 'secret', 'spy'],
}

const TITLE_HINTS = {
  inception: ['sci-fi', 'thriller'],
  interstellar: ['sci-fi', 'drama'],
  matrix: ['sci-fi', 'action'],
  batman: ['action', 'crime'],
  joker: ['crime', 'drama'],
  dune: ['sci-fi', 'adventure'],
  avatar: ['sci-fi', 'adventure'],
  'john wick': ['action', 'thriller'],
  'mission impossible': ['action', 'thriller'],
}

const normalizeText = (value) => String(value || '').trim().toLowerCase()

const clamp = (value, min, max) => Math.min(max, Math.max(min, value))

const uniqueStrings = (values) => [...new Set(values.map(normalizeText).filter(Boolean))]

const isMovieId = (value) => /^tt\d+/i.test(String(value || '').trim())

const parseListInput = (...values) =>
  values
    .flatMap((value) => {
      if (Array.isArray(value)) return value
      if (typeof value === 'string') return value.split(/[,\n]/)
      return []
    })
    .map((item) => {
      if (typeof item === 'string') return item.trim()
      if (!item) return ''
      return String(item.title || item.name || item.genre || item.query || item.movieId || item.imdbID || '').trim()
    })
    .filter(Boolean)

const cleanMovie = (movie) => ({
  title: movie.Title || movie.title || '',
  year: movie.Year || movie.year || '',
  poster: movie.Poster && movie.Poster !== 'N/A' ? movie.Poster : null,
  imdbRating: movie.imdbRating && movie.imdbRating !== 'N/A' ? movie.imdbRating : 'N/A',
  plot: movie.Plot || movie.plot || '',
  genres: Array.isArray(movie.Genre)
    ? movie.Genre
    : String(movie.Genre || movie.genre || '')
        .split(',')
        .map((item) => item.trim())
        .filter(Boolean),
  imdbID: movie.imdbID || '',
})

const getApiKey = () => {
  const apiKey = process.env.OMDB_API_KEY

  console.log(
    '[recommend] OMDb key loaded:',
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

const fetchMovieDetails = async (apiKey, imdbID) => {
  const response = await omdbClient.get('/', {
    params: {
      i: imdbID,
      apikey: apiKey,
      plot: 'short',
    },
  })

  if (response.data?.Response === 'False') {
    const error = new Error(response.data?.Error || 'Movie not found')
    error.status = 400
    throw error
  }

  return cleanMovie(response.data)
}

const searchMovies = async (apiKey, query) => {
  const response = await omdbClient.get('/', {
    params: {
      s: query,
      apikey: apiKey,
      type: 'movie',
    },
  })

  if (response.data?.Response === 'False') {
    return []
  }

  return Array.isArray(response.data?.Search) ? response.data.Search : []
}

const extractGenreHints = (values) => {
  const hints = new Set()

  parseListInput(values).forEach((value) => {
    const normalized = normalizeText(value)

    Object.entries(GENRE_SYNONYMS).forEach(([genre, synonyms]) => {
      if (normalized === genre || normalized.includes(genre) || synonyms.some((term) => normalized.includes(term))) {
        hints.add(genre)
      }
    })

    Object.entries(TITLE_HINTS).forEach(([title, genres]) => {
      if (normalized.includes(title)) {
        genres.forEach((genre) => hints.add(genre))
      }
    })
  })

  return [...hints]
}

const resolveUserContext = async (req) => {
  const authHeader = req.headers.authorization

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return { userIds: [], recentQueries: [], recentMovieIds: [] }
  }

  try {
    const token = authHeader.split(' ')[1]
    const decoded = jwt.verify(token, process.env.JWT_SECRET)
    const [user, historyItems] = await Promise.all([
      User.findById(decoded.id).select('favorites recentlyViewed').lean(),
      History.find({ userId: decoded.id }).sort({ createdAt: -1 }).limit(3).select('query').lean(),
    ])

    if (!user) {
      return { userIds: [], recentQueries: [], recentMovieIds: [] }
    }

    return {
      userIds: [String(decoded.id)],
      recentQueries: Array.isArray(historyItems) ? historyItems.map((item) => item.query).filter(Boolean) : [],
      recentMovieIds: [
        ...(Array.isArray(user.favorites) ? user.favorites : []),
        ...(Array.isArray(user.recentlyViewed) ? user.recentlyViewed : []),
      ],
    }
  } catch {
    return { userIds: [], recentQueries: [], recentMovieIds: [] }
  }
}

const shouldUseGemini = (query) => {
  const normalized = normalizeText(query)
  return (
    normalized.includes('recommend me movies like') ||
    normalized.includes('movies like ') ||
    normalized.includes('similar to') ||
    normalized.startsWith('like ')
  )
}

const parseGeminiKeywords = (text) => {
  const normalized = String(text || '').trim()

  if (!normalized) return []

  try {
    const parsed = JSON.parse(normalized)
    if (Array.isArray(parsed)) {
      return parsed.map((item) => normalizeText(item)).filter(Boolean)
    }

    if (Array.isArray(parsed.keywords)) {
      return parsed.keywords.map((item) => normalizeText(item)).filter(Boolean)
    }

    if (Array.isArray(parsed.genres)) {
      return parsed.genres.map((item) => normalizeText(item)).filter(Boolean)
    }

    if (Array.isArray(parsed.queries)) {
      return parsed.queries.map((item) => normalizeText(item)).filter(Boolean)
    }
  } catch {
    // fall through to string parsing
  }

  return normalized
    .split(/[\n,]/)
    .map((item) => item.replace(/^[-*\d.)\s]+/, '').trim())
    .map(normalizeText)
    .filter((item) => item && item.length > 1)
}

const getGeminiKeywords = async (query) => {
  if (!process.env.GEMINI_API_KEY) {
    throw new Error('GEMINI_API_KEY is missing in environment')
  }

  console.log('Using Gemini AI')

  const prompt = [
    'Extract 3 to 5 short movie recommendation search keywords or genres from the user request.',
    'Return only a plain comma-separated list or a JSON array of strings.',
    `User request: ${query}`,
  ].join('\n')

  let lastError = null

  for (const model of GEMINI_MODELS) {
    try {
      const response = await geminiClient.post(
        `/models/${model}:generateContent`,
        {
          contents: [
            {
              role: 'user',
              parts: [{ text: prompt }],
            },
          ],
          generationConfig: {
            temperature: 0.2,
            maxOutputTokens: 120,
          },
        },
        {
          params: {
            key: process.env.GEMINI_API_KEY,
          },
        }
      )

      const responseText =
        response.data?.candidates?.[0]?.content?.parts
          ?.map((part) => part?.text)
          .filter(Boolean)
          .join('\n') || ''

      return parseGeminiKeywords(responseText)
    } catch (error) {
      lastError = error
      const status = error.response?.status
      const message = error.response?.data?.error?.message || error.message || ''

      if (status === 404 || /not found|not supported/i.test(message)) {
        continue
      }

      throw error
    }
  }

  throw lastError || new Error('No available Gemini model worked')
}

const shuffleArray = (items) => {
  const shuffled = [...items]

  for (let index = shuffled.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(Math.random() * (index + 1))
    ;[shuffled[index], shuffled[swapIndex]] = [shuffled[swapIndex], shuffled[index]]
  }

  return shuffled
}

const scoreRecommendation = (movie, preferredGenres, userInput) => {
  const candidateGenres = movie.genres.map(normalizeText)
  const matchedGenres = preferredGenres.filter((genre) => candidateGenres.includes(normalizeText(genre)))
  const ratingScore = Number.parseFloat(movie.imdbRating) || 0
  const title = normalizeText(movie.title)
  const normalizedInput = normalizeText(userInput)

  let score = matchedGenres.length * 10 + ratingScore

  if (normalizedInput && title.includes(normalizedInput)) {
    score += 8
  }

  if (normalizedInput.split(/\s+/).some((token) => token && title.includes(token))) {
    score += 3
  }

  return score
}

const buildSearchQueries = ({ userInput, preferenceSeeds, genreHints, geminiKeywords }) => {
  const queries = [
    userInput,
    ...preferenceSeeds,
    ...genreHints,
    ...geminiKeywords,
    'action',
    'thriller',
    'popular',
  ]

  return uniqueStrings(queries).slice(0, MAX_QUERIES)
}

const collectCandidates = async (apiKey, queries, excludedIds) => {
  const candidateMap = new Map()

  for (const query of queries) {
    try {
      const searchResults = await searchMovies(apiKey, query)

      for (const result of searchResults.slice(0, SEARCH_RESULTS_PER_QUERY)) {
        if (!result?.imdbID || excludedIds.has(result.imdbID) || candidateMap.has(result.imdbID)) {
          continue
        }

        candidateMap.set(result.imdbID, result)
      }
    } catch (error) {
      console.error('[recommend] search failed for query:', {
        query,
        message: error.message,
      })
    }
  }

  return [...candidateMap.values()]
}

const resolveMovieIdsToHints = async (apiKey, movieIds) => {
  const ids = uniqueStrings(movieIds).filter(isMovieId).slice(0, MAX_MOVIE_IDS_TO_RESOLVE)

  if (!ids.length) {
    return []
  }

  const resolved = await Promise.all(
    ids.map((id) =>
      fetchMovieDetails(apiKey, id).catch((error) => {
        console.error('[recommend] failed to resolve movie id:', {
          imdbID: id,
          message: error.message,
        })
        return null
      })
    )
  )

  return resolved
    .filter(Boolean)
    .flatMap((movie) => [movie.title, movie.plot, movie.genres.join(', '), movie.year])
}

const recommendMovies = async (req, res) => {
  try {
    const userInput = String(req.body?.query || req.body?.prompt || req.body?.userInput || '').trim()
    const requestedLimit = clamp(Number.parseInt(req.body?.limit || req.body?.count || MIN_RESULTS, 10) || MIN_RESULTS, MIN_RESULTS, MAX_RESULTS)

    if (!userInput) {
      return res.status(400).json({ message: 'query is required' })
    }

    const apiKey = getApiKey()
    const userContext = await resolveUserContext(req)
    const bodySeeds = parseListInput(
      req.body?.favorites,
      req.body?.history,
      req.body?.recentlyViewed,
      req.body?.watchHistory,
      req.body?.movies,
      req.body?.genres,
      req.body?.queries
    )

    const preferenceQueries = uniqueStrings([
      ...bodySeeds.filter((value) => !isMovieId(value)),
      ...userContext.recentQueries,
    ])

    const movieSeedValues = [
      ...bodySeeds.filter(isMovieId),
      ...userContext.recentMovieIds,
    ]

    const resolvedSeedTexts = await resolveMovieIdsToHints(apiKey, movieSeedValues)
    const genreHints = uniqueStrings([
      ...extractGenreHints([userInput]),
      ...extractGenreHints(preferenceQueries),
      ...extractGenreHints(resolvedSeedTexts),
    ])

    const shouldTryGemini = shouldUseGemini(userInput)
    let geminiKeywords = []

    console.log('Using OMDb logic')

    let queries = buildSearchQueries({
      userInput,
      preferenceSeeds: preferenceQueries,
      genreHints,
      geminiKeywords,
    })

    let candidates = await collectCandidates(apiKey, queries, new Set(movieSeedValues.filter(Boolean)))

    if (!candidates.length && shouldTryGemini) {
      try {
        geminiKeywords = await getGeminiKeywords(userInput)
        queries = buildSearchQueries({
          userInput,
          preferenceSeeds: preferenceQueries,
          genreHints,
          geminiKeywords,
        })
        candidates = await collectCandidates(apiKey, queries, new Set(movieSeedValues.filter(Boolean)))
      } catch (error) {
        console.error('[recommend] Gemini expansion failed, continuing with OMDb logic:', {
          message: error.message,
          status: error.response?.status,
        })
      }
    }

    if (!candidates.length) {
      queries = uniqueStrings([userInput, ...genreHints, 'action', 'thriller', 'popular'])
      candidates = await collectCandidates(apiKey, queries, new Set(movieSeedValues.filter(Boolean)))
    }

    const enrichedCandidates = await Promise.all(
      candidates.map(async (candidate) => {
        try {
          const movie = await fetchMovieDetails(apiKey, candidate.imdbID)
          return {
            ...movie,
            _score: scoreRecommendation(movie, genreHints, userInput),
          }
        } catch (error) {
          console.error('[recommend] detail fetch failed for candidate:', {
            imdbID: candidate.imdbID,
            message: error.message,
          })

          return {
            ...cleanMovie(candidate),
            _score: scoreRecommendation(cleanMovie(candidate), genreHints, userInput),
          }
        }
      })
    )

    const recommendations = shuffleArray(
      enrichedCandidates
        .sort((a, b) => b._score - a._score)
        .slice(0, requestedLimit)
        .map(({ _score, ...movie }) => movie)
    )

    return res.json({ recommendations })
  } catch (error) {
    console.error('[recommend] error:', {
      message: error.message,
      stack: error.stack,
    })

    const status = error.status || 500
    return res.status(status).json({
      message: error.message || 'Failed to generate recommendations',
    })
  }
}

module.exports = { recommendMovies }