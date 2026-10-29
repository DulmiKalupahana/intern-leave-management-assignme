export class ApiError extends Error {
  constructor(status, message, fieldErrors = {}) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.fieldErrors = fieldErrors ?? {}
  }
}

export function getErrorMessage(error, fallback) {
  if (error instanceof ApiError) {
    return error.message
  }

  return fallback
}
