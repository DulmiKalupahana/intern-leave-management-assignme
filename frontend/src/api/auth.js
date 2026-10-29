import { authenticate } from './store'

export async function login({ email, password, role }) {
  return authenticate({ email, password, role })
}

export async function logout() {
  return undefined
}
