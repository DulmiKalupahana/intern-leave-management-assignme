import { useCallback, useEffect, useState } from 'react'
import { ApiError, getErrorMessage } from '../api/client'
import { getEmployees } from '../api/employees'
import { createLeave } from '../api/leaves'
import EmptyState from '../components/EmptyState'
import Spinner from '../components/Spinner'
import { useToast } from '../components/ToastContext'

const EMPTY_FORM = {
  employeeId: '',
  leaveType: '',
  startDate: '',
  endDate: '',
  reason: '',
}

const LEAVE_TYPES = [
  { value: 'ANNUAL', label: 'Annual' },
  { value: 'CASUAL', label: 'Casual' },
  { value: 'MEDICAL', label: 'Medical' },
]

const MAX_REASON_LENGTH = 500

export default function SubmitLeavePage({ onGoToEmployees }) {
  const { notify } = useToast()
  const [employees, setEmployees] = useState([])
  const [loadingEmployees, setLoadingEmployees] = useState(true)
  const [employeesError, setEmployeesError] = useState('')
  const [form, setForm] = useState(EMPTY_FORM)
  const [errors, setErrors] = useState({})
  const [submitting, setSubmitting] = useState(false)

  const loadEmployees = useCallback(async () => {
    setLoadingEmployees(true)
    setEmployeesError('')

    try {
      const data = await getEmployees()
      setEmployees(Array.isArray(data) ? data : [])
    } catch (error) {
      setEmployeesError(
        getErrorMessage(error, 'Could not load employees. Please try again.'),
      )
    } finally {
      setLoadingEmployees(false)
    }
  }, [])

  useEffect(() => {
    let active = true

    getEmployees()
      .then((data) => {
        if (active) {
          setEmployees(Array.isArray(data) ? data : [])
        }
      })
      .catch((error) => {
        if (active) {
          setEmployeesError(
            getErrorMessage(error, 'Could not load employees. Please try again.'),
          )
        }
      })
      .finally(() => {
        if (active) {
          setLoadingEmployees(false)
        }
      })

    return () => {
      active = false
    }
  }, [])

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
    const nextErrors = {}

    if (!form.employeeId) {
      nextErrors.employeeId = 'Employee is required'
    }

    if (!form.leaveType) {
      nextErrors.leaveType = 'Leave type is required'
    }

    if (!form.startDate) {
      nextErrors.startDate = 'Start date is required'
    }

    if (!form.endDate) {
      nextErrors.endDate = 'End date is required'
    }

    if (form.startDate && form.endDate && form.endDate < form.startDate) {
      nextErrors.endDate = 'End date cannot be before start date'
    }

    if (!form.reason.trim()) {
      nextErrors.reason = 'Reason is required'
    } else if (form.reason.length > MAX_REASON_LENGTH) {
      nextErrors.reason = `Reason must not exceed ${MAX_REASON_LENGTH} characters`
    }

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
      await createLeave({
        employeeId: Number(form.employeeId),
        leaveType: form.leaveType,
        startDate: form.startDate,
        endDate: form.endDate,
        reason: form.reason.trim(),
      })

      notify('Leave request submitted (status: Pending)', 'success')
      setForm(EMPTY_FORM)
      setErrors({})
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

  let content

  if (loadingEmployees) {
    content = <Spinner label="Loading employees..." />
  } else if (employeesError) {
    content = (
      <EmptyState
        title="Could not load employees"
        description={employeesError}
        action={
          <button type="button" className="btn btn--primary" onClick={loadEmployees}>
            Retry
          </button>
        }
      />
    )
  } else if (employees.length === 0) {
    content = (
      <EmptyState
        title="Add an employee first"
        description="Leave requests must be linked to an employee. Add one on the Employees tab, then come back here."
        action={
          <button type="button" className="btn btn--primary" onClick={onGoToEmployees}>
            Go to Employees
          </button>
        }
      />
    )
  } else {
    content = (
      <form className="form" onSubmit={handleSubmit} noValidate>
        <div className="form-grid">
          <div className="form-field">
            <label htmlFor="leave-employee">Employee</label>
            <select
              id="leave-employee"
              name="employeeId"
              value={form.employeeId}
              onChange={handleChange}
              aria-invalid={Boolean(errors.employeeId)}
              aria-describedby={errors.employeeId ? 'leave-employee-error' : undefined}
            >
              <option value="">Select an employee</option>
              {employees.map((employee) => (
                <option key={employee.id} value={employee.id}>
                  {employee.name} ({employee.department})
                </option>
              ))}
            </select>
            {errors.employeeId ? (
              <p className="field-error" id="leave-employee-error">
                {errors.employeeId}
              </p>
            ) : null}
          </div>

          <div className="form-field">
            <label htmlFor="leave-type">Leave type</label>
            <select
              id="leave-type"
              name="leaveType"
              value={form.leaveType}
              onChange={handleChange}
              aria-invalid={Boolean(errors.leaveType)}
              aria-describedby={errors.leaveType ? 'leave-type-error' : undefined}
            >
              <option value="">Select a leave type</option>
              {LEAVE_TYPES.map((type) => (
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

        <div className="form-actions">
          <button type="submit" className="btn btn--primary" disabled={submitting}>
            {submitting ? 'Submitting...' : 'Submit request'}
          </button>
        </div>
      </form>
    )
  }

  return (
    <section className="card">
      <div className="card__header">
        <div>
          <h2 className="card__title">Submit leave request</h2>
          <p className="card__subtitle">
            Requests are submitted as Pending and reviewed by an administrator.
          </p>
        </div>
      </div>

      {content}
    </section>
  )
}
