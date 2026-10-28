export default function Spinner({ label = 'Loading...' }) {
  return (
    <div className="spinner" role="status">
      <span className="spinner__circle" aria-hidden="true" />
      <span>{label}</span>
    </div>
  )
}
