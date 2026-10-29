# Omibits Leave Management — Frontend

React + Vite frontend for the passwordless leave management demo. All data is kept in `localStorage`; no backend or API is required.

## Run

```bash
npm install
npm run dev
```

Open the URL printed by Vite (normally http://localhost:5173).

## Demo access

- **Admin Login** opens the Admin Dashboard directly.
- **Employee Login** shows a dropdown of saved employees; select one to continue without a password.

> Passwordless role selection is for demonstration only and is not secure authentication.

## Scripts

- `npm run dev` — start the Vite dev server
- `npm run build` — create a production build in `dist/`
- `npm run preview` — preview the production build
- `npm run lint` — run ESLint

See the [root README](../README.md) for features, limitations and the manual test flow.
