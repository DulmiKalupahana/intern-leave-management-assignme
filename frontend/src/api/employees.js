import { addEmployee, listEmployees, listSelectableEmployees } from './store'

export async function getEmployees() {
  return listEmployees()
}

export async function getSelectableEmployees() {
  return listSelectableEmployees()
}

export async function createEmployee(data) {
  return addEmployee(data)
}
