# famoovie

Minimal Cloudflare Worker + D1 + React login app.

## What it includes

- React login page (served as static assets by the Worker)
- Worker API endpoint: `POST /api/login`
- D1 `users` table
- Seed user: `admin/admin`
- On successful login, updates `last_login_at`
- Dashboard shows `username` and `last_login_at`

## Run locally

1. Install dependencies:

   ```bash
   npm install
   ```

2. Apply D1 migrations locally (creates table and seeds `admin/admin`):

   ```bash
   npm run db:migrate:local
   ```

3. Start local dev server:

   ```bash
   npm run dev
   ```

4. Open the local URL printed by Wrangler (usually `http://127.0.0.1:8787`).
5. Log in with:
   - Username: `admin`
   - Password: `admin`

## Notes

- JavaScript only
- Plain SQL, no ORM
- No auth libraries, no sessions, no JWT
- Local component state only