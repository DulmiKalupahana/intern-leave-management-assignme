# Omibits — Employee Leave Management System

A small full-stack application for managing employees and their leave requests. Employees are registered once, leave requests are submitted against them, and an administrator approves or rejects those requests.

> ## ⚠️ Security notice
> **Authentication is not implemented. The admin endpoints are NOT secure.**
> `PATCH /api/leaves/{id}/approve` and `PATCH /api/leaves/{id}/reject` can be called by anyone who can reach the API. There are no users, roles, sessions or tokens. This is a scoped exercise, **not** a production-ready system. See [Limitations](#12-limitations).

---

## 1. Overview

The system covers three flows:

1. **Employees** — register an employee with a name, a unique email and a department, then browse the directory.
2. **Submit leave** — pick an employee, a leave type (`ANNUAL`, `CASUAL`, `MEDICAL`), a start date, an end date and a reason. The request is stored as `PENDING`.
3. **Admin review** — list every request, approve or reject the pending ones. Rejection requires a written reason. Decided requests cannot be changed again.

Business rules are enforced by the backend, not by the UI:

| Rule | Result |
|---|---|
| Duplicate employee email | `409 Conflict` |
| `endDate` before `startDate` | `400 Bad Request` |
| Unknown employee id | `404 Not Found` |
| Unknown leave type | `400 Bad Request` |
| Overlapping pending/approved leave for the same employee | `409 Conflict` |
| Approve/reject a request that is not `PENDING` | `409 Conflict` |
| Reject with a blank reason | `400 Bad Request` |

---

## 2. Tech stack and why

| Layer | Choice | Why |
|---|---|---|
| Backend | Java 21 + Spring Boot 4.1 | Batteries-included REST stack; Bean Validation, JPA and a consistent exception layer come for free. |
| Persistence | Spring Data JPA / Hibernate 7 + MySQL 8 | Relational data with a real foreign key between employees and leave requests; MySQL is what the assignment targets. |
| Schema | `schema.sql` + `ddl-auto=validate` | The SQL file is the single readable source of truth; Hibernate only verifies that the entities match it, so the two can never silently drift. |
| Validation | Jakarta Bean Validation + service-layer checks | DTO annotations catch malformed input; the service layer enforces the rules that need database access (existence, overlap, status). |
| Tests | JUnit 5, Mockito, MockMvc, H2 | Fast unit tests for the service layer plus HTTP-level integration tests against an in-memory database. |
| Frontend | React 19 + Vite 8 | Minimal, fast dev server; no state-management library is needed for three screens. |
| Styling | Plain CSS | Keeps the diff small and avoids a UI framework the reviewer has to learn. |

---

## 3. Prerequisites

| Tool | Version used | Notes |
|---|---|---|
| JDK | 21+ (tested with 21 and 25) | `java -version` |
| Maven | 3.9+ | Not required — the repo ships `backend/mvnw` / `backend/mvnw.cmd`. |
| Node.js | 20+ | `node -v`, `npm -v` |
| MySQL | 8.0+ | Must be running on `localhost:3306`. |
| Git | any recent | |

---

## 4. Database setup

The application connects to MySQL with credentials supplied by environment variables.

| Variable | Default | Required |
|---|---|---|
| `DB_USERNAME` | `root` | no |
| `DB_PASSWORD` | *(none)* | **yes** |
| `DB_URL` | `jdbc:mysql://localhost:3306/leave_management?createDatabaseIfNotExist=true` | no |

### 4.1 Create the database

You do **not** have to create it manually — `createDatabaseIfNotExist=true` in the default URL creates `leave_management` on the first connection, provided the MySQL user is allowed to create schemas. To create it yourself:

```sql
CREATE DATABASE leave_management CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

### 4.2 Create the tables

`backend/src/main/resources/schema.sql` contains the full schema (`employees`, `leave_requests`, unique email, foreign key, check constraints). It is applied automatically on every application start (`spring.sql.init.mode=always`); every statement uses `CREATE TABLE IF NOT EXISTS`, so restarts are safe. Hibernate runs in `validate` mode and refuses to start if the entities and the SQL file disagree.

The same file can be applied by hand:

```bash
mysql -u root -p leave_management < backend/src/main/resources/schema.sql
```

### 4.3 Provide the credentials

**Option A — environment variables (recommended):**

```powershell
# PowerShell
$env:DB_PASSWORD = "your-mysql-password"
```

```bash
# bash / zsh
export DB_PASSWORD="your-mysql-password"
```

**Option B — a local `.env` file:** copy `.env.example` to `.env` (repo root or `backend/`) and fill in the values. Both locations are read via `spring.config.import`; `.env` is git-ignored. Real credentials must never be committed.

---

## 5. Run the backend

```bash
cd backend
./mvnw spring-boot:run         # Windows: mvnw.cmd spring-boot:run
```

The API is served on **http://localhost:8080**. A successful start ends with:

```
Tomcat started on port 8080 (http)
Started LeaveManagementApplication in 6.2 seconds
```

Quick check:

```bash
curl http://localhost:8080/api/employees
# 200 []
```

If Hibernate reports a schema validation error, the database still contains an older version of the tables — drop and recreate `leave_management`, or apply `schema.sql` manually (section 4.2).

---

## 6. Run the frontend

```bash
cd frontend
npm install
npm run dev
```

Open **http://localhost:5173**. The backend must be running on port 8080.

`VITE_API_BASE_URL` is optional: when it is not set the client falls back to `http://localhost:8080` (`frontend/src/api/client.js`). To point at another host, copy `frontend/.env.example` to `frontend/.env` and change the value.

---

## 7. Run the tests

```bash
cd backend
./mvnw test                    # Windows: mvnw.cmd test
```

**40 tests, 0 failures, 0 errors, 0 skipped.**

| Suite | Tests | Kind |
|---|---|---|
| `LeaveRequestServiceTest` | 16 | Unit — Mockito |
| `EmployeeServiceTest` | 3 | Unit — Mockito |
| `LeaveRequestControllerTest` | 7 | Integration — `@SpringBootTest` + MockMvc + H2 |
| `AdminApprovalControllerTest` | 7 | Integration — approval/rejection HTTP contract |
| `EmployeeControllerTest` | 5 | Integration — employee HTTP contract |
| `DataIntegrityViolationHandlerTest` | 1 | Handler — unique-constraint race → 409 |
| `LeaveManagementApplicationTests` | 1 | Context load |

Integration tests run against an in-memory H2 database (`backend/src/test/resources/application-test.properties`); no MySQL instance is needed to run the suite. The frontend has no automated tests; `npm run lint` and `npm run build` are the checks.

---

## 8. API documentation

Base URL: `http://localhost:8080`

| Method | Path | Purpose | Success |
|---|---|---|---|
| `POST` | `/api/employees` | Create an employee | `201 Created` |
| `GET` | `/api/employees` | List all employees | `200 OK` |
| `POST` | `/api/leaves` | Submit a leave request | `201 Created` |
| `GET` | `/api/leaves` | List all leave requests (newest first) | `200 OK` |
| `PATCH` | `/api/leaves/{id}/approve` | Approve a `PENDING` request | `200 OK` |
| `PATCH` | `/api/leaves/{id}/reject` | Reject a `PENDING` request with a reason | `200 OK` |

### Create employee

```http
POST /api/employees
Content-Type: application/json

{ "name": "Jane Doe", "email": "jane.doe@omibits.com", "department": "Engineering" }
```

```json
201 Created
{
  "id": 1,
  "name": "Jane Doe",
  "email": "jane.doe@omibits.com",
  "department": "Engineering",
  "createdAt": "2026-10-28T10:12:31.442"
}
```

Email is trimmed and lowercased before it is stored, so duplicates are detected case-insensitively.

### List employees

```http
GET /api/employees
```

```json
200 OK
[
  { "id": 1, "name": "Jane Doe", "email": "jane.doe@omibits.com", "department": "Engineering", "createdAt": "2026-10-28T10:12:31.442" }
]
```

### Submit a leave request

```http
POST /api/leaves
Content-Type: application/json

{
  "employeeId": 1,
  "leaveType": "ANNUAL",
  "startDate": "2026-11-02",
  "endDate": "2026-11-04",
  "reason": "Family trip"
}
```

```json
201 Created
{
  "id": 1,
  "employeeId": 1,
  "employeeName": "Jane Doe",
  "leaveType": "ANNUAL",
  "startDate": "2026-11-02",
  "endDate": "2026-11-04",
  "reason": "Family trip",
  "status": "PENDING",
  "rejectionReason": null,
  "createdAt": "2026-10-28T10:14:02.118",
  "updatedAt": "2026-10-28T10:14:02.118"
}
```

### List leave requests

```http
GET /api/leaves
```

Returns an array of the objects above, ordered by `createdAt` descending.

### Approve

```http
PATCH /api/leaves/1/approve
```

```json
200 OK
{ "id": 1, "status": "APPROVED", "rejectionReason": null, "...": "remaining fields as above" }
```

### Reject

```http
PATCH /api/leaves/2/reject
Content-Type: application/json

{ "rejectionReason": "Team is at full capacity that week" }
```

```json
200 OK
{ "id": 2, "status": "REJECTED", "rejectionReason": "Team is at full capacity that week", "...": "remaining fields as above" }
```

### Error format

Every error uses the same envelope, produced by `GlobalExceptionHandler` (`@RestControllerAdvice`):

```json
{
  "timestamp": "2026-10-28T10:15:42.991",
  "status": 400,
  "error": "Validation Failed",
  "message": "Validation failed for request",
  "fieldErrors": { "email": "Email should be valid" }
}
```

`fieldErrors` is `null` when the error is not field-specific (for example a `409`).

### Status codes

| Code | When |
|---|---|
| `200` | Successful read, approve or reject |
| `201` | Employee or leave request created |
| `400` | Bean Validation failure, malformed JSON, unknown leave type, `endDate < startDate`, blank rejection reason |
| `404` | Employee or leave request id does not exist |
| `409` | Duplicate email, duplicate-email race caught by the DB constraint, invalid status transition, overlapping leave |
| `500` | Unexpected server error (details are not leaked to the client) |

CORS is enabled for `http://localhost:5173` only (`backend/src/main/java/com/example/leave/config/WebConfig.java`).

---

## 9. Screenshots

The five review screenshots live in [`docs/screenshots/`](docs/screenshots). The directory is committed (with a `.gitkeep`) so the README links resolve as soon as the images are added.

| File | Screen |
|---|---|
| `01-employees.png` | Employees page with the add form and the directory table |
| `02-submit-leave.png` | Leave request form with employee/type dropdowns and date pickers |
| `03-admin-table.png` | Admin leave request table with status badges |
| `04-validation-error.png` | Server-side validation error rendered on a field |
| `05-approve-reject.png` | Approve/reject actions, including the rejection-reason modal |

---

## 10. Design decisions

**The database owns the schema.** `schema.sql` is the source of truth and is applied on startup; Hibernate runs in `validate` mode. The alternative — `ddl-auto=update` — hides schema changes and makes the checked-in SQL file decorative. Validation mode means a schema mismatch fails loudly instead of at runtime.

**Strict layering.** `controller → service → repository`, with `entity`, `dto`, `exception` and `config` as supporting packages. Controllers only bind, delegate and choose a status code; no controller contains a business rule, which is why `EmployeeController` is 30 lines.

**DTOs at the boundary, never entities.** Requests and responses are separate classes (`EmployeeRequest`/`EmployeeResponse`, `LeaveRequestCreateRequest`/`LeaveRequestResponse`, `RejectLeaveRequest`). This keeps lazy JPA associations out of JSON serialization, prevents clients from setting `id`/`status`/`createdAt`, and lets validation live on the input shape.

**Validation split by what it needs.** Format/required rules are Bean Validation annotations on the DTOs. Rules that need the database (employee exists, overlapping leave) or that compare two fields (`endDate` vs `startDate`) live in `LeaveRequestService`, so they hold even when the API is called directly with `curl`. The frontend repeats the date check only as a convenience.

**Status transitions are explicit.** The only legal transitions are `PENDING → APPROVED` and `PENDING → REJECTED`; anything else throws `InvalidStatusTransitionException` → `409`. Rejection requires a non-blank reason at both the DTO and the service layer, and the reason is trimmed before it is stored.

**Overlap check spans pending and approved leave only.** `LeaveRequestRepository.existsOverlap` uses the standard range intersection `existing.start <= new.end AND existing.end >= new.start`, filtered to `PENDING` and `APPROVED`. A `REJECTED` request therefore does not block a resubmission. It is enforced inside the create transaction.

**Errors have one shape.** `ErrorResponse` always carries `timestamp`, `status`, `error`, `message` and `fieldErrors`, so the client has exactly one parsing path (`frontend/src/api/client.js`).

**The unique constraint is the last line of defence.** The service pre-checks the email for a friendly `409`, and the database `UNIQUE` constraint catches the check-then-insert race; `DataIntegrityViolationException` is mapped to `409` as well.

---

## 11. Challenges

**Making `schema.sql` real.** The first version used `spring.jpa.hibernate.ddl-auto=update`, which built the tables at runtime and left `schema.sql` as decoration. Switching to `spring.sql.init.mode=always` + `ddl-auto=validate` surfaced two problems: MySQL must already know the database (hence `createDatabaseIfNotExist=true` in the URL), and Hibernate validates column types, not just names, so `schema.sql` had to match the entity mappings exactly (for example `LocalDateTime` ↔ `TIMESTAMP`). The H2 test profile keeps `spring.sql.init.mode=never` because `schema.sql` is MySQL-specific; Hibernate creates the H2 schema from the entities instead.

**Invalid enum values bypass Bean Validation.** Sending `"leaveType": "SICK"` fails during Jackson deserialization, before any `@NotNull` runs, so the response was a generic "Malformed or unreadable request body". `GlobalExceptionHandler` now inspects `HttpMessageNotReadableException`, recognises the `LeaveType` failure and returns `400` with the list of allowed values — while still returning the generic message for genuinely broken JSON.

**The unique-email check is not atomic.** `existsByEmail` followed by `save` has a race window: two simultaneous requests can both pass the check. The database constraint is authoritative, so the resulting `DataIntegrityViolationException` is mapped to `409` (and covered by `DataIntegrityViolationHandlerTest`) instead of falling through to the generic `500` handler.

**The overlap query had to be inclusive and status-aware.** A single-day request must overlap itself (`<=` / `>=`, not `<` / `>`), and rejected requests must be excluded or a rejected leave would permanently block that date range. The query is a JPQL `COUNT` in `LeaveRequestRepository`, executed inside the create transaction so two requests submitted at the same time cannot both slip through.

**Spring Boot 4 ships Jackson 3.** The familiar `com.fasterxml.jackson.databind.ObjectMapper` import no longer applies to the test harness; the controller tests use `tools.jackson.databind.ObjectMapper`. This was a compile-time surprise rather than a runtime bug, but it is worth knowing before copying older Spring Boot examples.

---

## 12. Limitations

- **Authentication and authorisation are not implemented.** There are no users, roles or sessions. **Admin endpoints are NOT secure** — the UI shows a notice, but the API itself is open.
- No past-date rule: a leave request may start in the past.
- No leave balance or allowance tracking; overlapping is the only quota-like check.
- No pagination, sorting or filtering on the server; `GET /api/leaves` returns everything.
- Employees cannot be edited or deleted, and leave requests cannot be cancelled.
- No optimistic locking: two administrators acting on the same request at the same instant both pass the `PENDING` check, and the last write wins.
- CORS is pinned to `http://localhost:5173`.
- No rate limiting, audit trail or structured logging.

---

## 13. Improvements with one more day

1. **Authentication + roles** — Spring Security with a simple login, `ROLE_EMPLOYEE` vs `ROLE_ADMIN`, and `@PreAuthorize` on the approve/reject endpoints.
2. **Past-date rule** — reject `startDate < today` in `LeaveRequestService` (> 400) and mirror it with `min` on the date inputs.
3. **Leave balance** — an annual allowance per employee and a check that the requested days fit the remaining balance.
4. **Pagination** — `Pageable` on `GET /api/leaves` plus a status filter, so the admin table scales.
5. **Docker Compose** — MySQL + backend + frontend with one `docker compose up`, removing the local MySQL prerequisite.
6. **Swagger / OpenAPI** — springdoc to publish the contract and replace the hand-written API tables.

---

## 14. Incomplete requirements

Being explicit about what is *not* done:

- **Past-date blocking is not implemented** (it was optional in the brief).
- **Authentication is not implemented** (optional in the brief) — see the security notice above.
- **Schema strategy:** `schema.sql` is the source of truth and Hibernate validates against it, rather than Hibernate generating the schema. The H2 test profile intentionally skips `schema.sql` and lets Hibernate create the in-memory schema from the entities.
- **No delete/update endpoints** for employees or leave requests, because the brief only asked for create/list plus approve/reject.
- **No screenshots are checked in yet** — `docs/screenshots/` is present with a `.gitkeep`; the images listed in section 9 still need to be added.
- The frontend has no automated tests; backend coverage is 40 tests.

---

## 15. AI usage / attribution

An AI coding assistant (opencode) was used during this exercise to scaffold parts of the Spring Boot backend, draft the test suite, and help write this README. Every file was reviewed afterwards, and the code is understood and explainable line by line — including why validation is split between DTO annotations and the service layer, why `ddl-auto=validate` is paired with `schema.sql`, and how the overlap query and status transitions work.

Third-party libraries are used under their respective open-source licences (Spring Boot, React, Vite); no other code was copied from external sources.
