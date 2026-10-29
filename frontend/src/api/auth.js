import { loginAsAdmin, loginAsEmployee } from './store'

export async function loginAsAdminSession() {
  return loginAsAdmin()
}

export async function loginAsEmployeeSession(employeeId) {
  return loginAsEmployee(employeeId)
}

export async function logout() {
  return undefined
}
