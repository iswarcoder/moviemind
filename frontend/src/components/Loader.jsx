const Loader = ({ count = 6, type = 'card' }) => {
  if (type === 'details') {
    return (
      <div className="animate-pulse rounded-2xl border border-zinc-800 bg-zinc-900/80 p-6">
        <div className="mb-6 h-10 w-2/3 rounded bg-zinc-800" />
        <div className="mb-4 h-80 rounded-xl bg-zinc-800" />
        <div className="mb-3 h-4 w-full rounded bg-zinc-800" />
        <div className="h-4 w-5/6 rounded bg-zinc-800" />
      </div>
    )
  }

  return (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
      {Array.from({ length: count }).map((_, index) => (
        <div
          key={index}
          className="animate-pulse rounded-xl border border-zinc-800 bg-zinc-900/70 p-3"
        >
          <div className="mb-3 h-52 rounded-lg bg-zinc-800" />
          <div className="mb-2 h-4 rounded bg-zinc-800" />
          <div className="h-4 w-1/2 rounded bg-zinc-800" />
        </div>
      ))}
    </div>
  )
}

export default Loader
