import { configureStore } from '@reduxjs/toolkit'
import authReducer from './authSlice'
import movieReducer from './movieSlice'
import userReducer from './userSlice'
import filterReducer from './filterSlice'

const store = configureStore({
  reducer: {
    auth: authReducer,
    movies: movieReducer,
    user: userReducer,
    filter: filterReducer,
  },
})

export default store
