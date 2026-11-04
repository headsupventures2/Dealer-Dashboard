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

## Demo mode (for sales meetings)

On the login page, **See it in action** opens a demo with made-up partners (Summit Motors of Utah, Wasatch Premier Auto, Canyon Fleet Services), about five weeks of completed work, upcoming jobs, new requests, and placeholder before/after photos.

- **Dealer view** shows the partner portal as Summit Motors sees it. **Admin view** shows the Leading Edge dashboard.
- The banner at the top switches between the two views or exits the demo.
- Demo data lives only in the browser and is rebuilt fresh each time you open the demo. It never touches real data, even when Supabase is connected.
- To use real photos in the demo, replace `placeholderPhoto` in `src/lib/store/demo.ts`.

## Go live with Supabase

1. Create a project at supabase.com.
2. Open **SQL Editor**, paste `supabase/schema.sql`, and run it. This creates the tables, role security, and the private `job-photos` bucket.
3. In **Authentication → Users**, add your own admin user (email + password), then run the snippet at the bottom of `schema.sql` with your email to make it an admin.
4. Copy `.env.example` to `.env.local` and fill in the three keys from **Project Settings → API**.

### Password resets

Dealers can change their password under **Account**, and anyone can use **Forgot password?** on the login page.
For the reset email link to work, in Supabase go to **Authentication → URL Configuration** and:

- set **Site URL** to your live address (e.g. `https://dashboard.leadingedgeaviationdetail.com`)
- add `https://YOUR-ADDRESS/reset-password` under **Redirect URLs**

Supabase's built-in email sender only allows a few emails per hour. Before handing out logins, point Supabase at Resend:
**Authentication → Emails → SMTP Settings**, host `smtp.resend.com`, port `465`, username `resend`, password = your Resend API key.

## New-request emails

When a dealer submits a request, Leading Edge gets an email with the vehicle, services, preferred date, and an **Open request** button.
Set `RESEND_API_KEY` and `NOTIFY_EMAIL` (see `.env.example`). Until you verify your domain in Resend, emails can only go to the address you signed up to Resend with.

## Deploy on Vercel

Import the repo in Vercel and add the environment variables from `.env.example` (the three Supabase keys, plus the Resend ones for emails).

## What's in it

- **Client portal** (`/portal`): stats, Our Plan With You, request a detail / lot rinse / fuel fill-up, vehicle history with before/after photos.
- **Admin** (`/admin`): overview with revenue by month, per-company request queue and revenue, job view (photos, checklist, notes, Mark Done), and a calendar (`/admin/calendar`, business hours 7 AM–6 PM).

## Roles

- **admin** — Leading Edge team. Sees every company, sets rates, creates dealership logins.
- **client** — Dealership staff. Sees only their own company. Enforced in the database with row-level security, not just the UI.

Completed jobs lock in the company's rate at the moment of completion (database trigger), so changing a rate later never rewrites past revenue.
