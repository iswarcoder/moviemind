const express = require('express')
const {
  getMovieApiInfo,
  searchMovies,
  getMovieDetails,
} = require('../controllers/movieController')

const router = express.Router()

router.get('/', getMovieApiInfo)
router.get('/search', searchMovies)
router.get('/details', getMovieDetails)

module.exports = router
