const express = require('express')
const {
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
} = require('../controllers/userController')
const { protect } = require('../middleware/authMiddleware')

const router = express.Router()

router.post('/favorites', protect, addFavorite)
router.post('/favorites/toggle', protect, toggleFavorite)
router.get('/favorites', protect, getFavorites)
router.post('/watchlist', protect, addWatchlist)
router.post('/watchlist/toggle', protect, toggleWatchlist)
router.get('/watchlist', protect, getWatchlist)
router.get('/recently-viewed', protect, getRecentlyViewed)
router.post('/recently-viewed', protect, addRecentlyViewed)
router.get('/feedback', protect, getFeedback)
router.post('/feedback', protect, saveFeedback)

module.exports = router
