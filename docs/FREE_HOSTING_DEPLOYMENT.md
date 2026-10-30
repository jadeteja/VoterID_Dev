# Free Hosting & Deployment Guide
## Deploying Ward 81 Voter Search to Cloudflare Pages and Supabase

### 1. Supabase Project Setup (Zero Cost)

1. Sign up or log into [supabase.com](https://supabase.com).
2. Click **New Project** and name it `ward81-voter-search`. Choose the region closest to Andhra Pradesh (e.g. `ap-south-1` Mumbai).
3. Navigate to **SQL Editor** in the Supabase Dashboard.
4. Open the migration script located at:
   `supabase/migrations/20261030000000_ward81_init.sql`
5. Paste the entire SQL script and click **Run**.
6. Navigate to **Project Settings** > **API**.
7. Copy:
   - `Project URL`
   - `anon / public` API Key.
   *(Note: Never copy the `service_role` secret key into frontend configuration).*

### 2. Cloudflare Pages Deployment (Zero Cost)

1. Push your repository to GitHub.
2. Sign up or log into [dash.cloudflare.com](https://dash.cloudflare.com).
3. Navigate to **Workers & Pages** > **Create application** > **Pages** > **Connect to Git**.
4. Select your `ward81-voter-search` repository.
5. In the Build settings:
   - **Framework preset**: `Vite`
   - **Build command**: `npm run build`
   - **Build output directory**: `dist`
   - **Environment variables**:
     - `VITE_SUPABASE_URL`: `<your-supabase-project-url>`
     - `VITE_SUPABASE_ANON_KEY`: `<your-supabase-anon-key>`
6. Click **Save and Deploy**.
7. Cloudflare Pages will build and deploy the app to `https://<project-name>.pages.dev`.

### 3. SPA Routing Fallback
The `public/_redirects` file ensures that deep links (such as `/search` or `/dashboard`) properly fallback to `index.html` without 404 errors:
```
/* /index.html 200
```
