import { useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { Link, useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import { signupUser } from '../redux/authSlice'

const SignupPage = () => {
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const { loading, error } = useSelector((state) => state.auth)
  const [form, setForm] = useState({ name: '', email: '', password: '' })
  const [showPassword, setShowPassword] = useState(false)

  const handleChange = (event) => {
    setForm((prev) => ({ ...prev, [event.target.name]: event.target.value }))
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    const action = await dispatch(signupUser(form))

    if (signupUser.fulfilled.match(action)) {
      toast.success('Account created successfully!')
      navigate('/dashboard', { replace: true })
    } else {
      toast.error(action.payload || 'Signup failed')
    }
  }

  return (
    <main className="mx-auto flex min-h-[calc(100vh-10rem)] max-w-6xl items-center px-4 py-10">
      <div className="grid w-full overflow-hidden rounded-3xl border border-zinc-800 bg-zinc-950/80 shadow-2xl shadow-black/30 lg:grid-cols-[0.9fr_1.1fr]">
        <section className="relative hidden flex-col justify-between overflow-hidden border-r border-zinc-800 bg-gradient-to-br from-black via-zinc-950 to-red-950 p-8 lg:flex">
          <div className="absolute inset-0 opacity-20 [background-image:radial-gradient(circle_at_20%_20%,rgba(248,113,113,0.4),transparent_0_24%),radial-gradient(circle_at_80%_30%,rgba(239,68,68,0.5),transparent_0_20%),radial-gradient(circle_at_50%_80%,rgba(38,38,38,0.9),transparent_0_30%)]" />
          <div className="relative">
            <p className="text-sm uppercase tracking-[0.3em] text-red-300">MovieMind</p>
            <h1 className="mt-6 max-w-sm text-4xl font-bold leading-tight text-white">
              Create your account and start saving movies.
            </h1>
            <p className="mt-4 max-w-md text-sm leading-6 text-zinc-300">
              Register once and get access to favorites, watchlists, recent activity, and your secure profile.
            </p>
          </div>
          <div className="relative grid gap-3 text-sm text-zinc-300">
            <div className="rounded-2xl border border-white/10 bg-white/5 p-4 backdrop-blur">
              Secure password hashing with bcrypt
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/5 p-4 backdrop-blur">
              JWT session stored in localStorage
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/5 p-4 backdrop-blur">
              Protected access after signup
            </div>
          </div>
        </section>

        <section className="p-6 sm:p-8 lg:p-10">
          <div className="mb-6 lg:hidden">
            <p className="text-sm uppercase tracking-[0.3em] text-red-400">MovieMind</p>
            <h1 className="mt-2 text-2xl font-semibold text-white">Create Account</h1>
          </div>

          <div className="mx-auto max-w-md">
            <h2 className="hidden text-3xl font-semibold text-white lg:block">Create Account</h2>
            <p className="mt-2 text-sm text-zinc-400">Join now to start curating your movie collection.</p>

            <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <input
            name="name"
            required
            value={form.name}
            onChange={handleChange}
            placeholder="Full name"
            className="w-full rounded-xl border border-zinc-700 bg-zinc-950 px-4 py-3 text-zinc-100 outline-none ring-red-500 transition placeholder:text-zinc-500 focus:border-red-500 focus:ring-2"
          />
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
            {loading ? 'Creating...' : 'Signup'}
          </button>
        </form>

            <p className="mt-5 text-sm text-zinc-400">
              Already have an account?{' '}
              <Link to="/login" className="font-medium text-red-400 hover:text-red-300">
                Login
              </Link>
            </p>
          </div>
        </section>
      </div>
    </main>
  )
}

export default SignupPage
