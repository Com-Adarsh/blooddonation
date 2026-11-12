# Aashraya Supabase app files

Copy these files and folders into the root of the `blooddonation` repository, replacing files with the same names. This includes the app entry point, Supabase-backed front end, package setup, example environment file, logo, and all four database migrations.

## Database

For a new Supabase project, run the four files in `supabase/migrations` in filename order from the Supabase SQL Editor.

If you already ran `202611120001_initial_backend.sql` and saw “Success. No rows returned”, do not rerun it. Run only migrations `202611120002` through `202611120004`.

Keep the `private` schema out of the exposed API schemas. Never put a secret/service-role key in browser code or Vercel `VITE_` settings.

## Local app and Vercel

1. Copy `.env.example` to `.env.local` and fill in the Supabase project URL and publishable key.
2. Install Node.js 22.12 or newer, then run `npm install` and `npm run build`.
3. In Vercel, use `npm run build` as the build command and `dist` as the output directory.
4. Add `VITE_SUPABASE_URL` and `VITE_SUPABASE_PUBLISHABLE_KEY` to Vercel's Production (and Preview, if needed) environment variables, then redeploy.
5. Add the production URL to Supabase Auth's allowed redirect URLs. Confirm the student email domain with the CUSAT Blood Donation Cell before restricting signups.

Without credentials, the app uses its labeled local preview mode. Do not treat that as a live shared database app.
