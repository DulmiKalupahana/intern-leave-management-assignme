const STATUS_LABELS = {
  PENDING: 'Pending',
  APPROVED: 'Approved',
  REJECTED: 'Rejected',
}

export default function StatusBadge({ status }) {
  const normalized = String(status ?? '').toUpperCase()
  const modifier = normalized ? normalized.toLowerCase() : 'unknown'
  const label = STATUS_LABELS[normalized] ?? status ?? 'Unknown'

  return <span className={`badge badge--${modifier}`}>{label}</span>
}
