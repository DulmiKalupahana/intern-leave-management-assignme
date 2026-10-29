# Omibits Leave Management

A frontend-only leave management demo for Omibits. Employees can sign in, submit leave requests and follow their approval status. Administrators can add employee accounts, review all requests, and approve or reject pending requests with a reason.

> **Demo only:** authentication and all data live in the browser's `localStorage`. Passwords are stored in plain text and access checks run only in the frontend. This is **not secure production authentication** — do not use it for real employee data.

## Demo credentials

| Role | Email | Password |
|---|---|---|
| Administrator | `admin@omibits.com` | `admin123` |
| Employee | `employee@omibits.com` | `employee123` |

Choose **Admin Login** or **Employee Login** on the sign-in screen, then use the matching credentials. A department of `Administration` is used for the demo admin.

## Tech stack

- React 19
- Vite 8
- Plain CSS
- Browser `localStorage` (no backend, database or API required for the demo)

The `backend/` directory is the original Spring Boot implementation kept for reference and its test suite. It is **not required** to run or evaluate the frontend demo.

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

## Implemented features

### Employee

- Employee login with role separation from admin access.
- Dashboard summary of pending, approved and rejected requests.
- **Leave Requests** table showing type, dates, reason, status and any rejection reason.
- **New Leave Request** modal with leave type (Annual, Casual, Medical), start date, end date and reason.
- Validation for required fields, invalid date ranges, reason length and overlapping pending/approved leave.
- Submitted requests start as `PENDING`.

### Administrator

- **Employee Management** tab with an employee directory.
- **Add Employee** modal with name, email, department dropdown and login password.
- Newly created employees can immediately sign in through Employee Login.
- **Administrator Functions** tab listing every leave request.
- Approve or reject pending requests; rejection requires a written reason.
- Status filters and updated status/rejection reason visible to employees.
- Decided requests cannot be changed again.

### Persistence

All demo data is stored in `localStorage`:

| Key | Contents |
|---|---|
| `omibits.employees` | Demo admin, demo employee and employees added by an admin, including login passwords |
| `omibits.leaves` | All leave requests and their statuses |
| `omibits.session` | Current signed-in session |

Data survives page refreshes. To reset the demo, clear those keys in the browser developer tools (Application → Local Storage) or run:

```js
localStorage.removeItem('omibits.employees')
localStorage.removeItem('omibits.leaves')
localStorage.removeItem('omibits.session')
```

The demo accounts are re-seeded automatically on the next load.

## Testing and verification

Frontend checks:

```bash
cd frontend
npm run lint
npm run build
```

Manual flow:

1. Sign in as the demo admin.
2. Add an employee with a department and password.
3. Sign out and sign in as that employee.
4. Submit a leave request.
5. Sign out, sign in as admin, approve or reject the request (rejection requires a reason).
6. Sign in again as the employee and confirm the updated status and rejection reason.

Optional backend tests (not needed for the frontend demo):

```bash
cd backend
./mvnw test          # Windows: mvnw.cmd test
```

Last verified locally: `npm run lint` and `npm run build` pass; the retained backend suite passes with **54 tests, 0 failures**.

## Limitations

- Frontend-only demo; passwords are stored in plain text in `localStorage`.
- Role checks and "sessions" can be modified through browser developer tools.
- Data is local to one browser profile and is lost when site data is cleared.
- No real backend, database, email delivery, password reset, audit trail or multi-device sync.
- No employee editing/deletion or leave cancellation.
- No leave balance/allowance tracking.

## Project structure

```
frontend/          React + Vite frontend (the runnable demo)
backend/           Original Spring Boot API and tests, kept for reference
docs/screenshots/  Screenshots referenced by earlier documentation
```

## Screenshots

See [`docs/screenshots/`](docs/screenshots) for login, employee dashboard, leave form, employee management and approval views.
