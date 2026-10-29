import { useCallback, useEffect, useState } from 'react'
import { ApiError, getErrorMessage } from '../api/client'
import { approveLeave, getLeaves, rejectLeave } from '../api/leaves'
import { MAX_REASON_LENGTH, validateRejectionReason } from '../api/validation'
import EmptyState from '../components/EmptyState'
import Modal from '../components/Modal'
import Spinner from '../components/Spinner'
import StatusBadge from '../components/StatusBadge'
import { useToast } from '../components/ToastContext'

const STATUS_FILTERS = [
  { value: 'ALL', label: 'All' },
  { value: 'PENDING', label: 'Pending' },
  { value: 'APPROVED', label: 'Approved' },
  { value: 'REJECTED', label: 'Rejected' },
]

const LEAVE_TYPE_LABELS = {
  ANNUAL: 'Annual',
  CASUAL: 'Casual',
  MEDICAL: 'Medical',
}

async function fetchLeaveRequests() {
  const data = await getLeaves()
  return Array.isArray(data) ? data : []
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
  if (Number.isNaN(date.getTime())) {
    return value
  }

  return date.toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })
}

function formatLeaveType(value) {
  return LEAVE_TYPE_LABELS[value] ?? value ?? '—'
}

export default function LeaveRequestsPage() {
  const { notify } = useToast()
  const [leaves, setLeaves] = useState([])
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState('')
  const [statusFilter, setStatusFilter] = useState('ALL')
  const [busyId, setBusyId] = useState(null)
  const [rejectTarget, setRejectTarget] = useState(null)
  const [rejectionReason, setRejectionReason] = useState('')
  const [rejectError, setRejectError] = useState('')
  const [rejecting, setRejecting] = useState(false)

  const loadLeaves = useCallback(async () => {
    setLoading(true)
    setLoadError('')

    try {
      setLeaves(await fetchLeaveRequests())
    } catch (error) {
      setLoadError(
        getErrorMessage(error, 'Could not load leave requests. Please try again.'),
      )
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    let active = true

    fetchLeaveRequests()
      .then((data) => {
        if (active) {
          setLeaves(data)
        }
      })
      .catch((error) => {
        if (active) {
          setLoadError(
            getErrorMessage(
              error,
              'Could not load leave requests. Please try again.',
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

  const resetReject = useCallback(() => {
    setRejectTarget(null)
    setRejectionReason('')
    setRejectError('')
  }, [])

  const closeReject = useCallback(() => {
    if (!rejecting) {
      resetReject()
    }
  }, [rejecting, resetReject])

  async function handleApprove(leave) {
    if (busyId !== null) {
      return
    }

    setBusyId(leave.id)

    try {
      const updated = await approveLeave(leave.id)

      if (updated) {
        setLeaves((current) =>
          current.map((item) => (item.id === updated.id ? updated : item)),
        )
      }

      notify(`Leave request #${leave.id} approved.`, 'success')
    } catch (error) {
      if (error instanceof ApiError && error.status === 409) {
        notify(
          error.message || 'This leave request can no longer be approved.',
          'error',
        )
        await loadLeaves()
      } else {
        notify(
          getErrorMessage(error, 'Could not approve leave request. Please try again.'),
          'error',
        )
      }
    } finally {
      setBusyId(null)
    }
  }

  function openReject(leave) {
    if (busyId !== null) {
      return
    }

    setRejectTarget(leave)
    setRejectionReason('')
    setRejectError('')
  }

  function handleRejectReasonChange(event) {
    setRejectionReason(event.target.value)

    if (rejectError) {
      setRejectError('')
    }
  }

  async function handleReject(event) {
    event.preventDefault()

    if (!rejectTarget || rejecting) {
      return
    }

    const reason = rejectionReason.trim()
    const validationError = validateRejectionReason(reason)
    if (validationError) {
      setRejectError(validationError)
      return
    }

    const targetId = rejectTarget.id
    setRejecting(true)
    setRejectError('')

    try {
      const updated = await rejectLeave(targetId, reason)

      if (updated) {
        setLeaves((current) =>
          current.map((item) => (item.id === updated.id ? updated : item)),
        )
      }

      notify(`Leave request #${targetId} rejected.`, 'success')
      resetReject()
    } catch (error) {
      if (error instanceof ApiError && error.status === 400) {
        setRejectError(
          error.fieldErrors?.rejectionReason ||
            error.message ||
            'Rejection reason is invalid.',
        )
      } else if (error instanceof ApiError && error.status === 409) {
        notify(
          error.message || 'This leave request can no longer be rejected.',
          'error',
        )
        resetReject()
        await loadLeaves()
      } else {
        notify(
          getErrorMessage(error, 'Could not reject leave request. Please try again.'),
          'error',
        )
      }
    } finally {
      setRejecting(false)
    }
  }

  const pendingCount = leaves.filter((leave) => leave.status === 'PENDING').length
  const filteredLeaves =
    statusFilter === 'ALL'
      ? leaves
      : leaves.filter((leave) => leave.status === statusFilter)

  let content

  if (loading) {
    content = <Spinner label="Loading leave requests..." />
  } else if (loadError) {
    content = (
      <EmptyState
        title="Could not load leave requests"
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
        description="Requests submitted by employees will appear here for approval."
      />
    )
  } else if (filteredLeaves.length === 0) {
    content = (
      <EmptyState
        title={`No ${statusFilter.toLowerCase()} leave requests`}
        description="Try a different status filter."
      />
    )
  } else {
    content = (
      <div className="table-wrap">
        <table className="data-table data-table--requests">
          <thead>
            <tr>
              <th scope="col">ID</th>
              <th scope="col">Employee</th>
              <th scope="col">Department</th>
              <th scope="col">Type</th>
              <th scope="col">Start date</th>
              <th scope="col">End date</th>
              <th scope="col">Reason</th>
              <th scope="col">Status</th>
              <th scope="col">Rejection reason</th>
              <th scope="col">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredLeaves.map((leave) => (
              <tr key={leave.id}>
                <td className="cell--nowrap">#{leave.id}</td>
                <td className="cell--nowrap">{leave.employeeName}</td>
                <td className="cell--nowrap">{leave.employeeDepartment}</td>
                <td className="cell--nowrap">{formatLeaveType(leave.leaveType)}</td>
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
                <td>
                  {leave.status === 'PENDING' ? (
                    <div className="row-actions">
                      <button
                        type="button"
                        className="btn btn--sm btn--success"
                        onClick={() => handleApprove(leave)}
                        disabled={busyId !== null}
                      >
                        {busyId === leave.id ? 'Approving...' : 'Approve'}
                      </button>
                      <button
                        type="button"
                        className="btn btn--sm btn--danger"
                        onClick={() => openReject(leave)}
                        disabled={busyId !== null}
                      >
                        Reject
                      </button>
                    </div>
                  ) : (
                    <span className="muted" aria-hidden="true">
                      —
                    </span>
                  )}
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
            <h2 className="card__title">All leave requests</h2>
            <p className="card__subtitle">
              {leaves.length} {leaves.length === 1 ? 'request' : 'requests'} ·{' '}
              {pendingCount} pending
            </p>
          </div>

          <div className="toolbar">
            <label className="toolbar__label" htmlFor="status-filter">
              Status
            </label>
            <select
              id="status-filter"
              value={statusFilter}
              onChange={(event) => setStatusFilter(event.target.value)}
            >
              {STATUS_FILTERS.map((filter) => (
                <option key={filter.value} value={filter.value}>
                  {filter.label}
                </option>
              ))}
            </select>
            <button
              type="button"
              className="btn btn--ghost"
              onClick={loadLeaves}
              disabled={loading}
            >
              Refresh
            </button>
          </div>
        </div>

        {content}
      </section>

      {rejectTarget ? (
        <Modal
          title={`Reject leave request #${rejectTarget.id}`}
          onClose={closeReject}
        >
          <p className="modal__context">
            <strong>{rejectTarget.employeeName}</strong> ·{' '}
            {formatLeaveType(rejectTarget.leaveType)} ·{' '}
            {formatDate(rejectTarget.startDate)} to{' '}
            {formatDate(rejectTarget.endDate)}
          </p>

          <form onSubmit={handleReject} noValidate>
            <div className="form-field">
              <div className="label-row">
                <label htmlFor="rejection-reason">Rejection reason</label>
                <span className="field-hint">
                  {rejectionReason.length}/{MAX_REASON_LENGTH}
                </span>
              </div>
              <textarea
                id="rejection-reason"
                name="rejectionReason"
                value={rejectionReason}
                onChange={handleRejectReasonChange}
                maxLength={MAX_REASON_LENGTH}
                rows={4}
                placeholder="Explain why this request is being rejected"
                required
                aria-invalid={Boolean(rejectError)}
                aria-describedby={rejectError ? 'rejection-reason-error' : undefined}
              />
              {rejectError ? (
                <p className="field-error" id="rejection-reason-error">
                  {rejectError}
                </p>
              ) : null}
            </div>

            <div className="modal__actions">
              <button
                type="button"
                className="btn btn--ghost"
                onClick={closeReject}
                disabled={rejecting}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="btn btn--danger"
                disabled={rejecting}
              >
                {rejecting ? 'Rejecting...' : 'Confirm rejection'}
              </button>
            </div>
          </form>
        </Modal>
      ) : null}
    </>
  )
}
