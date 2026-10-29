const configuredBaseUrl = import.meta.env.VITE_API_BASE_URL

const DEFAULT_API_BASE_URL = 'http://localhost:8080'

export const API_BASE_URL = (configuredBaseUrl || DEFAULT_API_BASE_URL).replace(/\/+$/, '')

const NETWORK_ERROR_MESSAGE =
  'Cannot reach server. Please check that the backend is running and try again.'

export class ApiError extends Error {
  constructor(status, message, fieldErrors = {}) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.fieldErrors = fieldErrors ?? {}
  }
}

async function readJsonBody(response) {
  const text = await response.text()
  if (!text) {
    return null
  }

  try {
    return JSON.parse(text)
  } catch {
    return null
  }
}

export async function apiRequest(path, { method = 'GET', body } = {}) {
  let response
  try {
    response = await fetch(`${API_BASE_URL}${path}`, {
      method,
      headers: {
        Accept: 'application/json',
        ...(body !== undefined ? { 'Content-Type': 'application/json' } : {}),
      },
      body: body !== undefined ? JSON.stringify(body) : undefined,
    })
  } catch {
    throw new ApiError(0, NETWORK_ERROR_MESSAGE)
  }

  const payload = await readJsonBody(response)

  if (!response.ok) {
    const message =
      payload && typeof payload.message === 'string' && payload.message
        ? payload.message
        : `Request failed with status ${response.status}`
    const fieldErrors =
      payload && payload.fieldErrors && typeof payload.fieldErrors === 'object'
        ? payload.fieldErrors
        : {}

    throw new ApiError(response.status, message, fieldErrors)
  }

  return payload
}

export function getErrorMessage(error, fallback) {
  if (error instanceof ApiError) {
    return error.message
  }

  return fallback
}
