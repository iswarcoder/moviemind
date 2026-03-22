const jwt = require('jsonwebtoken')
const User = require('../models/User')

const protect = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization
    console.log('[auth] protected route access:', { path: req.originalUrl, hasHeader: Boolean(authHeader) })

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      console.log('[auth] missing bearer token')
      return res.status(401).json({ message: 'Not authorized, token missing' })
    }

    const token = authHeader.split(' ')[1]
    console.log('[auth] verifying token')
    const decoded = jwt.verify(token, process.env.JWT_SECRET)
    const user = await User.findById(decoded.id).select('-password')

    if (!user) {
      console.log('[auth] token valid but user not found:', decoded.id)
      return res.status(401).json({ message: 'Not authorized, user not found' })
    }

    console.log('[auth] token accepted:', { id: user._id, email: user.email })
    req.user = user
    next()
  } catch (error) {
    console.log('[auth] token verification failed:', error.message)
    return res.status(401).json({ message: 'Not authorized, token invalid' })
  }
}

module.exports = { protect }
