import { useCallback, useEffect, useState } from 'react'
import { ApiError, getErrorMessage } from '../api/client'
import { createEmployee, getEmployees } from '../api/employees'
import { DEPARTMENTS } from '../api/store'
import EmptyState from '../components/EmptyState'
import Modal from '../components/Modal'
import Spinner from '../components/Spinner'
import { useToast } from '../components/ToastContext'

const EMPTY_FORM = { name: '', email: '', department: '', password: '' }
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const MIN_PASSWORD_LENGTH = 8

function formatCreatedAt(value) {
  if (!value) {
    return '—'
  }

  const date = new Date(value)
  if (Number.isNaN(date.getTime())) {
    return value
  }

  return date.toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })
}

async function fetchEmployees() {
  const data = await getEmployees()
  return Array.isArray(data) ? data : []
}

function AddEmployeeForm({ onCreated, onCancel }) {
  const { notify } = useToast()
  const [form, setForm] = useState(EMPTY_FORM)
  const [errors, setErrors] = useState({})
  const [submitting, setSubmitting] = useState(false)

  function handleChange(event) {
    const { name, value } = event.target
    setForm((current) => ({ ...current, [name]: value }))
    setErrors((current) => {
      if (!current[name]) {
        return current
      }
      const next = { ...current }
      delete next[name]
      return next
    })
  }

  function validate() {
    const nextErrors = {}

    if (!form.name.trim()) {
      nextErrors.name = 'Name is required'
    }

    if (!form.email.trim()) {
      nextErrors.email = 'Email is required'
    } else if (!EMAIL_PATTERN.test(form.email.trim())) {
      nextErrors.email = 'Enter a valid email address'
    }

    if (!form.department.trim()) {
      nextErrors.department = 'Department is required'
    }

    if (!form.password) {
      nextErrors.password = 'Password is required'
    } else if (form.password.length < MIN_PASSWORD_LENGTH) {
      nextErrors.password = `Password must be at least ${MIN_PASSWORD_LENGTH} characters`
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
      const created = await createEmployee({
        name: form.name.trim(),
        email: form.email.trim(),
        department: form.department.trim(),
        password: form.password,
      })
      onCreated(created)
    } catch (error) {
      if (error instanceof ApiError && error.status === 400) {
        setErrors(error.fieldErrors)
        notify('Please fix the highlighted fields.', 'error')
      } else if (error instanceof ApiError && error.status === 409) {
        setErrors({ email: 'Email already exists' })
        notify(error.message || 'Email already exists', 'error')
      } else {
        notify(
          getErrorMessage(error, 'Could not add employee. Please try again.'),
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
          <label htmlFor="employee-name">Name</label>
          <input
            id="employee-name"
            name="name"
            type="text"
            value={form.name}
            onChange={handleChange}
            placeholder="Jane Doe"
            autoComplete="name"
            required
            aria-invalid={Boolean(errors.name)}
            aria-describedby={errors.name ? 'employee-name-error' : undefined}
          />
          {errors.name ? (
            <p className="field-error" id="employee-name-error">
              {errors.name}
            </p>
          ) : null}
        </div>

        <div className="form-field">
          <label htmlFor="employee-email">Email</label>
          <input
            id="employee-email"
            name="email"
            type="email"
            value={form.email}
            onChange={handleChange}
            placeholder="jane.doe@omibits.com"
            autoComplete="email"
            required
            aria-invalid={Boolean(errors.email)}
            aria-describedby={errors.email ? 'employee-email-error' : undefined}
          />
          {errors.email ? (
            <p className="field-error" id="employee-email-error">
              {errors.email}
            </p>
          ) : null}
        </div>

        <div className="form-field">
          <label htmlFor="employee-department">Department</label>
          <select
            id="employee-department"
            name="department"
            value={form.department}
            onChange={handleChange}
            required
            aria-invalid={Boolean(errors.department)}
            aria-describedby={errors.department ? 'employee-department-error' : undefined}
          >
            <option value="">Select a department</option>
            {DEPARTMENTS.map((department) => (
              <option key={department} value={department}>
                {department}
              </option>
            ))}
          </select>
          {errors.department ? (
            <p className="field-error" id="employee-department-error">
              {errors.department}
            </p>
          ) : null}
        </div>

        <div className="form-field">
          <div className="label-row">
            <label htmlFor="employee-password">Temporary password</label>
            <span className="field-hint">min {MIN_PASSWORD_LENGTH} characters</span>
          </div>
          <input
            id="employee-password"
            name="password"
            type="password"
            value={form.password}
            onChange={handleChange}
            placeholder="Set an initial password"
            autoComplete="new-password"
            required
            aria-invalid={Boolean(errors.password)}
            aria-describedby={errors.password ? 'employee-password-error' : undefined}
          />
          {errors.password ? (
            <p className="field-error" id="employee-password-error">
              {errors.password}
            </p>
          ) : null}
        </div>
      </div>

      <p className="form-hint">
        The employee uses this email and password to sign in with Employee Login.
      </p>

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
          {submitting ? 'Adding...' : 'Add employee'}
        </button>
      </div>
    </form>
  )
}

export default function EmployeesPage() {
  const { notify } = useToast()
  const [employees, setEmployees] = useState([])
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState('')
  const [formOpen, setFormOpen] = useState(false)

  const loadEmployees = useCallback(async () => {
    setLoading(true)
    setLoadError('')

    try {
      setEmployees(await fetchEmployees())
    } catch (error) {
      setLoadError(getErrorMessage(error, 'Could not load employees. Please try again.'))
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    let active = true

    fetchEmployees()
      .then((data) => {
        if (active) {
          setEmployees(data)
        }
      })
      .catch((error) => {
        if (active) {
          setLoadError(
            getErrorMessage(error, 'Could not load employees. Please try again.'),
          )
        }
      })
      .finally(() => {
        if (active) {
          setLoading(false)
        }
      })

    return () => {
      active = false
    }
  }, [])

  function handleCreated(created) {
    setFormOpen(false)
    notify(`Employee "${created.name}" added. They can now sign in.`, 'success')
    loadEmployees()
  }

  let content

  if (loading) {
    content = <Spinner label="Loading employees..." />
  } else if (loadError) {
    content = (
      <EmptyState
        title="Could not load employees"
        description={loadError}
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
        title="No employees yet"
        description="Add your first employee to create their login account."
        action={
          <button
            type="button"
            className="btn btn--primary"
            onClick={() => setFormOpen(true)}
          >
            Add Employee
          </button>
        }
      />
    )
  } else {
    content = (
      <div className="table-wrap">
        <table className="data-table">
          <thead>
            <tr>
              <th scope="col">ID</th>
              <th scope="col">Name</th>
              <th scope="col">Email</th>
              <th scope="col">Department</th>
              <th scope="col">Created</th>
            </tr>
          </thead>
          <tbody>
            {employees.map((employee) => (
              <tr key={employee.id}>
                <td className="cell--nowrap">#{employee.id}</td>
                <td>{employee.name}</td>
                <td>{employee.email}</td>
                <td>{employee.department}</td>
                <td className="cell--nowrap">
                  {formatCreatedAt(employee.createdAt)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    )
  }

  return (
    <>
      <section className="card">
        <div className="card__header">
          <div>
            <h2 className="card__title">Employee management</h2>
            <p className="card__subtitle">
              {employees.length}{' '}
              {employees.length === 1 ? 'employee account' : 'employee accounts'}
            </p>
          </div>

          <div className="toolbar">
            <button
              type="button"
              className="btn btn--ghost"
              onClick={loadEmployees}
              disabled={loading}
            >
              Refresh
            </button>
            <button
              type="button"
              className="btn btn--primary"
              onClick={() => setFormOpen(true)}
            >
              Add Employee
            </button>
          </div>
        </div>

        {content}
      </section>

      {formOpen ? (
        <Modal title="Add employee" onClose={() => setFormOpen(false)}>
          <p className="modal__context">
            Creates the employee record and their login account in one step.
          </p>
          <AddEmployeeForm
            onCreated={handleCreated}
            onCancel={() => setFormOpen(false)}
          />
        </Modal>
      ) : null}
    </>
  )
}
