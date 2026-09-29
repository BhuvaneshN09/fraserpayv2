# FraserPay V2

A school charity-event cash ledger built with Next.js, TypeScript, Auth.js, Prisma, and PostgreSQL. Students register with a PDSB email, view their balance and cash-deposit history, and may send internal transfers to another student account using its PDSB email. Staff record money collected in person; every deposit records the student, event, staff member, amount, and timestamp. Reversals append an audit record and cannot be repeated. This app does not accept online payments or store payment-card information.

## Requirements

- Node.js 20 or newer
- PostgreSQL 14 or newer

## Local setup

1. Install dependencies with `npm install`.
2. Copy `.env.example` to `.env`, replace `POSTGRES_PASSWORD` with a local development password, and generate `AUTH_SECRET` with `openssl rand -base64 32`. Keep `.env` private.
3. Start PostgreSQL with `docker compose up -d postgres`.
4. Apply the database migrations with `npm run db:migrate`.
5. Start the development server with `npm run dev` and open `http://localhost:3000`.
6. Create a student account using a `@pdsb.net` email. Passwords must be at least 12 characters and are stored as bcrypt hashes.

If PostgreSQL is already hosted locally or remotely, skip Compose and set `DATABASE_URL` to that database instead. The Compose database is for local development only.

New accounts always receive the `STUDENT` role and start with a zero balance. A trusted database operator grants SAC access with `npm run user:role -- sac@pdsb.net SAC_ADMIN`; use `ADMIN` only for system administrators, and demote access with `STUDENT` when it is no longer needed. The command uses Prisma's parameterized update and is not exposed as a web route. SAC admins use `/admin`; only `SAC_ADMIN` and `ADMIN` roles can record or reverse deposits.

Cash deposits and reversals are append-only. Balance changes and their audit records happen in one database transaction. A unique request ID prevents retries from crediting the same form submission twice. Student-to-student transfers require an existing `@pdsb.net` student account and cannot overdraw the sender. Staff permissions are checked against the database on each mutation; a role from the client or session is never trusted.

The SAC admin has two pages: `/admin/transfer` records cash additions, and `/admin/monitor` alerts on student balances and deposits/transfers strictly above CAD $50. The $50 threshold is a monitor alert, not a transfer minimum.

If sign-in reports a server configuration problem, confirm that `.env` exists, `AUTH_SECRET` is a generated secret rather than the example placeholder, PostgreSQL is running, and `DATABASE_URL` points to it. Then apply migrations with `npm run db:migrate` and restart the development server.

## Checks

```sh
npm run typecheck
npm run lint
npm test
npm run build
```

The tests cover school-email validation, password verification, zero-balance student creation, dashboard access using only the authenticated session user's ID, staff-only deposit authorization, and single-use reversals.

## Vercel deployment

1. Import this repository into Vercel and select the Next.js framework preset.
2. Provision a hosted PostgreSQL database and set `DATABASE_URL` in the Vercel project environment variables for Preview and Production as appropriate.
3. Set a unique `AUTH_SECRET` for each Vercel environment. Do not commit secrets.
4. Before the first deployment, apply migrations against the production database by running `npm run db:deploy` from a trusted environment with the production `DATABASE_URL`. Repeat this after each migration and before deploying code that depends on it.
5. Deploy through Vercel. Its standard Next.js build command runs `prisma generate` before `next build`.

Vercel Functions do not run database migrations automatically. Apply migrations as a controlled deployment step, not from the application request path. Use a pooled PostgreSQL URL for application traffic when required by your database provider; use the provider's direct connection URL for migrations if its pooling layer does not support schema changes.

## Account access and scope

Auth.js uses JWT sessions for the credentials provider. The dashboard requires a valid session and reads the user and role from the database using the session ID; it never accepts a client-provided user ID. Registration hashes passwords with bcrypt before storage. The `@pdsb.net` check only validates the address format; it does not verify that a student owns the address. Google sign-in with verified school email is not enabled yet. Until it is, staff must confirm a student's identity in person before recording a deposit. Rotate database credentials and `AUTH_SECRET` after any suspected compromise, restrict database network access, and never commit `.env`.