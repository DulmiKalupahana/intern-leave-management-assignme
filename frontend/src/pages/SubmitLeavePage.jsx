import { useState } from 'react'
import { ApiError, getErrorMessage } from '../api/client'
import { createLeave } from '../api/leaves'
import {
  LEAVE_TYPE_OPTIONS,
  MAX_REASON_LENGTH,
  validateLeaveForm,
} from '../api/validation'
import { useToast } from '../components/ToastContext'

const EMPTY_FORM = {
  leaveType: '',
  startDate: '',
  endDate: '',
  reason: '',
}

export default function SubmitLeavePage({ onCreated, onCancel }) {
  const { notify } = useToast()
  const [form, setForm] = useState(EMPTY_FORM)
  const [errors, setErrors] = useState({})
  const [submitting, setSubmitting] = useState(false)

  function handleChange(event) {
    const { name, value } = event.target

    setForm((current) => ({ ...current, [name]: value }))
    setErrors((current) => {
      const next = { ...current }
      delete next[name]

      if (name === 'startDate' || name === 'endDate') {
        delete next.startDate
        delete next.endDate
      }

      return next
    })
  }

  function validate() {
    const nextErrors = validateLeaveForm(form)
    setErrors(nextErrors)
    return Object.keys(nextErrors).length === 0
  }

  async function handleSubmit(event) {
    event.preventDefault()

    if (submitting || !validate()) {
      return
    }

    setSubmitting(true)

    try {
      const created = await createLeave({
        leaveType: form.leaveType,
        startDate: form.startDate,
        endDate: form.endDate,
        reason: form.reason.trim(),
      })

      setForm(EMPTY_FORM)
      setErrors({})
      onCreated(created)
    } catch (error) {
      if (error instanceof ApiError && error.status === 400) {
        setErrors(error.fieldErrors)
        notify('Please fix the highlighted fields.', 'error')
      } else if (error instanceof ApiError && error.status === 409) {
        notify(
          error.message || 'This leave request overlaps with an existing request.',
          'error',
        )
      } else {
        notify(
          getErrorMessage(error, 'Could not submit leave request. Please try again.'),
          'error',
        )
      }
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <form className="form" onSubmit={handleSubmit} noValidate>
      <div className="form-grid">
        <div className="form-field">
          <label htmlFor="leave-type">Leave type</label>
          <select
            id="leave-type"
            name="leaveType"
            value={form.leaveType}
            onChange={handleChange}
            required
            aria-invalid={Boolean(errors.leaveType)}
            aria-describedby={errors.leaveType ? 'leave-type-error' : undefined}
          >
            <option value="">Select a leave type</option>
            {LEAVE_TYPE_OPTIONS.map((type) => (
              <option key={type.value} value={type.value}>
                {type.label}
              </option>
            ))}
          </select>
          {errors.leaveType ? (
            <p className="field-error" id="leave-type-error">
              {errors.leaveType}
            </p>
          ) : null}
        </div>

        <div className="form-field">
          <label htmlFor="leave-start-date">Start date</label>
          <input
            id="leave-start-date"
            name="startDate"
            type="date"
            value={form.startDate}
            onChange={handleChange}
            required
            aria-invalid={Boolean(errors.startDate)}
            aria-describedby={errors.startDate ? 'leave-start-error' : undefined}
          />
          {errors.startDate ? (
            <p className="field-error" id="leave-start-error">
              {errors.startDate}
            </p>
          ) : null}
        </div>

        <div className="form-field">
          <label htmlFor="leave-end-date">End date</label>
          <input
            id="leave-end-date"
            name="endDate"
            type="date"
            value={form.endDate}
            onChange={handleChange}
            required
            aria-invalid={Boolean(errors.endDate)}
            aria-describedby={errors.endDate ? 'leave-end-error' : undefined}
          />
          {errors.endDate ? (
            <p className="field-error" id="leave-end-error">
              {errors.endDate}
            </p>
          ) : null}
        </div>

        <div className="form-field form-field--full">
          <div className="label-row">
            <label htmlFor="leave-reason">Reason</label>
            <span className="field-hint">
              {form.reason.length}/{MAX_REASON_LENGTH}
            </span>
          </div>
          <textarea
            id="leave-reason"
            name="reason"
            value={form.reason}
            onChange={handleChange}
            maxLength={MAX_REASON_LENGTH}
            rows={4}
            placeholder="Briefly describe why you need leave"
            required
            aria-invalid={Boolean(errors.reason)}
            aria-describedby={errors.reason ? 'leave-reason-error' : undefined}
          />
          {errors.reason ? (
            <p className="field-error" id="leave-reason-error">
              {errors.reason}
            </p>
          ) : null}
        </div>
      </div>

      <div className="modal__actions">
        <button
          type="button"
          className="btn btn--ghost"
          onClick={onCancel}
          disabled={submitting}
        >
          Cancel
        </button>
        <button type="submit" className="btn btn--primary" disabled={submitting}>
          {submitting ? 'Submitting...' : 'Submit request'}
        </button>
      </div>
    </form>
  )
}
