const mongoose = require('mongoose')

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      validate: {
        validator: (value) => emailRegex.test(value),
        message: 'Invalid email format',
      },
    },
    password: {
      type: String,
      required: true,
      minlength: 6,
    },
    favorites: {
      type: [String],
      default: [],
    },
    watchlist: {
      type: [String],
      default: [],
    },
    recentlyViewed: {
      type: [String],
      default: [],
    },
    feedbackByMovie: {
      type: Map,
      of: {
        rating: Number,
        review: String,
        updatedAt: Date,
      },
      default: {},
    },
  },
  {
    timestamps: true,
  },
)

module.exports = mongoose.model('User', userSchema)
