# Omibits Leave Management — Frontend

React + Vite frontend for the frontend-only leave management demo. All data is kept in `localStorage`; no backend or API is required.

## Run

```bash
npm install
npm run dev
```

Open the URL printed by Vite (normally http://localhost:5173).

## Demo accounts

| Role | Email | Password |
|---|---|---|
| Administrator | `admin@omibits.com` | `admin123` |
| Employee | `employee@omibits.com` | `employee123` |

## Scripts

- `npm run dev` — start the Vite dev server
- `npm run build` — create a production build in `dist/`
- `npm run preview` — preview the production build
- `npm run lint` — run ESLint

See the [root README](../README.md) for features, limitations and manual test steps.

> This is a demo, not secure production authentication: passwords are stored in plain text in the browser.
