# Omibits Leave Management

A frontend-only leave management demo for Omibits. An administrator can add employees and manage leave requests. Employees can select their profile, submit leave, and follow approval status.

> **Demo only — not secure authentication.** This version uses passwordless role selection: clicking **Admin Login** opens the admin dashboard, and clicking **Employee Login** lets anyone choose an employee from a dropdown. There are no passwords or server-side access checks. Do not use this for real employee data.

## Tech stack

- React 19
- Vite 8
- Plain CSS
- Browser `localStorage`

No backend or database is required. The `backend/` directory is retained only as the original reference implementation and test suite.

## Installation and run

Prerequisite: Node.js 20+.

```bash
cd frontend
npm install
npm run dev
```

Open the URL printed by Vite (normally **http://localhost:5173**).

Production build:

```bash
cd frontend
npm run build
npm run preview
```

## Using the demo

1. Click **Admin Login** to open the Admin Dashboard directly.
2. In **Employee Management**, click **Add Employee** and enter a name, email and department.
3. Sign out, click **Employee Login**, and choose the employee from the dropdown.
4. Click **New Leave Request**, choose Annual/Casual/Medical, dates and a reason, then submit.
5. Sign out and click **Admin Login** again. The request appears under **Administrator Functions** with employee name, department, leave type, dates, reason and status.
6. Approve or reject the pending request. Rejection requires a reason.
7. Sign in as the employee again to see the updated status and rejection reason.

## Features

- Direct admin access with no credentials.
- Employee access by selecting an existing saved employee.
- Add Employee form with name, email, department dropdown and immediate selection-list update.
- Employee leave request form with type, start date, end date and reason.
- Validation for required fields, dates in the past or before the start date, reason length and overlapping pending/approved leave.
- Admin list of every request, including employee name and department.
- Approve/reject pending requests with a required rejection reason.
- Updated statuses visible to employees.
- Data persistence across refreshes through `localStorage`.

## Persistence and reset

| Key | Contents |
|---|---|
| `omibits.employees` | Admin and employee records |
| `omibits.leaves` | Leave requests and statuses |
| `omibits.session` | Current demo session |

To reset the demo, clear those keys in DevTools → Application → Local Storage, or run:

```js
localStorage.removeItem('omibits.employees')
localStorage.removeItem('omibits.leaves')
localStorage.removeItem('omibits.session')
```

Demo data is re-seeded on the next load.

## Testing

Frontend checks:

```bash
cd frontend
npm run lint
npm run build
```

Manual verification: Admin button → Admin Dashboard; Employee button → select employee → submit leave → request appears in Admin Dashboard → approve/reject → employee sees the updated status.

Optional backend tests (not needed for the frontend demo):

```bash
cd backend
./mvnw test          # Windows: mvnw.cmd test
```

## Limitations

- Passwordless selection is for demonstration only and provides no security.
- Anyone can access admin functions from the login screen.
- Data is local to one browser profile and can be edited in DevTools.
- No real backend, password reset, audit trail, employee editing/deletion, leave cancellation or leave balances.
- The retained Spring Boot backend is not connected to this frontend demo.
