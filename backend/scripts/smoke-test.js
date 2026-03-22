const BASE_URL = process.env.API_BASE_URL || 'http://127.0.0.1:5000'
const TEST_PASSWORD = 'secret123'

const headersForJson = (token) => {
  const headers = {
    'Content-Type': 'application/json',
  }

  if (token) {
    headers.Authorization = `Bearer ${token}`
  }

  return headers
}

const requestJson = async (method, path, { body, token } = {}) => {
  const response = await fetch(`${BASE_URL}${path}`, {
    method,
    headers: headersForJson(token),
    body: body ? JSON.stringify(body) : undefined,
  })

  const text = await response.text()
  let data = null

  if (text) {
    try {
      data = JSON.parse(text)
    } catch {
      data = text
    }
  }

  return {
    ok: response.ok,
    status: response.status,
    data,
  }
}

const assertOk = (label, result) => {
  if (!result.ok) {
    const detail = typeof result.data === 'string' ? result.data : JSON.stringify(result.data)
    throw new Error(`${label} failed (${result.status}): ${detail}`)
  }

  console.log(`${label}: ${result.status}`)
}

const formatDetail = (value) => {
  if (value == null) return ''
  if (typeof value === 'string') return value.replace(/\s+/g, ' ').slice(0, 90)
  return JSON.stringify(value).replace(/\s+/g, ' ').slice(0, 90)
}

const printSummaryTable = (rows) => {
  const headers = ['Route', 'Status', 'Notes']
  const widths = headers.map((header, index) => {
    const contentWidths = rows.map((row) => String(row[index] || '').length)
    return Math.max(header.length, ...contentWidths)
  })

  const formatRow = (values) => values.map((value, index) => String(value || '').padEnd(widths[index], ' ')).join(' | ')
  const separator = widths.map((width) => '-'.repeat(width)).join('-|-')

  console.log('')
  console.log('Smoke Test Summary')
  console.log(formatRow(headers))
  console.log(separator)
  rows.forEach((row) => console.log(formatRow(row)))
}

