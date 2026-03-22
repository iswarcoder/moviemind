import { useEffect, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { useParams } from 'react-router-dom'
import toast from 'react-hot-toast'
import Loader from '../components/Loader'
import ErrorState from '../components/ErrorState'
import { fetchMovieDetailsThunk } from '../redux/movieSlice'
import {
  addRecentlyViewedThunk,
  fetchMovieFeedbackThunk,
  saveMovieFeedbackThunk,
} from '../redux/userSlice'

const MovieDetailsPage = () => {
  const { id } = useParams()
  const dispatch = useDispatch()
  const { movieDetails, loadingMovieDetails, error } = useSelector((state) => state.movies)
  const { feedbackByMovie } = useSelector((state) => state.user)
  const currentFeedback = feedbackByMovie[id] || {}
  const [rating, setRating] = useState(currentFeedback.rating || '')
  const [review, setReview] = useState(currentFeedback.review || '')

  useEffect(() => {
    dispatch(fetchMovieDetailsThunk(id))
    dispatch(fetchMovieFeedbackThunk())
  }, [dispatch, id])

  useEffect(() => {
    if (!movieDetails) return
    dispatch(addRecentlyViewedThunk(movieDetails))
  }, [dispatch, movieDetails])

  useEffect(() => {
    setRating(currentFeedback.rating || '')
    setReview(currentFeedback.review || '')
  }, [currentFeedback.rating, currentFeedback.review])

  const submitFeedback = async (event) => {
    event.preventDefault()
    const numericRating = Number(rating)
    if (!numericRating || numericRating < 1 || numericRating > 5) {
      toast.error('Please enter a rating from 1 to 5.')
      return
    }

    const action = await dispatch(
      saveMovieFeedbackThunk({
        movieId: id,
        rating: numericRating,
        review,
      }),
    )

    if (saveMovieFeedbackThunk.fulfilled.match(action)) {
      toast.success('Review saved!')
    } else {
      toast.error(action.payload || 'Unable to save review')
    }
  }

  if (loadingMovieDetails) {
    return (
      <main className="mx-auto max-w-5xl px-4 py-6">
        <Loader type="details" />
      </main>
    )
  }

  if (error) {
    return (
      <main className="mx-auto max-w-5xl px-4 py-6">
        <ErrorState message={error} />
      </main>
    )
  }

  if (!movieDetails) return null

  return (
    <main className="mx-auto grid max-w-6xl gap-8 px-4 py-6 md:grid-cols-[320px_1fr]">
      <img
        src={movieDetails.posterPath}
        alt={movieDetails.title}
        loading="lazy"
        className="w-full rounded-2xl border border-zinc-800 object-cover shadow-2xl shadow-black/40"
      />

      <section>
        <h1 className="text-4xl font-bold text-white">{movieDetails.title}</h1>
        <p className="mt-3 text-zinc-300">{movieDetails.overview}</p>
        <p className="mt-4 text-sm text-zinc-400">Rating: {movieDetails.rating}</p>

        <div className="mt-4 flex flex-wrap gap-2">
          {(movieDetails.genres || []).map((genre) => (
            <span key={genre} className="rounded-full bg-zinc-800 px-3 py-1 text-xs text-zinc-200">
              {genre}
            </span>
          ))}
        </div>

        {movieDetails.trailerKey ? (
          <div className="mt-8 overflow-hidden rounded-xl border border-zinc-800">
            <iframe
              title={`${movieDetails.title} trailer`}
              src={`https://www.youtube.com/embed/${movieDetails.trailerKey}`}
              className="aspect-video w-full"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
          </div>
        ) : null}

        <form onSubmit={submitFeedback} className="mt-8 rounded-xl border border-zinc-800 bg-zinc-900/60 p-4">
          <h2 className="text-xl font-semibold text-white">Your Rating & Review</h2>
          <div className="mt-3 flex flex-col gap-3">
            <input
              type="number"
              min="1"
              max="5"
              step="0.1"
              value={rating}
              onChange={(event) => setRating(event.target.value)}
              placeholder="Rate this movie (1-5)"
              className="w-full max-w-xs rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-2 text-zinc-100 outline-none ring-red-500 transition focus:ring-2"
            />
            <textarea
              value={review}
              onChange={(event) => setReview(event.target.value)}
              rows={4}
              placeholder="Write your review..."
              className="w-full rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-2 text-zinc-100 outline-none ring-red-500 transition focus:ring-2"
            />
            <button
              type="submit"
              className="w-fit rounded-lg bg-red-600 px-4 py-2 font-medium text-white transition hover:bg-red-500"
            >
              Save Review
            </button>
          </div>
        </form>
      </section>
    </main>
  )
}

export default MovieDetailsPage
