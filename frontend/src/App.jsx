import { Suspense, lazy, useEffect } from 'react'
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import { useDispatch, useSelector } from 'react-redux'
import Navbar from './components/Navbar'
import Footer from './components/Footer'
import ProtectedRoute from './components/ProtectedRoute'
import Loader from './components/Loader'
import { fetchCurrentUser } from './redux/authSlice'

const HomePage = lazy(() => import('./pages/HomePage'))
const SearchPage = lazy(() => import('./pages/SearchPage'))
const MovieDetailsPage = lazy(() => import('./pages/MovieDetailsPage'))
const LoginPage = lazy(() => import('./pages/LoginPage'))
const SignupPage = lazy(() => import('./pages/SignupPage'))
const DashboardPage = lazy(() => import('./pages/DashboardPage'))
const FavoritesPage = lazy(() => import('./pages/FavoritesPage'))
const WatchlistPage = lazy(() => import('./pages/WatchlistPage'))
const WatchHistoryPage = lazy(() => import('./pages/WatchHistoryPage'))
const IndustryFilterPage = lazy(() => import('./pages/IndustryFilterPage'))

const AppLayout = () => (
  <div className="relative min-h-screen bg-ink text-zinc-100">
    <div className="bg-orb pointer-events-none" />
    <Navbar />
    <div className="animate-fadeUp">
      <Suspense
        fallback={
          <main className="mx-auto max-w-7xl px-4 py-6">
            <Loader />
          </main>
        }
      >
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/search" element={<SearchPage />} />
          <Route path="/industry" element={<IndustryFilterPage />} />
          <Route path="/movies/:id" element={<MovieDetailsPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/signup" element={<SignupPage />} />
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <DashboardPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/favorites"
            element={
              <ProtectedRoute>
                <FavoritesPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/watchlist"
            element={
              <ProtectedRoute>
                <WatchlistPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/history"
            element={
              <ProtectedRoute>
                <WatchHistoryPage />
              </ProtectedRoute>
            }
          />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Suspense>
    </div>
    <Footer />
  </div>
)

function App() {
  const dispatch = useDispatch()
  const { token } = useSelector((state) => state.auth)

  useEffect(() => {
    if (token) {
      dispatch(fetchCurrentUser())
    }
  }, [token, dispatch])

  return (
    <BrowserRouter>
      <Toaster
        position="top-right"
        toastOptions={{
          style: {
            borderRadius: '10px',
            background: '#18181b',
            color: '#fafafa',
            border: '1px solid #3f3f46',
          },
        }}
      />
      <AppLayout />
    </BrowserRouter>
  )
}

export default App
