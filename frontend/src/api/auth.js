import { apiRequest } from './client'

export function login({ email, password, role }) {
  return apiRequest('/api/auth/login', {
    method: 'POST',
    body: { email, password, role },
  })
}

export function getCurrentUser() {
  return apiRequest('/api/auth/me')
}

export function logout() {
  return apiRequest('/api/auth/logout', { method: 'POST' })
}
