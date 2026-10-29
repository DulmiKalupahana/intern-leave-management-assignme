# Omibits Leave Management — Frontend

React + Vite frontend for the Omibits employee leave management system.

## Getting started

1. Install dependencies:

   ```bash
   npm install
   ```

2. Optionally create a local environment file (the client defaults to
   `http://localhost:8080` when this is absent):

   ```bash
   cp .env.example .env
   ```

   `VITE_API_BASE_URL` is read from `.env` if present.

3. Start the Spring Boot backend on `http://localhost:8080`.

4. Run the dev server:

   ```bash
   npm run dev
   ```

## Scripts

- `npm run dev` — start the Vite dev server
- `npm run build` — create a production build in `dist/`
- `npm run preview` — preview the production build
- `npm run lint` — run ESLint

## Pages

- **Employees** — add employees and view the employee list.
- **Submit Leave** — submit a leave request for an employee.
- **Leave Requests** — admin view for approving or rejecting pending requests.

## Notes

Authentication is not implemented, so admin actions are not secured.
