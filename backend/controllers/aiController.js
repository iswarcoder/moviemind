const axios = require('axios')

const CANDIDATE_MODELS = ['gemini-pro', 'gemini-2.0-flash', 'gemini-1.5-pro', 'gemini-1.5-flash']
const GEMINI_API_BASE = 'https://generativelanguage.googleapis.com/v1beta'
const FALLBACK_API_BASE = process.env.API_BASE_URL || `http://127.0.0.1:${process.env.PORT || 5000}`
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

const maskKey = (key) => {
  if (!key) return 'missing'
  if (key.length <= 8) return 'loaded'
  return `${key.slice(0, 4)}...${key.slice(-4)}`
}

const mapGeminiError = (error) => {
  const status = error.response?.status
  const details = error.response?.data?.error?.message || error.message
  const code = error.response?.data?.error?.status || error.code
  const lowerDetails = String(details || '').toLowerCase()

  if (status === 429 && (lowerDetails.includes('quota') || lowerDetails.includes('resource_exhausted'))) {
    return {
      status: 429,
      body: {
        message: 'Gemini quota exceeded. Please check billing or limits.',
        errorCode: 'insufficient_quota',
        error: details,
      },
    }
  }

  if (status === 429) {
    return {
      status: 429,
      body: {
        message: 'Gemini rate limit reached. Please try again shortly.',
        errorCode: code || 'rate_limited',
        error: details,
      },
    }
  }

  if (status === 401) {
    return {
      status: 401,
      body: {
        message: 'Gemini authentication failed. Check GEMINI_API_KEY.',
        errorCode: code || 'auth_failed',
        error: details,
      },
    }
  }

  if (status === 403) {
    return {
      status: 403,
      body: {
        message: 'Gemini access denied. Verify API key and enabled API project.',
        errorCode: code || 'auth_failed',
        error: details,
      },
    }
  }

  return {
    status: 500,
    body: {
      message: 'Failed to get movie recommendations from Gemini',
      errorCode: code || 'gemini_error',
      error: details,
    },
  }
}

const formatFallbackRecommendations = (recommendations, query) => {
  if (!recommendations.length) {
    return `I could not generate recommendations for: ${query}`
  }

  const lines = recommendations.slice(0, 8).map((movie, index) => {
    const parts = [movie.title || 'Untitled']

    if (movie.year) {
      parts.push(movie.year)
    }

    if (movie.imdbRating && movie.imdbRating !== 'N/A') {
      parts.push(`IMDb ${movie.imdbRating}`)
    }

    return `${index + 1}. ${parts.join(' | ')}`
  })

  return [`Gemini is temporarily unavailable, so here are OMDb-backed recommendations for: ${query}`, '', ...lines].join('\n')
}

const extractFallbackFavorites = (query) => {
  const normalized = String(query || '').toLowerCase()
  const favorites = []

  Object.entries(GENRE_SYNONYMS).forEach(([genre, synonyms]) => {
    const matchesGenre = normalized.includes(genre)
    const matchesSynonym = synonyms.some((term) => normalized.includes(term))

    if (matchesGenre || matchesSynonym) {
      favorites.push(genre)
    }
  })

  if (favorites.length) {
    return favorites.slice(0, 3)
  }

  return normalized
    .split(/[,\n]/)
    .map((item) => item.trim())
    .filter(Boolean)
    .slice(0, 3)
}

const getFallbackRecommendations = async (query) => {
  const favorites = extractFallbackFavorites(query)
  const response = await axios.post(
    `${FALLBACK_API_BASE}/api/recommend`,
    {
      query,
      favorites,
      limit: 20,
    },
    {
      timeout: 15000,
    }
  )

  const recommendations = Array.isArray(response.data?.recommendations) ? response.data.recommendations : []

  return {
    recommendations,
    result: formatFallbackRecommendations(recommendations, query),
  }
}

const recommendMovies = async (req, res) => {
  const query = req.body?.query?.trim()

  try {
    if (!query) {
      return res.status(400).json({ message: 'query is required' })
    }

    if (!process.env.GEMINI_API_KEY) {
      return res.status(500).json({ message: 'GEMINI_API_KEY is missing in environment' })
    }

    if (!process.env.GEMINI_API_KEY.startsWith('AIza')) {
      return res.status(500).json({
        message: 'GEMINI_API_KEY must start with AIza',
      })
    }

    if (
      process.env.GEMINI_API_KEY.includes('your_gemini_key') ||
      process.env.GEMINI_API_KEY.includes('replace_with_real_gemini_key')
    ) {
      return res.status(500).json({
        message: 'GEMINI_API_KEY is still a placeholder. Set a real key in backend/.env',
      })
    }

    console.log('[gemini] API key loaded:', Boolean(process.env.GEMINI_API_KEY), maskKey(process.env.GEMINI_API_KEY))
    console.log('[gemini] trying models:', CANDIDATE_MODELS.join(', '))

    let response
    let lastError

    for (const model of CANDIDATE_MODELS) {
      try {
        const requestUrl = `${GEMINI_API_BASE}/models/${model}:generateContent`
        console.log(`[gemini] attempting model: ${model}`)

        response = await axios.post(
          requestUrl,
          {
            contents: [
              {
                role: 'user',
                parts: [{ text: `Suggest a list of movies based on: ${query}` }],
              },
            ],
            generationConfig: {
              temperature: 0.7,
              maxOutputTokens: 300,
            },
          },
          {
            params: {
              key: process.env.GEMINI_API_KEY,
            },
            timeout: 15000,
          }
        )

        console.log(`[gemini] success with model: ${model}`)
        break
      } catch (modelError) {
        lastError = modelError
        const status = modelError.response?.status
        const errorMessage = modelError.response?.data?.error?.message || modelError.message

        if (status === 404 || errorMessage.includes('not found') || errorMessage.includes('not supported')) {
          console.log(`[gemini] model ${model} not found, trying next...`)
          continue
        }

        throw modelError
      }
    }

    if (!response) {
      throw lastError || new Error('No available Gemini model worked')
    }

    const responseText =
      response.data?.candidates?.[0]?.content?.parts
        ?.map((part) => part?.text)
        .filter(Boolean)
        .join('\n') || ''

    if (!responseText) {
      return res.status(502).json({
        message: 'Gemini returned an empty recommendation response.',
        errorCode: 'empty_gemini_response',
      })
    }

    return res.json({ result: responseText })
  } catch (error) {
    console.error('[gemini] request error:', {
      message: error.message,
      status: error.response?.status,
      code: error.response?.data?.error?.status || error.code,
      data: error.response?.data,
      stack: error.stack,
    })

    try {
      const fallback = await getFallbackRecommendations(query)

      return res.json({
        result: fallback.result,
        recommendations: fallback.recommendations,
        fallbackUsed: true,
      })
    } catch (fallbackError) {
      console.error('[gemini] fallback request error:', {
        message: fallbackError.message,
        status: fallbackError.response?.status,
        data: fallbackError.response?.data,
        stack: fallbackError.stack,
      })
    }

    const mappedError = mapGeminiError(error)
    return res.status(mappedError.status).json(mappedError.body)
  }
}

module.exports = { recommendMovies }
