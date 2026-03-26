# famoovie

Minimal Cloudflare Pages + D1 + React login app.

## What it includes

- React login page (Vite build, deployed to Cloudflare Pages)
- Pages Function API endpoint: `POST /api/login`
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

3. Start local dev server (builds and runs Pages dev):

   ```bash
   npm run dev
   ```

4. Open the local URL printed by Wrangler (usually `http://127.0.0.1:8788`).
5. Log in with:
   - Username: `admin`
   - Password: `admin`

## Deploy to Cloudflare

1. Create a D1 database (skip if already exists):

   ```bash
   npx wrangler d1 create famoovie
   ```

2. Copy the `database_id` from the output and update `wrangler.toml`.

3. Create a Pages project (skip if already exists):

   ```bash
   npx wrangler pages project create famoovie --production-branch main
   ```

4. Apply migrations to remote D1:

   ```bash
   npm run db:migrate:remote
   ```

5. Deploy:

   ```bash
   npm run deploy
   ```

## Notes

- JavaScript only
- Plain SQL, no ORM
- No auth libraries, no sessions, no JWT
- Local component state only
