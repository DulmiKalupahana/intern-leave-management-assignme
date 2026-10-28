import { apiRequest } from './client'

export function getLeaves() {
  return apiRequest('/api/leaves')
}

export function createLeave(data) {
  return apiRequest('/api/leaves', {
    method: 'POST',
    body: data,
  })
}

export function approveLeave(id) {
  return apiRequest(`/api/leaves/${id}/approve`, {
    method: 'PATCH',
  })
}

export function rejectLeave(id, rejectionReason) {
  return apiRequest(`/api/leaves/${id}/reject`, {
    method: 'PATCH',
    body: { rejectionReason },
  })
}
