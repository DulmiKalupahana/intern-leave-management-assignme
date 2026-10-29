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

export const LEAVE_TYPE_OPTIONS = [
  { value: 'ANNUAL', label: 'Annual' },
  { value: 'CASUAL', label: 'Casual' },
  { value: 'MEDICAL', label: 'Medical' },
]
export const LEAVE_TYPES = LEAVE_TYPE_OPTIONS.map((type) => type.value)
export const MAX_REASON_LENGTH = 500
export const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

function isValidDate(value) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return false
  }

  const date = new Date(`${value}T00:00:00Z`)
  return !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === value
}

export function validateEmployeeForm(employee, employees = []) {
  const errors = {}
  const name = String(employee.name ?? '').trim()
  const email = String(employee.email ?? '').trim()
  const department = String(employee.department ?? '').trim()

  if (!name) {
    errors.name = 'Name is required'
  }

  if (!email) {
    errors.email = 'Email is required'
  } else if (!EMAIL_PATTERN.test(email)) {
    errors.email = 'Enter a valid email address'
  } else if (
    employees.some(
      (item) => String(item.email ?? '').trim().toLowerCase() === email.toLowerCase(),
    )
  ) {
    errors.email = 'An employee with this email already exists'
  }

  if (!department) {
    errors.department = 'Department is required'
  } else if (!DEPARTMENTS.includes(department)) {
    errors.department = 'Choose a valid department'
  }

  return errors
}

export function validateLeaveForm(leave) {
  const errors = {}

  if (!leave.leaveType) {
    errors.leaveType = 'Leave type is required'
  } else if (!LEAVE_TYPES.includes(leave.leaveType)) {
    errors.leaveType = 'Choose a valid leave type'
  }

  const hasStartDate = Boolean(leave.startDate)
  const hasEndDate = Boolean(leave.endDate)

  if (!hasStartDate) {
    errors.startDate = 'Start date is required'
  } else if (!isValidDate(leave.startDate)) {
    errors.startDate = 'Enter a valid start date'
  }

  if (!hasEndDate) {
    errors.endDate = 'End date is required'
  } else if (!isValidDate(leave.endDate)) {
    errors.endDate = 'Enter a valid end date'
  }

  if (
    hasStartDate &&
    hasEndDate &&
    isValidDate(leave.startDate) &&
    isValidDate(leave.endDate) &&
    leave.endDate < leave.startDate
  ) {
    errors.endDate = 'End date cannot be before start date'
  }

  const reason = String(leave.reason ?? '').trim()
  if (!reason) {
    errors.reason = 'Reason is required'
  } else if (reason.length > MAX_REASON_LENGTH) {
    errors.reason = `Reason must not exceed ${MAX_REASON_LENGTH} characters`
  }

  return errors
}

export function validateRejectionReason(value) {
  const reason = String(value ?? '').trim()

  if (!reason) {
    return 'Rejection reason is required'
  }

  if (reason.length > MAX_REASON_LENGTH) {
    return `Rejection reason must not exceed ${MAX_REASON_LENGTH} characters`
  }

  return ''
}
