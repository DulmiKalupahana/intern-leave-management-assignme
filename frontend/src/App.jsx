import { useCallback, useState } from 'react'
import { clearSession, readSession, writeSession } from './api/session'
import { ToastProvider } from './components/Toast'
import AdminDashboard from './pages/AdminDashboard'
import EmployeeDashboard from './pages/EmployeeDashboard'
import LoginPage from './pages/LoginPage'

export default function App() {
  const [session, setSession] = useState(() => readSession())

  const handleLogin = useCallback((nextSession) => {
    writeSession(nextSession)
    setSession(nextSession)
  }, [])

  const handleLogout = useCallback(() => {
    clearSession()
    setSession(null)
  }, [])

  return (
    <ToastProvider>
      {session ? (
        <div className="app-shell">
          <header className="app-header">
            <div className="brand">
              <span className="brand__mark" aria-hidden="true">
                O
              </span>
              <div>
                <h1>Omibits Leave Management</h1>
                <p>
                  {session.role === 'ADMIN'
                    ? 'Administrator workspace'
                    : 'Employee self-service'}
                </p>
              </div>
            </div>

            <div className="app-header__account">
              <div className="user-chip">
                <span className="user-chip__name">{session.name}</span>
                <span className="user-chip__meta">
                  {session.role === 'ADMIN'
                    ? 'Administrator'
                    : session.department || 'Employee'}
                </span>
              </div>
              <button type="button" className="btn btn--ghost" onClick={handleLogout}>
                Sign out
              </button>
            </div>
          </header>

          <main className="app-main">
            {session.role === 'ADMIN' ? (
              <AdminDashboard session={session} />
            ) : (
              <EmployeeDashboard session={session} />
            )}
          </main>
        </div>
      ) : (
        <LoginPage onLogin={handleLogin} />
      )}
    </ToastProvider>
  )
}
