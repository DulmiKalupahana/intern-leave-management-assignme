import { addLeave, approveLeave as approve, listLeaves, rejectLeave as reject } from './store'

export async function getLeaves() {
  return listLeaves()
}

export async function createLeave(data) {
  return addLeave(data)
}

export async function approveLeave(id) {
  return approve(id)
}

export async function rejectLeave(id, rejectionReason) {
  return reject(id, rejectionReason)
}
