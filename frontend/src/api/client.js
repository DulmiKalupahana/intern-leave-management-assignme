import { clearSession, getSessionToken } from './session'

const configuredBaseUrl = import.meta.env.VITE_API_BASE_URL

const DEFAULT_API_BASE_URL = 'http://localhost:8080'

export const API_BASE_URL = (configuredBaseUrl || DEFAULT_API_BASE_URL).replace(/\/+$/, '')

const NETWORK_ERROR_MESSAGE =
  'Cannot reach server. Please check that the backend is running and try again.'

export const SESSION_EXPIRED_EVENT = 'omibits:session-expired'

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
  const token = getSessionToken()

  let response
  try {
    response = await fetch(`${API_BASE_URL}${path}`, {
      method,
      headers: {
        Accept: 'application/json',
        ...(body !== undefined ? { 'Content-Type': 'application/json' } : {}),
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: body !== undefined ? JSON.stringify(body) : undefined,
    })
  } catch {
    throw new ApiError(0, NETWORK_ERROR_MESSAGE)
  }

  const payload = await readJsonBody(response)

  if (!response.ok) {
    if (response.status === 401 && token) {
      clearSession()
      window.dispatchEvent(new Event(SESSION_EXPIRED_EVENT))
    }

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
