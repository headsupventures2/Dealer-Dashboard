# Leading Edge Detailing — Dealer Dashboard

Client portal + admin dashboard for dealership and fleet partners: requests, scheduling, photo proof, and revenue per deal.

Built with Next.js, Tailwind, and Supabase. Deploys to Vercel.

## Run it locally

```bash
npm install
npm run dev
```

Open http://localhost:3000.

With no Supabase keys set, the app runs in **preview mode**: everything is saved in your browser only.
Sign in with `admin@leadingedge.test` / `leadingedge`.

## Go live with Supabase

1. Create a project at supabase.com.
2. Open **SQL Editor**, paste `supabase/schema.sql`, and run it. This creates the tables, role security, and the private `job-photos` bucket.
3. In **Authentication → Users**, add your own admin user (email + password), then run the snippet at the bottom of `schema.sql` with your email to make it an admin.
4. Copy `.env.example` to `.env.local` and fill in the three keys from **Project Settings → API**.

## Deploy on Vercel

Import the repo in Vercel and add the same three environment variables. That's it.

## Roles

- **admin** — Leading Edge team. Sees every company, sets rates, creates dealership logins.
- **client** — Dealership staff. Sees only their own company. Enforced in the database with row-level security, not just the UI.

Completed jobs lock in the company's rate at the moment of completion (database trigger), so changing a rate later never rewrites past revenue.
