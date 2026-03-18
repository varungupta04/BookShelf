# BookShelf

A modern reading companion — **React (Vite) + Tailwind** frontend, **Express** backend, **Supabase** for DB/Auth, and **Gemini** for AI.

## Dev (one command)

From the repo root:

```bash
npm run dev
```

- Client: `http://localhost:5173`
- Server: `http://localhost:3001`
- Health check: `http://localhost:3001/api/health`

## Environment variables

Fill in these files (placeholders are already created):

- `server/.env`
  - `SUPABASE_URL`
  - `SUPABASE_ANON_KEY`
  - `GEMINI_API_KEY`
- `client/.env`
  - `VITE_SUPABASE_URL`
  - `VITE_SUPABASE_ANON_KEY`

## Notes

- The Vite dev server proxies `/api/*` to the Express server during development.

