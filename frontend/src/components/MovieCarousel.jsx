import MovieCard from './MovieCard'

const MovieCarousel = ({ title, movies = [] }) => (
  <section className="space-y-4">
    <h2 className="text-xl font-semibold tracking-wide text-white">{title}</h2>
    <div className="movie-scrollbar flex snap-x snap-mandatory gap-4 overflow-x-auto pb-3">
      {movies.map((movie) => (
        <div key={movie.id} className="w-44 shrink-0 snap-start sm:w-52">
          <MovieCard movie={movie} />
        </div>
      ))}
    </div>
  </section>
)

export default MovieCarousel
