import { useCallback, useEffect, useState } from 'react'
import { ApiError, getErrorMessage } from '../api/client'
import { createEmployee, getEmployees } from '../api/employees'
import EmptyState from '../components/EmptyState'
import Spinner from '../components/Spinner'
import { useToast } from '../components/ToastContext'

const EMPTY_FORM = { name: '', email: '', department: '' }
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

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

export default function EmployeesPage() {
  const { notify } = useToast()
  const [employees, setEmployees] = useState([])
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState('')
  const [form, setForm] = useState(EMPTY_FORM)
  const [errors, setErrors] = useState({})
  const [submitting, setSubmitting] = useState(false)

  const loadEmployees = useCallback(
    async ({ silent = false } = {}) => {
      if (!silent) {
        setLoading(true)
      }
      setLoadError('')

      try {
        const data = await fetchEmployees()
        setEmployees(data)
      } catch (error) {
        const message = getErrorMessage(
          error,
          'Could not load employees. Please try again.',
        )

        if (silent) {
          notify(message, 'error')
        } else {
          setLoadError(message)
        }
      } finally {
        if (!silent) {
          setLoading(false)
        }
      }
    },
    [notify],
  )

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
      })

      setEmployees((current) => [...current, created])
      setForm(EMPTY_FORM)
      setErrors({})
      notify(`Employee "${created.name}" added.`, 'success')
      await loadEmployees({ silent: true })
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
    <>
      <section className="card">
        <div className="card__header">
          <div>
            <h2 className="card__title">Add employee</h2>
            <p className="card__subtitle">
              Register an employee before submitting leave requests. All fields
              are required.
            </p>
          </div>
        </div>

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
              <input
                id="employee-department"
                name="department"
                type="text"
                value={form.department}
                onChange={handleChange}
                placeholder="Engineering"
                autoComplete="organization"
                required
                aria-invalid={Boolean(errors.department)}
                aria-describedby={
                  errors.department ? 'employee-department-error' : undefined
                }
              />
              {errors.department ? (
                <p className="field-error" id="employee-department-error">
                  {errors.department}
                </p>
              ) : null}
            </div>
          </div>

          <div className="form-actions">
            <button type="submit" className="btn btn--primary" disabled={submitting}>
              {submitting ? 'Adding...' : 'Add employee'}
            </button>
          </div>
        </form>
      </section>

      <section className="card">
        <div className="card__header">
          <div>
            <h2 className="card__title">Employee directory</h2>
            <p className="card__subtitle">
              {employees.length} {employees.length === 1 ? 'employee' : 'employees'}
            </p>
          </div>
        </div>

        {loading ? (
          <Spinner label="Loading employees..." />
        ) : loadError ? (
          <EmptyState
            title="Could not load employees"
            description={loadError}
            action={
              <button
                type="button"
                className="btn btn--primary"
                onClick={() => loadEmployees()}
              >
                Retry
              </button>
            }
          />
        ) : employees.length === 0 ? (
          <EmptyState
            title="No employees yet"
            description="Add your first employee using the form above."
          />
        ) : (
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
        )}
      </section>
    </>
  )
}
