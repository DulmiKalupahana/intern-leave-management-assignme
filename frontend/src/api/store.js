import { ApiError } from './client'
import { readSession } from './session'

/*
 * Frontend-only demo data store.
 *
 * Everything lives in localStorage so the assignment can be evaluated without
 * a backend or database. This is intentionally NOT production authentication:
 * passwords are stored in plain text and every check runs in the browser.
 */

const EMPLOYEES_KEY = 'omibits.employees'
const LEAVES_KEY = 'omibits.leaves'

export const DEPARTMENTS = [
  'Administration',
  'Customer Support',
  'Engineering',
  'Finance',
  'Human Resources',
  'Marketing',
  'Operations',
  'Sales',
]

const LEAVE_TYPES = ['ANNUAL', 'CASUAL', 'MEDICAL']
const MAX_REASON_LENGTH = 500

export const DEMO_ACCOUNTS = [
  {
    id: 1,
    name: 'Omibits Admin',
    email: 'admin@omibits.com',
    department: 'Administration',
    password: 'admin123',
    role: 'ADMIN',
    createdAt: '2026-01-01T09:00:00.000Z',
  },
  {
    id: 2,
    name: 'Demo Employee',
    email: 'employee@omibits.com',
    department: 'Engineering',
    password: 'employee123',
    role: 'EMPLOYEE',
    createdAt: '2026-01-01T09:00:00.000Z',
  },
]

