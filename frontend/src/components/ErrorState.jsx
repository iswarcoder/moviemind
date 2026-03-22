const ErrorState = ({ title = 'Something went wrong', message, actionLabel, onAction }) => (
  <div className="rounded-xl border border-red-700/60 bg-red-950/50 p-4 text-red-200">
    <h3 className="text-lg font-semibold">{title}</h3>
    {message ? <p className="mt-1 text-sm text-red-300">{message}</p> : null}
    {actionLabel && onAction ? (
      <button
        type="button"
        onClick={onAction}
        className="mt-3 rounded-lg bg-red-700 px-3 py-2 text-sm font-medium text-white transition hover:bg-red-600"
      >
        {actionLabel}
      </button>
    ) : null}
  </div>
)

export default ErrorState
