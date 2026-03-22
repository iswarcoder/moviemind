const mongoose = require('mongoose')

const recentlyViewedSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    movieId: {
      type: String,
      required: true,
      index: true,
    },
    viewedAt: {
      type: Date,
      default: Date.now,
      index: true,
    },
  },
  {
    versionKey: false,
  },
)

recentlyViewedSchema.index({ userId: 1, movieId: 1 }, { unique: true })

module.exports = mongoose.model('RecentlyViewed', recentlyViewedSchema)