function readArray(key) {
  try {
    const raw = window.localStorage.getItem(key)
    if (!raw) {
      return []
    }

    const parsed = JSON.parse(raw)
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

function writeArray(key, value) {
  window.localStorage.setItem(key, JSON.stringify(value))
}

function ensureSeeded() {
  if (readArray(EMPLOYEES_KEY).length === 0) {
    writeArray(
      EMPLOYEES_KEY,
      DEMO_ACCOUNTS.map((account) => ({ ...account })),
    )
  }

  if (!window.localStorage.getItem(LEAVES_KEY)) {
    writeArray(LEAVES_KEY, [])
  }
}

function readEmployees() {
  ensureSeeded()
  return readArray(EMPLOYEES_KEY)
}

function writeEmployees(employees) {
  writeArray(EMPLOYEES_KEY, employees)
}

function readLeaves() {
  ensureSeeded()
  return readArray(LEAVES_KEY)
}

function writeLeaves(leaves) {
  writeArray(LEAVES_KEY, leaves)
}

function nextId(rows) {
  return rows.reduce((max, row) => Math.max(max, Number(row.id) || 0), 0) + 1
}

function normalizeEmail(email) {
  return String(email ?? '').trim().toLowerCase()
}

function requireSession() {
  const session = readSession()

  if (!session) {
    throw new ApiError(401, 'Please sign in to continue.')
  }

  return session
}

function requireAdmin() {
  const session = requireSession()

  if (session.role !== 'ADMIN') {
    throw new ApiError(403, 'Only an administrator can perform this action.')
  }

  return session
}

function toPublicEmployee(employee) {
  return {
    id: employee.id,
    name: employee.name,
    email: employee.email,
    department: employee.department,
    createdAt: employee.createdAt,
  }
}

function toLeaveResponse(leave, employees) {
  const employee = employees.find((item) => item.id === leave.employeeId)

  return {
    ...leave,
    employeeName: employee ? employee.name : 'Unknown employee',
  }
}

export function authenticate({ email, password, role }) {
  const normalizedEmail = normalizeEmail(email)
  const employees = readEmployees()
  const account = employees.find((item) => item.email === normalizedEmail)

  if (!account || account.password !== password) {
    throw new ApiError(401, 'Invalid email or password.')
  }

  if (account.role !== role) {
    throw new ApiError(
      403,
      `This is an ${account.role === 'ADMIN' ? 'administrator' : 'employee'} account. Use the matching login button.`,
    )
  }

  return {
    token: `demo-${account.id}-${Date.now()}`,
    employeeId: account.id,
    name: account.name,
    email: account.email,
    department: account.department,
    role: account.role,
  }
}

export function getCurrentUser() {
  const session = requireSession()
  const account = readEmployees().find((item) => item.id === session.employeeId)

  if (!account) {
    throw new ApiError(401, 'Please sign in again.')
  }

  return toPublicEmployee(account)
}

export function listEmployees() {
  requireAdmin()
  return readEmployees()
    .filter((employee) => employee.role !== 'ADMIN')
    .map(toPublicEmployee)
}

export function addEmployee({ name, email, department, password }) {
  requireAdmin()

  const employees = readEmployees()
  const normalizedEmail = normalizeEmail(email)

  if (employees.some((item) => item.email === normalizedEmail)) {
    throw new ApiError(409, 'An account with this email already exists.', {
      email: 'Email already exists',
    })
  }

  const employee = {
    id: nextId(employees),
    name: String(name).trim(),
    email: normalizedEmail,
    department,
    password,
    role: 'EMPLOYEE',
    createdAt: new Date().toISOString(),
  }

  writeEmployees([...employees, employee])
  return toPublicEmployee(employee)
}

export function listLeaves() {
  const session = requireSession()
  const employees = readEmployees()
  const leaves = readLeaves()
  const visible =
    session.role === 'ADMIN'
      ? leaves
      : leaves.filter((leave) => leave.employeeId === session.employeeId)

  return visible
    .slice()
    .sort((a, b) => String(b.createdAt).localeCompare(String(a.createdAt)))
    .map((leave) => toLeaveResponse(leave, employees))
}

export function addLeave({ leaveType, startDate, endDate, reason }) {
  const session = requireSession()

  if (session.role !== 'EMPLOYEE') {
    throw new ApiError(403, 'Only employees can submit leave requests.')
  }

  if (!LEAVE_TYPES.includes(leaveType)) {
    throw new ApiError(400, 'Choose a valid leave type.', {
      leaveType: 'Choose Annual, Casual or Medical',
    })
  }

  if (!startDate) {
    throw new ApiError(400, 'Start date is required.', {
      startDate: 'Start date is required',
    })
  }

  if (!endDate) {
    throw new ApiError(400, 'End date is required.', {
      endDate: 'End date is required',
    })
  }

  if (endDate < startDate) {
    throw new ApiError(400, 'End date cannot be before the start date.', {
      endDate: 'End date cannot be before start date',
    })
  }

  const trimmedReason = String(reason ?? '').trim()

  if (!trimmedReason) {
    throw new ApiError(400, 'Reason is required.', {
      reason: 'Reason is required',
    })
  }

  if (trimmedReason.length > MAX_REASON_LENGTH) {
    throw new ApiError(400, 'Reason is too long.', {
      reason: `Reason must not exceed ${MAX_REASON_LENGTH} characters`,
    })
  }

  const leaves = readLeaves()
  const overlaps = leaves.some(
    (leave) =>
      leave.employeeId === session.employeeId &&
      (leave.status === 'PENDING' || leave.status === 'APPROVED') &&
      leave.startDate <= endDate &&
      leave.endDate >= startDate,
  )

  if (overlaps) {
    throw new ApiError(
      409,
      'This request overlaps an existing pending or approved leave request.',
    )
  }

  const now = new Date().toISOString()
  const leave = {
    id: nextId(leaves),
    employeeId: session.employeeId,
    leaveType,
    startDate,
    endDate,
    reason: trimmedReason,
    status: 'PENDING',
    rejectionReason: null,
    createdAt: now,
    updatedAt: now,
  }

  writeLeaves([...leaves, leave])
  return toLeaveResponse(leave, readEmployees())
}

function decideLeave(id, status, rejectionReason = null) {
  requireAdmin()

  const leaves = readLeaves()
  const index = leaves.findIndex((leave) => leave.id === Number(id))

  if (index === -1) {
    throw new ApiError(404, 'Leave request not found.')
  }

  if (leaves[index].status !== 'PENDING') {
    throw new ApiError(409, 'Only pending leave requests can be updated.')
  }

  const updated = {
    ...leaves[index],
    status,
    rejectionReason,
    updatedAt: new Date().toISOString(),
  }

  leaves[index] = updated
  writeLeaves(leaves)
  return toLeaveResponse(updated, readEmployees())
}

export function approveLeave(id) {
  return decideLeave(id, 'APPROVED')
}

export function rejectLeave(id, rejectionReason) {
  const reason = String(rejectionReason ?? '').trim()

  if (!reason) {
    throw new ApiError(400, 'A rejection reason is required.', {
      rejectionReason: 'Rejection reason is required',
    })
  }

  if (reason.length > MAX_REASON_LENGTH) {
    throw new ApiError(400, 'Rejection reason is too long.', {
      rejectionReason: `Rejection reason must not exceed ${MAX_REASON_LENGTH} characters`,
    })
  }

  return decideLeave(id, 'REJECTED', reason)
}
