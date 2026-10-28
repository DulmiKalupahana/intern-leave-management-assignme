import { useEffect, useId, useRef } from 'react'

export default function Modal({ title, onClose, children }) {
  const panelRef = useRef(null)
  const titleId = useId()

  useEffect(() => {
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'

    function handleKeyDown(event) {
      if (event.key === 'Escape') {
        onClose()
      }
    }

    document.addEventListener('keydown', handleKeyDown)

    const focusTarget =
      panelRef.current?.querySelector(
        '.modal__body textarea, .modal__body input, .modal__body select, .modal__body button',
      ) ?? panelRef.current?.querySelector('button')

    focusTarget?.focus()

    return () => {
      document.removeEventListener('keydown', handleKeyDown)
      document.body.style.overflow = previousOverflow
    }
  }, [onClose])

  return (
    <div
      className="modal-overlay"
      role="presentation"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) {
          onClose()
        }
      }}
    >
      <div
        className="modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        ref={panelRef}
      >
        <div className="modal__header">
          <h3 id={titleId}>{title}</h3>
          <button
            type="button"
            className="modal__close"
            onClick={onClose}
            aria-label="Close dialog"
          >
            &times;
          </button>
        </div>

        <div className="modal__body">{children}</div>
      </div>
    </div>
  )
}
