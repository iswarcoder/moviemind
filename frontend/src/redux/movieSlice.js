import { createAsyncThunk, createSlice } from '@reduxjs/toolkit'
import {
  getAiRecommendations,
  getMovieDetails,
  getNowPlayingMovies,
  getTopRatedMovies,
  getTrendingMovies,
  getUpcomingMovies,
  searchMovies,
} from '../services/movieService'

const initialState = {
  trending: [],
  nowPlaying: [],
  upcoming: [],
  topRated: [],
  searchResults: [],
  suggestions: [],
  movieDetails: null,
  aiRecommendations: [],
  trendingPage: 1,
  hasMoreTrending: true,
  loadingTrending: false,
  loadingTopRated: false,
  loadingNowPlaying: false,
  loadingUpcoming: false,
  loadingSearch: false,
  loadingMovieDetails: false,
  loadingAi: false,
  error: null,
}

export const fetchTrendingMovies = createAsyncThunk(
  'movies/fetchTrending',
  async ({ page = 1, append = false, industry = 'all' } = {}, thunkAPI) => {
    try {
      const data = await getTrendingMovies({ page, industry })
      return { ...data, append }
    } catch (error) {
      return thunkAPI.rejectWithValue(error.message)
    }
  },
)

export const fetchTopRatedMovies = createAsyncThunk('movies/fetchTopRated', async (industry, thunkAPI) => {
  try {
    return await getTopRatedMovies(industry)
  } catch (error) {
    return thunkAPI.rejectWithValue(error.message)
  }
})

export const fetchNowPlayingMovies = createAsyncThunk('movies/fetchNowPlaying', async (industry, thunkAPI) => {
  try {
    return await getNowPlayingMovies(industry)
  } catch (error) {
    return thunkAPI.rejectWithValue(error.message)
  }
})

export const fetchUpcomingMovies = createAsyncThunk('movies/fetchUpcoming', async (industry, thunkAPI) => {
  try {
    return await getUpcomingMovies(industry)
  } catch (error) {
    return thunkAPI.rejectWithValue(error.message)
  }
})

export const searchMoviesThunk = createAsyncThunk(
  'movies/search',
  async ({ query, industry = 'all', isSuggestion = false }, thunkAPI) => {
    try {
      const data = await searchMovies(query, industry, { fastMode: isSuggestion })
      return { data, isSuggestion }
    } catch (error) {
      return thunkAPI.rejectWithValue(error.message)
    }
  },
)

export const fetchMovieDetailsThunk = createAsyncThunk('movies/details', async (id, thunkAPI) => {
  try {
    return await getMovieDetails(id)
  } catch (error) {
    return thunkAPI.rejectWithValue(error.message)
  }
})

export const getAiRecommendationsThunk = createAsyncThunk(
  'movies/aiRecommendations',
  async (prompt, thunkAPI) => {
    try {
      return await getAiRecommendations(prompt)
    } catch (error) {
      return thunkAPI.rejectWithValue(error.message)
    }
  },
)

const movieSlice = createSlice({
  name: 'movies',
  initialState,
  reducers: {
    clearSearchResults(state) {
      state.searchResults = []
      state.suggestions = []
    },
    clearMovieError(state) {
      state.error = null
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchTrendingMovies.pending, (state) => {
        state.loadingTrending = true
      })
      .addCase(fetchTrendingMovies.fulfilled, (state, action) => {
        const { results, page, totalPages, append } = action.payload
        state.loadingTrending = false
        state.trending = append ? [...state.trending, ...results] : results
        state.trendingPage = page
        state.hasMoreTrending = page < totalPages
      })
      .addCase(fetchTrendingMovies.rejected, (state, action) => {
        state.loadingTrending = false
        state.error = action.payload
      })
      .addCase(fetchTopRatedMovies.pending, (state) => {
        state.loadingTopRated = true
      })
      .addCase(fetchTopRatedMovies.fulfilled, (state, action) => {
        state.loadingTopRated = false
        state.topRated = action.payload
      })
      .addCase(fetchTopRatedMovies.rejected, (state, action) => {
        state.loadingTopRated = false
        state.error = action.payload
      })
      .addCase(fetchNowPlayingMovies.pending, (state) => {
        state.loadingNowPlaying = true
      })
      .addCase(fetchNowPlayingMovies.fulfilled, (state, action) => {
        state.loadingNowPlaying = false
        state.nowPlaying = action.payload
      })
      .addCase(fetchNowPlayingMovies.rejected, (state, action) => {
        state.loadingNowPlaying = false
        state.error = action.payload
      })
      .addCase(fetchUpcomingMovies.pending, (state) => {
        state.loadingUpcoming = true
      })
      .addCase(fetchUpcomingMovies.fulfilled, (state, action) => {
        state.loadingUpcoming = false
        state.upcoming = action.payload
      })
      .addCase(fetchUpcomingMovies.rejected, (state, action) => {
        state.loadingUpcoming = false
        state.error = action.payload
      })
      .addCase(searchMoviesThunk.pending, (state) => {
        state.loadingSearch = true
      })
      .addCase(searchMoviesThunk.fulfilled, (state, action) => {
        state.loadingSearch = false
        if (action.payload.isSuggestion) {
          state.suggestions = action.payload.data.slice(0, 6)
        } else {
          state.searchResults = action.payload.data
        }
      })
      .addCase(searchMoviesThunk.rejected, (state, action) => {
        state.loadingSearch = false
        state.error = action.payload
      })
      .addCase(fetchMovieDetailsThunk.pending, (state) => {
        state.loadingMovieDetails = true
      })
      .addCase(fetchMovieDetailsThunk.fulfilled, (state, action) => {
        state.loadingMovieDetails = false
        state.movieDetails = action.payload
      })
      .addCase(fetchMovieDetailsThunk.rejected, (state, action) => {
        state.loadingMovieDetails = false
        state.error = action.payload
      })
      .addCase(getAiRecommendationsThunk.pending, (state) => {
        state.loadingAi = true
      })
      .addCase(getAiRecommendationsThunk.fulfilled, (state, action) => {
        state.loadingAi = false
        state.aiRecommendations = action.payload
      })
      .addCase(getAiRecommendationsThunk.rejected, (state, action) => {
        state.loadingAi = false
        state.error = action.payload
      })
  },
})

export const { clearSearchResults, clearMovieError } = movieSlice.actions
export default movieSlice.reducer
