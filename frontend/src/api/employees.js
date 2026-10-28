import { apiRequest } from './client'

export function getEmployees() {
  return apiRequest('/api/employees')
}

export function createEmployee(data) {
  return apiRequest('/api/employees', {
    method: 'POST',
    body: data,
  })
}