const main = async () => {
  console.log(`API base: ${BASE_URL}`)

  const summaryRows = []

  const record = (label, result, notes = '') => {
    summaryRows.push([label, String(result.status), notes])
    return result
  }

  const health = await requestJson('GET', '/api/health')
  record('GET /api/health', health, formatDetail(health.data))
  assertOk('GET /api/health', health)

  const movieInfo = await requestJson('GET', '/api/movies')
  record('GET /api/movies', movieInfo, formatDetail(movieInfo.data?.movies?.length ? `${movieInfo.data.movies.length} movies` : movieInfo.data))
  assertOk('GET /api/movies', movieInfo)

  const search = await requestJson('GET', '/api/movies/search?query=Batman')
  record('GET /api/movies/search', search, formatDetail(search.data?.movies?.length ? `${search.data.movies.length} results` : search.data))
  assertOk('GET /api/movies/search?query=Batman', search)

  const details = await requestJson('GET', '/api/movies/details?id=tt0137523')
  record('GET /api/movies/details', details, formatDetail(details.data?.title || details.data))
  assertOk('GET /api/movies/details?id=tt0137523', details)

  const recommend = await requestJson('POST', '/api/recommend', {
    body: {
      query: 'action thriller',
      favorites: ['tt0137523', 'action'],
      limit: 20,
    },
  })
  record('POST /api/recommend', recommend, formatDetail(recommend.data?.recommendations?.length ? `${recommend.data.recommendations.length} recommendations` : recommend.data))
  assertOk('POST /api/recommend', recommend)

  if (!Array.isArray(recommend.data?.recommendations)) {
    throw new Error('POST /api/recommend did not return a recommendations array')
  }

  const aiRecommend = await requestJson('POST', '/api/ai/recommend', {
    body: { query: 'suggest action movies' },
  })
  record('POST /api/ai/recommend', aiRecommend, formatDetail(aiRecommend.data?.fallbackUsed ? 'fallback used' : aiRecommend.data))
  assertOk('POST /api/ai/recommend', aiRecommend)

  const email = `smoke_${Date.now()}_${Math.random().toString(16).slice(2, 8)}@example.com`
  const register = await requestJson('POST', '/api/auth/register', {
    body: { name: 'Smoke Test User', email, password: TEST_PASSWORD },
  })
  record('POST /api/auth/register', register, formatDetail(register.data?.user?.email || register.data))
  assertOk('POST /api/auth/register', register)

  const login = await requestJson('POST', '/api/auth/login', {
    body: { email, password: TEST_PASSWORD },
  })
  record('POST /api/auth/login', login, formatDetail(login.data?.user?.email || login.data))
  assertOk('POST /api/auth/login', login)

  const token = login.data?.token || register.data?.token
  if (!token) {
    throw new Error('No token returned from register/login')
  }

  const me = await requestJson('GET', '/api/auth/me', { token })
  record('GET /api/auth/me', me, formatDetail(me.data?.email || me.data))
  assertOk('GET /api/auth/me', me)

  const movieId = 'tt0137523'
  const favoriteAdd = await requestJson('POST', '/api/user/favorites', {
    token,
    body: { movieId },
  })
  record('POST /api/user/favorites', favoriteAdd, formatDetail(favoriteAdd.data))
  assertOk('POST /api/user/favorites', favoriteAdd)

  const favorites = await requestJson('GET', '/api/user/favorites', { token })
  record('GET /api/user/favorites', favorites, formatDetail(favorites.data?.favorites?.length ? `${favorites.data.favorites.length} items` : favorites.data))
  assertOk('GET /api/user/favorites', favorites)

  const watchlistAdd = await requestJson('POST', '/api/user/watchlist', {
    token,
    body: { movieId },
  })
  record('POST /api/user/watchlist', watchlistAdd, formatDetail(watchlistAdd.data))
  assertOk('POST /api/user/watchlist', watchlistAdd)

  const watchlist = await requestJson('GET', '/api/user/watchlist', { token })
  record('GET /api/user/watchlist', watchlist, formatDetail(watchlist.data?.watchlist?.length ? `${watchlist.data.watchlist.length} items` : watchlist.data))
  assertOk('GET /api/user/watchlist', watchlist)

  const recentlyViewedAdd = await requestJson('POST', '/api/user/recently-viewed', {
    token,
    body: { movieId },
  })
  record('POST /api/user/recently-viewed', recentlyViewedAdd, formatDetail(recentlyViewedAdd.data))
  assertOk('POST /api/user/recently-viewed', recentlyViewedAdd)

  const recentlyViewed = await requestJson('GET', '/api/user/recently-viewed', { token })
  record('GET /api/user/recently-viewed', recentlyViewed, formatDetail(recentlyViewed.data?.recentlyViewed?.length ? `${recentlyViewed.data.recentlyViewed.length} items` : recentlyViewed.data))
  assertOk('GET /api/user/recently-viewed', recentlyViewed)

  const feedbackAdd = await requestJson('POST', '/api/user/feedback', {
    token,
    body: { movieId, rating: 5, review: 'great' },
  })
  record('POST /api/user/feedback', feedbackAdd, formatDetail(feedbackAdd.data))
  assertOk('POST /api/user/feedback', feedbackAdd)

  const feedback = await requestJson('GET', '/api/user/feedback', { token })
  record('GET /api/user/feedback', feedback, formatDetail(feedback.data?.feedbackByMovie ? 'feedback loaded' : feedback.data))
  assertOk('GET /api/user/feedback', feedback)

  const reviewAdd = await requestJson('POST', '/api/reviews', {
    token,
    body: { movieId, rating: 5, comment: 'great movie' },
  })
  record('POST /api/reviews', reviewAdd, formatDetail(reviewAdd.data))
  assertOk('POST /api/reviews', reviewAdd)

  const reviews = await requestJson('GET', `/api/reviews/${movieId}`)
  record('GET /api/reviews/:movieId', reviews, formatDetail(reviews.data?.reviews?.length ? `${reviews.data.reviews.length} reviews` : reviews.data))
  assertOk(`GET /api/reviews/${movieId}`, reviews)

  printSummaryTable(summaryRows)
  console.log('Smoke test completed successfully.')
}

main().catch((error) => {
  console.error('Smoke test failed:')
  console.error(error.message)
  process.exitCode = 1
})