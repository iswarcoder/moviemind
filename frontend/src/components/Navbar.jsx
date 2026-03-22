import { Link, NavLink, useNavigate } from 'react-router-dom'
import { useEffect, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import clsx from 'clsx'
import { searchMoviesThunk } from '../redux/movieSlice'
import useDebounce from '../hooks/useDebounce'
import { logout } from '../redux/authSlice'
import IndustryFilterDropdown from './IndustryFilterDropdown'

const Navbar = () => {
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const [query, setQuery] = useState('')
  const debouncedQuery = useDebounce(query, 350)
  const { suggestions } = useSelector((state) => state.movies)
  const { isAuthenticated } = useSelector((state) => state.auth)
  const { selectedIndustry } = useSelector((state) => state.filter)

  useEffect(() => {
    if (debouncedQuery.trim().length < 2) return
    dispatch(
      searchMoviesThunk({ query: debouncedQuery, industry: selectedIndustry, isSuggestion: true }),
    )
  }, [debouncedQuery, dispatch, selectedIndustry])

  const submitSearch = (event) => {
    event.preventDefault()
    if (!query.trim()) return
    navigate(
      `/search?q=${encodeURIComponent(query.trim())}&industry=${encodeURIComponent(selectedIndustry)}`,
    )
    setQuery('')
  }

  const linkClass = ({ isActive }) =>
    clsx('rounded-md px-3 py-1.5 text-sm transition', {
      'bg-zinc-800 text-white': isActive,
      'text-zinc-300 hover:bg-zinc-800/70 hover:text-white': !isActive,
    })

  return (
    <header className="sticky top-0 z-40 border-b border-zinc-800 bg-zinc-950/90 backdrop-blur">
      <div className="mx-auto flex max-w-7xl flex-wrap items-center gap-3 px-4 py-3">
        <Link to="/" className="mr-2 text-xl font-bold tracking-widest text-red-500">
          MOVIEMIND
        </Link>

        <nav className="flex items-center gap-1">
          <NavLink to="/" className={linkClass}>
            Home
          </NavLink>
          <NavLink to="/favorites" className={linkClass}>
            Favorites
          </NavLink>
          <NavLink to="/watchlist" className={linkClass}>
            Watchlist
          </NavLink>
          <NavLink to="/history" className={linkClass}>
            History
          </NavLink>
          <NavLink to="/industry" className={linkClass}>
            Industry
          </NavLink>
        </nav>

        <IndustryFilterDropdown className="hidden lg:inline-flex" />

        <form onSubmit={submitSearch} className="relative ml-auto flex-1 min-w-56 max-w-sm">
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search movies..."
            className="w-full rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm text-zinc-100 outline-none ring-red-500 transition focus:ring-2"
          />
          {query.trim().length >= 2 && suggestions.length > 0 ? (
            <div className="absolute left-0 right-0 top-[105%] rounded-lg border border-zinc-700 bg-zinc-900/95 shadow-xl">
              {suggestions.map((movie) => (
                <button
                  key={movie.id}
                  type="button"
                  onClick={() => {
                    navigate(`/movies/${movie.id}`)
                    setQuery('')
                  }}
                  className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-zinc-200 transition hover:bg-zinc-800"
                >
                  <img src={movie.posterPath} alt={movie.title} className="h-10 w-8 rounded object-cover" />
                  <span className="line-clamp-1">{movie.title}</span>
                </button>
              ))}
            </div>
          ) : null}
        </form>

        <div className="flex items-center gap-2">
          {isAuthenticated ? (
            <>
              <NavLink to="/dashboard" className={linkClass}>
                Dashboard
              </NavLink>
              <button
                type="button"
                onClick={() => dispatch(logout())}
                className="rounded-md bg-red-600 px-3 py-1.5 text-sm font-medium text-white transition hover:bg-red-500"
              >
                Logout
              </button>
            </>
          ) : (
            <>
              <NavLink to="/login" className={linkClass}>
                Login
              </NavLink>
              <NavLink to="/signup" className="rounded-md bg-red-600 px-3 py-1.5 text-sm font-medium text-white transition hover:bg-red-500">
                Signup
              </NavLink>
            </>
          )}
        </div>
      </div>
    </header>
  )
}

export default Navbar
