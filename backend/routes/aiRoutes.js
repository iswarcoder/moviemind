const express = require('express')
const { recommendMovies } = require('../controllers/aiController')

const router = express.Router()

router.get('/recommend', (req, res) => {
	res.status(405).json({
		message: 'Use POST /api/ai/recommend with JSON body: { "query": "..." }',
	})
})

router.post('/recommend', recommendMovies)

module.exports = router
