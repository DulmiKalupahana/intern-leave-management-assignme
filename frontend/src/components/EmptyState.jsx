export default function EmptyState({ title, description, action }) {
  return (
    <div className="empty-state">
      <div className="empty-state__icon" aria-hidden="true">
        &#9675;
      </div>
      <h3>{title}</h3>
      {description ? <p>{description}</p> : null}
      {action ? <div className="empty-state__action">{action}</div> : null}
    </div>
  )
}
