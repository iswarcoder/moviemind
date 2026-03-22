import { useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import { loginUser } from '../redux/authSlice'

const LoginPage = () => {
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const location = useLocation()
  const { loading, error } = useSelector((state) => state.auth)
  const [form, setForm] = useState({ email: '', password: '' })
  const [showPassword, setShowPassword] = useState(false)

  const handleChange = (event) => {
    setForm((prev) => ({ ...prev, [event.target.name]: event.target.value }))
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    const action = await dispatch(loginUser(form))

    if (loginUser.fulfilled.match(action)) {
      toast.success('Welcome back!')
      const destination = location.state?.from || '/dashboard'
      navigate(destination, { replace: true })
    } else {
      toast.error(action.payload || 'Login failed')
    }
  }

  return (
    <main className="mx-auto flex min-h-[calc(100vh-10rem)] max-w-6xl items-center px-4 py-10">
      <div className="grid w-full overflow-hidden rounded-3xl border border-zinc-800 bg-zinc-950/80 shadow-2xl shadow-black/30 lg:grid-cols-[1.1fr_0.9fr]">
        <section className="relative hidden flex-col justify-between overflow-hidden border-r border-zinc-800 bg-gradient-to-br from-red-950 via-zinc-950 to-black p-8 lg:flex">
          <div className="absolute inset-0 opacity-20 [background-image:radial-gradient(circle_at_20%_20%,rgba(239,68,68,0.6),transparent_0_24%),radial-gradient(circle_at_80%_30%,rgba(248,113,113,0.35),transparent_0_20%),radial-gradient(circle_at_50%_80%,rgba(38,38,38,0.9),transparent_0_30%)]" />
          <div className="relative">
            <p className="text-sm uppercase tracking-[0.3em] text-red-300">MovieMind</p>
            <h1 className="mt-6 max-w-sm text-4xl font-bold leading-tight text-white">
              Sign in and continue your movie journey.
            </h1>
            <p className="mt-4 max-w-md text-sm leading-6 text-zinc-300">
              Access your dashboard, favorites, watchlist, and personalized recommendations with one secure login.
            </p>
          </div>
          <div className="relative grid gap-3 text-sm text-zinc-300">
            <div className="rounded-2xl border border-white/10 bg-white/5 p-4 backdrop-blur">
              JWT authentication
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/5 p-4 backdrop-blur">
              Protected routes and profile access
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/5 p-4 backdrop-blur">
              Fast navigation after login
            </div>
          </div>
        </section>

        <section className="p-6 sm:p-8 lg:p-10">
          <div className="mb-6 lg:hidden">
            <p className="text-sm uppercase tracking-[0.3em] text-red-400">MovieMind</p>
            <h1 className="mt-2 text-2xl font-semibold text-white">Login</h1>
          </div>

          <div className="mx-auto max-w-md">
            <h2 className="hidden text-3xl font-semibold text-white lg:block">Login</h2>
            <p className="mt-2 text-sm text-zinc-400">Use your account email and password to continue.</p>

            <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <input
            name="email"
            type="email"
            required
            value={form.email}
            onChange={handleChange}
            placeholder="Email"
            className="w-full rounded-xl border border-zinc-700 bg-zinc-950 px-4 py-3 text-zinc-100 outline-none ring-red-500 transition placeholder:text-zinc-500 focus:border-red-500 focus:ring-2"
          />
          <div className="space-y-2">
            <input
              name="password"
              type={showPassword ? 'text' : 'password'}
              required
              value={form.password}
              onChange={handleChange}
              placeholder="Password"
              className="w-full rounded-xl border border-zinc-700 bg-zinc-950 px-4 py-3 text-zinc-100 outline-none ring-red-500 transition placeholder:text-zinc-500 focus:border-red-500 focus:ring-2"
            />
            <button
              type="button"
              onClick={() => setShowPassword((prev) => !prev)}
              className="text-sm text-zinc-400 transition hover:text-zinc-200"
            >
              {showPassword ? 'Hide password' : 'Show password'}
            </button>
          </div>

          {error ? <p className="text-sm text-red-400">{error}</p> : null}

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-xl bg-red-600 px-4 py-3 font-medium text-white shadow-lg shadow-red-950/40 transition hover:bg-red-500 disabled:cursor-not-allowed disabled:bg-zinc-700"
          >
            {loading ? 'Signing in...' : 'Login'}
          </button>
        </form>

            <p className="mt-5 text-sm text-zinc-400">
              New here?{' '}
              <Link to="/signup" className="font-medium text-red-400 hover:text-red-300">
                Create account
              </Link>
            </p>
          </div>
        </section>
      </div>
    </main>
  )
}

export default LoginPage
