const express = require('express')
const { recommendMovies } = require('../controllers/recommendController')

const router = express.Router()

router.post('/recommend', recommendMovies)

module.exports = router