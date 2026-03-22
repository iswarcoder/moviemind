const bcrypt = require('bcryptjs')
const jwt = require('jsonwebtoken')
const asyncHandler = require('../middleware/asyncHandler')
const User = require('../models/User')

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

const generateToken = (id) =>
  jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: '7d',
  })

const registerUser = asyncHandler(async (req, res) => {
  const { name, email, password } = req.body
  console.log('[auth] register attempt:', { name, email })

  if (!name || !email || !password) {
    res.status(400)
    throw new Error('Name, email and password are required')
  }

  if (!emailRegex.test(email)) {
    res.status(400)
    throw new Error('Invalid email format')
  }

  if (password.length < 6) {
    res.status(400)
    throw new Error('Password must be at least 6 characters')
  }

  const existingUser = await User.findOne({ email: email.toLowerCase() })
  if (existingUser) {
    res.status(409)
    throw new Error('Email already exists')
  }

  const hashedPassword = await bcrypt.hash(password, 10)

  const user = await User.create({
    name,
    email: email.toLowerCase(),
    password: hashedPassword,
  })

  console.log('[auth] user registered:', { id: user._id, email: user.email })

  res.status(201).json({
    message: 'User registered successfully',
    token: generateToken(user._id),
    user: {
      id: user._id,
      name: user.name,
      email: user.email,
    },
  })
})

const loginUser = asyncHandler(async (req, res) => {
  const { email, password } = req.body
  console.log('[auth] login attempt:', { email })

  if (!email || !password) {
    res.status(400)
    throw new Error('Email and password are required')
  }

  const user = await User.findOne({ email: email.toLowerCase() })
  if (!user) {
    res.status(401)
    throw new Error('Invalid credentials')
  }

  const isMatch = await bcrypt.compare(password, user.password)
  if (!isMatch) {
    res.status(401)
    throw new Error('Invalid credentials')
  }

  console.log('[auth] login success:', { id: user._id, email: user.email })

  res.json({
    token: generateToken(user._id),
    user: {
      id: user._id,
      name: user.name,
      email: user.email,
    },
  })
})

const getCurrentUser = asyncHandler(async (req, res) => {
  console.log('[auth] profile lookup:', { id: req.user?._id, email: req.user?.email })
  res.json({ user: req.user })
})

module.exports = {
  registerUser,
  loginUser,
  getCurrentUser,
}
