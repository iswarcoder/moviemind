import { createAsyncThunk, createSlice } from '@reduxjs/toolkit'
import { getProfileRequest, loginRequest, signupRequest } from '../services/authService'

const tokenFromStorage = localStorage.getItem('token')
const userFromStorage = localStorage.getItem('user')

const initialState = {
  token: tokenFromStorage || null,
  user: userFromStorage ? JSON.parse(userFromStorage) : null,
  isAuthenticated: Boolean(tokenFromStorage),
  loading: false,
  error: null,
}

const persistSession = (token, user) => {
  localStorage.setItem('token', token)
  localStorage.setItem('user', JSON.stringify(user))
}

export const loginUser = createAsyncThunk('auth/login', async (payload, thunkAPI) => {
  try {
    return await loginRequest(payload)
  } catch (error) {
    return thunkAPI.rejectWithValue(error.message)
  }
})

export const signupUser = createAsyncThunk('auth/signup', async (payload, thunkAPI) => {
  try {
    return await signupRequest(payload)
  } catch (error) {
    return thunkAPI.rejectWithValue(error.message)
  }
})

export const fetchCurrentUser = createAsyncThunk('auth/currentUser', async (_, thunkAPI) => {
  try {
    return await getProfileRequest()
  } catch (error) {
    return thunkAPI.rejectWithValue(error.message)
  }
})

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    logout(state) {
      state.token = null
      state.user = null
      state.isAuthenticated = false
      state.error = null
      localStorage.removeItem('token')
      localStorage.removeItem('user')
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(loginUser.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(loginUser.fulfilled, (state, action) => {
        state.loading = false
        state.token = action.payload.token
        state.user = action.payload.user
        state.isAuthenticated = true
        persistSession(action.payload.token, action.payload.user)
      })
      .addCase(loginUser.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload
      })
      .addCase(signupUser.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(signupUser.fulfilled, (state, action) => {
        state.loading = false
        state.token = action.payload.token
        state.user = action.payload.user
        state.isAuthenticated = true
        persistSession(action.payload.token, action.payload.user)
      })
      .addCase(signupUser.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload
      })
      .addCase(fetchCurrentUser.fulfilled, (state, action) => {
        state.user = action.payload.user || action.payload
        state.isAuthenticated = true
      })
  },
})

export const { logout } = authSlice.actions
export default authSlice.reducer
