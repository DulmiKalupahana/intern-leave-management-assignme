import { useCallback, useEffect, useState } from 'react'
import { getErrorMessage } from '../api/client'
import { getLeaves } from '../api/leaves'
import EmptyState from '../components/EmptyState'
import Modal from '../components/Modal'
import Spinner from '../components/Spinner'
import StatusBadge from '../components/StatusBadge'
import { useToast } from '../components/ToastContext'
import SubmitLeavePage from './SubmitLeavePage'

const LEAVE_TYPE_LABELS = {
  ANNUAL: 'Annual',
  CASUAL: 'Casual',
  MEDICAL: 'Medical',
}

function formatDate(value) {
  if (!value) {
    return '—'
  }

  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    const [year, month, day] = value.split('-').map(Number)
    return new Date(year, month - 1, day).toLocaleDateString(undefined, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    })
  }

  const date = new Date(value)
  return Number.isNaN(date.getTime())
    ? value
    : date.toLocaleDateString(undefined, {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      })
}

export default function EmployeeDashboard({ session }) {
  const { notify } = useToast()
  const [leaves, setLeaves] = useState([])
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState('')
  const [formOpen, setFormOpen] = useState(false)

  const loadLeaves = useCallback(async () => {
    setLoading(true)
    setLoadError('')

    try {
      const data = await getLeaves()
      setLeaves(Array.isArray(data) ? data : [])
    } catch (error) {
      setLoadError(
        getErrorMessage(error, 'Could not load your leave requests. Please try again.'),
      )
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    let active = true

    getLeaves()
      .then((data) => {
        if (active) {
          setLeaves(Array.isArray(data) ? data : [])
        }
      })
      .catch((error) => {
        if (active) {
          setLoadError(
            getErrorMessage(
              error,
              'Could not load your leave requests. Please try again.',
            ),
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

  useEffect(() => {
    function refresh() {
      loadLeaves()
    }

    window.addEventListener('storage', refresh)
    window.addEventListener('focus', refresh)

    return () => {
      window.removeEventListener('storage', refresh)
      window.removeEventListener('focus', refresh)
    }
  }, [loadLeaves])

  function handleCreated(created) {
    setFormOpen(false)
    notify(
      `Leave request #${created.id} submitted (status: Pending).`,
      'success',
    )
    loadLeaves()
  }

  const pending = leaves.filter((leave) => leave.status === 'PENDING').length
  const approved = leaves.filter((leave) => leave.status === 'APPROVED').length
  const rejected = leaves.filter((leave) => leave.status === 'REJECTED').length

  let content

  if (loading) {
    content = <Spinner label="Loading your leave requests..." />
  } else if (loadError) {
    content = (
      <EmptyState
        title="Could not load your leave requests"
        description={loadError}
        action={
          <button type="button" className="btn btn--primary" onClick={loadLeaves}>
            Retry
          </button>
        }
      />
    )
  } else if (leaves.length === 0) {
    content = (
      <EmptyState
        title="No leave requests yet"
        description="Create your first request and it will appear here with its approval status."
        action={
          <button
            type="button"
            className="btn btn--primary"
            onClick={() => setFormOpen(true)}
          >
            New Leave Request
          </button>
        }
      />
    )
  } else {
    content = (
      <div className="table-wrap">
        <table className="data-table data-table--my-leaves">
          <thead>
            <tr>
              <th scope="col">ID</th>
              <th scope="col">Type</th>
              <th scope="col">Start date</th>
              <th scope="col">End date</th>
              <th scope="col">Reason</th>
              <th scope="col">Status</th>
              <th scope="col">Admin note</th>
            </tr>
          </thead>
          <tbody>
            {leaves.map((leave) => (
              <tr key={leave.id}>
                <td className="cell--nowrap">#{leave.id}</td>
                <td className="cell--nowrap">
                  {LEAVE_TYPE_LABELS[leave.leaveType] ?? leave.leaveType}
                </td>
                <td className="cell--nowrap">{formatDate(leave.startDate)}</td>
                <td className="cell--nowrap">{formatDate(leave.endDate)}</td>
                <td className="cell--reason">{leave.reason}</td>
                <td>
                  <StatusBadge status={leave.status} />
                </td>
                <td className="cell--rejection">
                  {leave.status === 'REJECTED' && leave.rejectionReason
                    ? leave.rejectionReason
                    : '—'}
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
      <section className="summary-grid" aria-label="Leave summary">
        <div className="summary-card">
          <span className="summary-card__label">Pending</span>
          <span className="summary-card__value">{pending}</span>
        </div>
        <div className="summary-card summary-card--success">
          <span className="summary-card__label">Approved</span>
          <span className="summary-card__value">{approved}</span>
        </div>
        <div className="summary-card summary-card--danger">
          <span className="summary-card__label">Rejected</span>
          <span className="summary-card__value">{rejected}</span>
        </div>
      </section>

      <section className="card">
        <div className="card__header">
          <div>
            <h2 className="card__title">My leave requests</h2>
            <p className="card__subtitle">
              {session.name} · {leaves.length}{' '}
              {leaves.length === 1 ? 'request' : 'requests'}
            </p>
          </div>

          <div className="toolbar">
            <button
              type="button"
              className="btn btn--ghost"
              onClick={loadLeaves}
              disabled={loading}
            >
              Refresh
            </button>
            <button
              type="button"
              className="btn btn--primary"
              onClick={() => setFormOpen(true)}
            >
              New Leave Request
            </button>
          </div>
        </div>

        {content}
      </section>

      {formOpen ? (
        <Modal title="New leave request" onClose={() => setFormOpen(false)}>
          <SubmitLeavePage
            onCreated={handleCreated}
            onCancel={() => setFormOpen(false)}
          />
        </Modal>
      ) : null}
    </>
  )
}
