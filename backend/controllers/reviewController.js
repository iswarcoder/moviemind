const asyncHandler = require('../middleware/asyncHandler')
const Review = require('../models/Review')

const addReview = asyncHandler(async (req, res) => {
  const { movieId, rating, comment } = req.body

  if (!movieId || !rating || !comment) {
    res.status(400)
    throw new Error('movieId, rating and comment are required')
  }

  if (Number(rating) < 1 || Number(rating) > 5) {
    res.status(400)
    throw new Error('Rating must be between 1 and 5')
  }

  const review = await Review.create({
    userId: req.user._id,
    movieId: String(movieId),
    rating: Number(rating),
    comment,
  })

  res.status(201).json(review)
})

const getReviewsByMovie = asyncHandler(async (req, res) => {
  const { movieId } = req.params

  const reviews = await Review.find({ movieId: String(movieId) })
    .populate('userId', 'name email')
    .sort({ createdAt: -1 })

  res.json({ results: reviews })
})

module.exports = {
  addReview,
  getReviewsByMovie,
}
