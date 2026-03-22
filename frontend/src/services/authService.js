import api from './api'

const extractErrorMessage = (error, fallbackMessage) =>
  error?.response?.data?.message || error?.message || fallbackMessage

export const loginRequest = async (payload) => {
  try {
    const { data } = await api.post('/api/auth/login', payload)
    return data
  } catch (error) {
    throw new Error(extractErrorMessage(error, 'Login failed'))
  }
}

export const signupRequest = async (payload) => {
  try {
    const { data } = await api.post('/api/auth/register', payload)
    return data
  } catch (error) {
    throw new Error(extractErrorMessage(error, 'Signup failed'))
  }
}

export const getProfileRequest = async () => {
  try {
    const { data } = await api.get('/api/auth/profile')
    return data
  } catch (error) {
    throw new Error(extractErrorMessage(error, 'Failed to load profile'))
  }
}
