import { createAsyncThunk, createSlice } from '@reduxjs/toolkit'
import {
  addRecentlyViewed,
  getFavorites,
  getMovieFeedback,
  getRecentlyViewed,
  saveMovieFeedback,
  getWatchlist,
  toggleFavorite,
  toggleWatchlist,
} from '../services/userService'

const initialState = {
  favorites: [],
  watchlist: [],
  recentlyViewed: [],
  feedbackByMovie: {},
  loading: false,
  error: null,
}

export const fetchFavorites = createAsyncThunk('user/fetchFavorites', async (_, thunkAPI) => {
  try {
    return await getFavorites()
  } catch (error) {
    return thunkAPI.rejectWithValue(error.message)
  }
})

export const fetchWatchlist = createAsyncThunk('user/fetchWatchlist', async (_, thunkAPI) => {
  try {
    return await getWatchlist()
  } catch (error) {
    return thunkAPI.rejectWithValue(error.message)
  }
})

export const toggleFavoriteThunk = createAsyncThunk('user/toggleFavorite', async (movie, thunkAPI) => {
  try {
    return await toggleFavorite(movie)
  } catch (error) {
    return thunkAPI.rejectWithValue(error.message)
  }
})

export const toggleWatchlistThunk = createAsyncThunk('user/toggleWatchlist', async (movie, thunkAPI) => {
  try {
    return await toggleWatchlist(movie)
  } catch (error) {
    return thunkAPI.rejectWithValue(error.message)
  }
})

export const fetchRecentlyViewed = createAsyncThunk('user/fetchRecentlyViewed', async (_, thunkAPI) => {
  try {
    return await getRecentlyViewed()
  } catch (error) {
    return thunkAPI.rejectWithValue(error.message)
  }
})

export const addRecentlyViewedThunk = createAsyncThunk('user/addRecentlyViewed', async (movie, thunkAPI) => {
  try {
    return await addRecentlyViewed(movie)
  } catch (error) {
    return thunkAPI.rejectWithValue(error.message)
  }
})

export const fetchMovieFeedbackThunk = createAsyncThunk('user/fetchFeedback', async (_, thunkAPI) => {
  try {
    return await getMovieFeedback()
  } catch (error) {
    return thunkAPI.rejectWithValue(error.message)
  }
})

export const saveMovieFeedbackThunk = createAsyncThunk('user/saveFeedback', async (payload, thunkAPI) => {
  try {
    return await saveMovieFeedback(payload)
  } catch (error) {
    return thunkAPI.rejectWithValue(error.message)
  }
})

const userSlice = createSlice({
  name: 'user',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchFavorites.pending, (state) => {
        state.loading = true
      })
      .addCase(fetchFavorites.fulfilled, (state, action) => {
        state.loading = false
        state.favorites = action.payload
      })
      .addCase(fetchFavorites.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload
      })
      .addCase(fetchWatchlist.pending, (state) => {
        state.loading = true
      })
      .addCase(fetchWatchlist.fulfilled, (state, action) => {
        state.loading = false
        state.watchlist = action.payload
      })
      .addCase(fetchWatchlist.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload
      })
      .addCase(toggleFavoriteThunk.fulfilled, (state, action) => {
        state.favorites = action.payload
      })
      .addCase(toggleWatchlistThunk.fulfilled, (state, action) => {
        state.watchlist = action.payload
      })
      .addCase(fetchRecentlyViewed.fulfilled, (state, action) => {
        state.recentlyViewed = action.payload
      })
      .addCase(addRecentlyViewedThunk.fulfilled, (state, action) => {
        state.recentlyViewed = action.payload
      })
      .addCase(fetchMovieFeedbackThunk.fulfilled, (state, action) => {
        state.feedbackByMovie = action.payload
      })
      .addCase(saveMovieFeedbackThunk.fulfilled, (state, action) => {
        state.feedbackByMovie = action.payload
      })
      .addMatcher(
        (action) => action.type.endsWith('/rejected') && action.type.startsWith('user/'),
        (state, action) => {
          state.error = action.payload || 'Something went wrong'
        },
      )
  },
})

export default userSlice.reducer
