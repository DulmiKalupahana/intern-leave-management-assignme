import { useState } from 'react'
import EmployeesPage from './EmployeesPage'
import LeaveRequestsPage from './LeaveRequestsPage'

const TABS = [
  { id: 'employees', label: 'Employee Management' },
  { id: 'functions', label: 'Administrator Functions' },
]

export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState('employees')

  return (
    <>
      <nav className="tabs tabs--section" aria-label="Administrator sections">
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

      {activeTab === 'employees' ? <EmployeesPage /> : <LeaveRequestsPage />}
    </>
  )
}
