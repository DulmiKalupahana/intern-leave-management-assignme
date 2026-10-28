import { useState } from 'react'
import EmployeesPage from './pages/EmployeesPage'
import LeaveRequestsPage from './pages/LeaveRequestsPage'
import SubmitLeavePage from './pages/SubmitLeavePage'
import { ToastProvider } from './components/Toast'

const TABS = [
  { id: 'employees', label: 'Employees' },
  { id: 'submit', label: 'Submit Leave' },
  { id: 'requests', label: 'Leave Requests' },
]

export default function App() {
  const [activeTab, setActiveTab] = useState('employees')

  return (
    <ToastProvider>
      <div className="app-shell">
        <header className="app-header">
          <div className="brand">
            <span className="brand__mark" aria-hidden="true">
              O
            </span>
            <div>
              <h1>Omibits Leave Management</h1>
              <p>Employee leave requests and approvals</p>
            </div>
          </div>

          <nav className="tabs" aria-label="Main sections">
            {TABS.map((tab) => (
              <button
                key={tab.id}
                type="button"
                className={`tab${activeTab === tab.id ? ' tab--active' : ''}`}
                aria-current={activeTab === tab.id ? 'page' : undefined}
                onClick={() => setActiveTab(tab.id)}
              >
                {tab.label}
              </button>
            ))}
          </nav>
        </header>

        <main className="app-main">
          {activeTab === 'employees' ? <EmployeesPage /> : null}
          {activeTab === 'submit' ? (
            <SubmitLeavePage onGoToEmployees={() => setActiveTab('employees')} />
          ) : null}
          {activeTab === 'requests' ? <LeaveRequestsPage /> : null}
        </main>
      </div>
    </ToastProvider>
  )
}
