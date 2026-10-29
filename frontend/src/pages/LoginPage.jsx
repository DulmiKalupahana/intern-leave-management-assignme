import { useEffect, useState } from 'react'
import { loginAsAdminSession, loginAsEmployeeSession } from '../api/auth'
import { getErrorMessage } from '../api/client'
import { getSelectableEmployees } from '../api/employees'

const ROLES = [
  {
    value: 'EMPLOYEE',
    title: 'Employee Login',
    description: 'Select an employee and submit or follow leave requests.',
    icon: '👤',
  },
  {
    value: 'ADMIN',
    title: 'Admin Login',
    description: 'Open the administrator dashboard directly.',
    icon: '🛡️',
  },
]

export default function LoginPage({ onLogin }) {
  const [mode, setMode] = useState(null)
  const [employees, setEmployees] = useState([])
  const [employeeId, setEmployeeId] = useState('')
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    let active = true

    getSelectableEmployees()
      .then((data) => {
        if (active) {
          setEmployees(Array.isArray(data) ? data : [])
        }
      })
      .catch(() => {
        if (active) {
          setError('Could not load employees. Try signing in as admin first.')
        }
      })

    return () => {
      active = false
    }
  }, [])

  async function handleAdmin() {
    if (submitting) {
      return
    }

    setSubmitting(true)
    setError('')

    try {
      onLogin(await loginAsAdminSession())
    } catch (loginError) {
      setError(getErrorMessage(loginError, 'Could not open the admin dashboard.'))
    } finally {
      setSubmitting(false)
    }
  }

  function chooseEmployee() {
    setMode('EMPLOYEE')
    setError('')
  }

  async function handleEmployeeSubmit(event) {
    event.preventDefault()

    if (submitting) {
      return
    }

    if (!employeeId) {
      setError('Select an employee to continue.')
      return
    }

    setSubmitting(true)
    setError('')

    try {
      onLogin(await loginAsEmployeeSession(employeeId))
    } catch (loginError) {
      setError(
        getErrorMessage(loginError, 'Could not open the employee dashboard.'),
      )
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="login-shell">
      <div className="login-panel">
        <div className="login-brand">
          <span className="brand__mark" aria-hidden="true">
            O
          </span>
          <div>
            <h1>Omibits Leave Management</h1>
            <p>Employee leave requests and approvals</p>
          </div>
        </div>

        <h2 className="login-title">Continue as</h2>
        <p className="login-subtitle">
          This demonstration uses passwordless role selection.
        </p>

        <div className="login-roles" role="group" aria-label="Choose login type">
          {ROLES.map((item) => (
            <button
              key={item.value}
              type="button"
              id={`${item.value.toLowerCase()}-login`}
              className={`role-card${mode === item.value ? ' role-card--active' : ''}`}
              aria-pressed={mode === item.value}
              onClick={item.value === 'ADMIN' ? handleAdmin : chooseEmployee}
              disabled={submitting}
            >
              <span className="role-card__icon" aria-hidden="true">
                {item.icon}
              </span>
              <span className="role-card__title">{item.title}</span>
              <span className="role-card__description">{item.description}</span>
            </button>
          ))}
        </div>

        {mode === 'EMPLOYEE' ? (
          <form className="form login-form" onSubmit={handleEmployeeSubmit}>
            <div className="form-field">
              <label htmlFor="employee-select">Select employee</label>
              <select
                id="employee-select"
                name="employeeId"
                value={employeeId}
                onChange={(event) => {
                  setEmployeeId(event.target.value)
                  setError('')
                }}
                required
              >
                <option value="">Choose an employee</option>
                {employees.map((employee) => (
                  <option key={employee.id} value={employee.id}>
                    {employee.name} — {employee.department}
                  </option>
                ))}
              </select>
              {employees.length === 0 ? (
                <p className="field-hint">
                  No employees yet. Open Admin Login to add one.
                </p>
              ) : null}
            </div>

            {error ? (
              <div className="form-alert" role="alert">
                {error}
              </div>
            ) : null}

            <button
              type="submit"
              className="btn btn--primary btn--block"
              disabled={submitting || employees.length === 0}
            >
              {submitting ? 'Opening...' : 'Continue to Employee Dashboard'}
            </button>
          </form>
        ) : (
          <p className="login-hint">
            Click <strong>Admin Login</strong> to open the dashboard, or{' '}
            <strong>Employee Login</strong> to choose an existing employee. No
            password is required in this demo.
          </p>
        )}

        {mode !== 'EMPLOYEE' && error ? (
          <div className="form-alert" role="alert">
            {error}
          </div>
        ) : null}
      </div>
    </div>
  )
}
