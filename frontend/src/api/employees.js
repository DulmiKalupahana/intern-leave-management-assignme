import { addEmployee, listEmployees } from './store'

export async function getEmployees() {
  return listEmployees()
}

export async function createEmployee(data) {
  return addEmployee(data)
}
