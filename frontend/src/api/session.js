const STORAGE_KEY = 'omibits.session'

export function readSession() {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    if (!raw) {
      return null
    }

    const parsed = JSON.parse(raw)
    if (!parsed || !parsed.token || !parsed.role || !parsed.employeeId) {
      return null
    }

    return parsed
  } catch {
    return null
  }
}

export function writeSession(session) {
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(session))
}

export function clearSession() {
  window.localStorage.removeItem(STORAGE_KEY)
}

export function getSessionToken() {
  const session = readSession()
  return session ? session.token : null
}
