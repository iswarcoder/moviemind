const asyncHandler = require('../middleware/asyncHandler')
const User = require('../models/User')

const addUnique = (arr, value) => {
  if (arr.includes(value)) return arr
  return [...arr, value]
}

const addFavorite = asyncHandler(async (req, res) => {
  const { movieId } = req.body

  if (!movieId) {
    res.status(400)
    throw new Error('movieId is required')
  }

  const user = await User.findById(req.user._id)
  user.favorites = addUnique(user.favorites, String(movieId))
  await user.save()

  res.status(201).json({ favorites: user.favorites, results: user.favorites })
})

const toggleFavorite = asyncHandler(async (req, res) => {
  const { movieId } = req.body

  if (!movieId) {
    res.status(400)
    throw new Error('movieId is required')
  }

  const user = await User.findById(req.user._id)
  const id = String(movieId)

  if (user.favorites.includes(id)) {
    user.favorites = user.favorites.filter((item) => item !== id)
  } else {
    user.favorites = [...user.favorites, id]
  }

  await user.save()
  res.json({ favorites: user.favorites, results: user.favorites })
})

const getFavorites = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id).select('favorites')
  res.json({ favorites: user.favorites, results: user.favorites })
})

const addWatchlist = asyncHandler(async (req, res) => {
  const { movieId } = req.body

  if (!movieId) {
    res.status(400)
    throw new Error('movieId is required')
  }

  const user = await User.findById(req.user._id)
  user.watchlist = addUnique(user.watchlist, String(movieId))
  await user.save()

  res.status(201).json({ watchlist: user.watchlist, results: user.watchlist })
})

const toggleWatchlist = asyncHandler(async (req, res) => {
  const { movieId } = req.body

  if (!movieId) {
    res.status(400)
    throw new Error('movieId is required')
  }

  const user = await User.findById(req.user._id)
  const id = String(movieId)

  if (user.watchlist.includes(id)) {
    user.watchlist = user.watchlist.filter((item) => item !== id)
  } else {
    user.watchlist = [...user.watchlist, id]
  }

  await user.save()
  res.json({ watchlist: user.watchlist, results: user.watchlist })
})

const getWatchlist = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id).select('watchlist')
  res.json({ watchlist: user.watchlist, results: user.watchlist })
})

const getRecentlyViewed = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id).select('recentlyViewed')
  res.json({ results: user.recentlyViewed || [] })
})

const addRecentlyViewed = asyncHandler(async (req, res) => {
  const { movieId } = req.body

  if (!movieId) {
    res.status(400)
    throw new Error('movieId is required')
  }

  const user = await User.findById(req.user._id)
  const id = String(movieId)

  const filtered = (user.recentlyViewed || []).filter((item) => item !== id)
  user.recentlyViewed = [id, ...filtered].slice(0, 20)
  await user.save()

  res.json({ results: user.recentlyViewed })
})

const getFeedback = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id).select('feedbackByMovie')
  const feedback = user.feedbackByMovie ? Object.fromEntries(user.feedbackByMovie) : {}
  res.json({ results: feedback })
})

const saveFeedback = asyncHandler(async (req, res) => {
  const { movieId, rating, review } = req.body

  if (!movieId || !rating) {
    res.status(400)
    throw new Error('movieId and rating are required')
  }

  const user = await User.findById(req.user._id)
  user.feedbackByMovie = user.feedbackByMovie || new Map()
  user.feedbackByMovie.set(String(movieId), {
    rating: Number(rating),
    review: review || '',
    updatedAt: new Date(),
  })

  await user.save()

  res.json({ results: Object.fromEntries(user.feedbackByMovie) })
})

module.exports = {
  addFavorite,
  toggleFavorite,
  getFavorites,
  addWatchlist,
  toggleWatchlist,
  getWatchlist,
  getRecentlyViewed,
  addRecentlyViewed,
  getFeedback,
  saveFeedback,
}
