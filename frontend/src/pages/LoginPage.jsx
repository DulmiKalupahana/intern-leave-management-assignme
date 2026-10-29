import { useState } from 'react'
import { login } from '../api/auth'
import { ApiError, getErrorMessage } from '../api/client'

const ROLES = [
  {
    value: 'EMPLOYEE',
    title: 'Employee Login',
    description: 'Submit leave requests and follow their status.',
    icon: '👤',
  },
  {
    value: 'ADMIN',
    title: 'Admin Login',
    description: 'Manage employees and approve or reject leave.',
    icon: '🛡️',
  },
]

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export default function LoginPage({ onLogin }) {
  const [role, setRole] = useState(null)
  const [form, setForm] = useState({ email: '', password: '' })
  const [errors, setErrors] = useState({})
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const selectedRole = ROLES.find((item) => item.value === role)

  function chooseRole(value) {
    setRole(value)
    setError('')
    setErrors({})
  }

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
    if (error) {
      setError('')
    }
  }

  function validate() {
    const nextErrors = {}

    if (!form.email.trim()) {
      nextErrors.email = 'Email is required'
    } else if (!EMAIL_PATTERN.test(form.email.trim())) {
      nextErrors.email = 'Enter a valid email address'
    }

    if (!form.password) {
      nextErrors.password = 'Password is required'
    }

    setErrors(nextErrors)
    return Object.keys(nextErrors).length === 0
  }

  async function handleSubmit(event) {
    event.preventDefault()

    if (submitting || !role || !validate()) {
      return
    }

    setSubmitting(true)
    setError('')

    try {
      const session = await login({
        email: form.email.trim(),
        password: form.password,
        role,
      })
      onLogin(session)
    } catch (loginError) {
      if (loginError instanceof ApiError && loginError.status === 401) {
        setError('Invalid email or password.')
      } else if (loginError instanceof ApiError && loginError.status === 403) {
        setError(loginError.message)
      } else if (loginError instanceof ApiError && loginError.status === 400) {
        setErrors(loginError.fieldErrors)
        setError('Please fix the highlighted fields.')
      } else {
        setError(
          getErrorMessage(loginError, 'Could not sign in. Please try again.'),
        )
      }
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

        <h2 className="login-title">Sign in</h2>
        <p className="login-subtitle">
          Choose how you want to continue. Access is scoped to your role.
        </p>

        <div className="login-roles" role="group" aria-label="Choose login type">
          {ROLES.map((item) => (
            <button
              key={item.value}
              type="button"
              id={`${item.value.toLowerCase()}-login`}
              className={`role-card${role === item.value ? ' role-card--active' : ''}`}
              aria-pressed={role === item.value}
              onClick={() => chooseRole(item.value)}
            >
              <span className="role-card__icon" aria-hidden="true">
                {item.icon}
              </span>
              <span className="role-card__title">{item.title}</span>
              <span className="role-card__description">{item.description}</span>
            </button>
          ))}
        </div>

        {selectedRole ? (
          <form className="form login-form" onSubmit={handleSubmit} noValidate>
            <div className="form-field">
              <label htmlFor="login-email">Email</label>
              <input
                id="login-email"
                name="email"
                type="email"
                value={form.email}
                onChange={handleChange}
                placeholder="you@omibits.com"
                autoComplete="username"
                required
                aria-invalid={Boolean(errors.email)}
                aria-describedby={errors.email ? 'login-email-error' : undefined}
              />
              {errors.email ? (
                <p className="field-error" id="login-email-error">
                  {errors.email}
                </p>
              ) : null}
            </div>

            <div className="form-field">
              <label htmlFor="login-password">Password</label>
              <input
                id="login-password"
                name="password"
                type="password"
                value={form.password}
                onChange={handleChange}
                placeholder="Your password"
                autoComplete="current-password"
                required
                aria-invalid={Boolean(errors.password)}
                aria-describedby={errors.password ? 'login-password-error' : undefined}
              />
              {errors.password ? (
                <p className="field-error" id="login-password-error">
                  {errors.password}
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
              disabled={submitting}
            >
              {submitting
                ? 'Signing in...'
                : `Sign in as ${role === 'ADMIN' ? 'Admin' : 'Employee'}`}
            </button>

            {role === 'ADMIN' ? (
              <p className="login-hint">
                Demo admin: <code>admin@omibits.com</code> / <code>admin123</code>
              </p>
            ) : (
              <p className="login-hint">
                Demo employee: <code>employee@omibits.com</code> /{' '}
                <code>employee123</code>. New employees can sign in with the
                password set by an administrator.
              </p>
            )}
          </form>
        ) : (
          <p className="login-hint">Select a login type to continue.</p>
        )}
      </div>
    </div>
  )
}
