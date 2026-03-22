require('dotenv').config()

const express = require('express')
const cors = require('cors')
const morgan = require('morgan')
const connectDB = require('./config/db')
const movieRoutes = require('./routes/movieRoutes')
const authRoutes = require('./routes/authRoutes')
const userRoutes = require('./routes/userRoutes')
const reviewRoutes = require('./routes/reviewRoutes')
const recommendRoutes = require('./routes/recommendRoutes')
const { notFound, errorHandler } = require('./middleware/errorMiddleware')

const app = express()

const maskKey = (key) => {
  if (!key) return 'missing'
  if (key.length <= 8) return 'loaded'
  return `${key.slice(0, 4)}...${key.slice(-4)}`
}

console.log('[env] OMDB_API_KEY loaded:', Boolean(process.env.OMDB_API_KEY), maskKey(process.env.OMDB_API_KEY))
console.log(
  '[env] GEMINI_API_KEY loaded:',
  Boolean(process.env.GEMINI_API_KEY),
  maskKey(process.env.GEMINI_API_KEY)
)

connectDB()

app.use(cors())
app.use(express.json())
app.use(morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev'))

app.get('/', (req, res) => {
  if (req.accepts('html')) {
    return res
      .status(200)
      .send('<!doctype html><html><head><meta charset="utf-8"><title>Movie API</title></head><body><h1>API is running successfully</h1><p>Status: ok</p></body></html>')
  }

  return res.json({
    message: 'API is running successfully',
    status: 'ok',
  })
})

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok' })
})

app.use('/api/movies', movieRoutes)
app.use('/api', recommendRoutes)
app.use('/api/ai', require('./routes/aiRoutes'))
app.use('/api/auth', authRoutes)
app.use('/api/user', userRoutes)
app.use('/api/reviews', reviewRoutes)

app.use(notFound)
app.use(errorHandler)

const PORT = process.env.PORT || 5000

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`)
})
