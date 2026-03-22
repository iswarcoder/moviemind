const express = require('express')
const { addReview, getReviewsByMovie } = require('../controllers/reviewController')
const { protect } = require('../middleware/authMiddleware')

const router = express.Router()

router.post('/', protect, addReview)
router.get('/:movieId', getReviewsByMovie)

module.exports = router
