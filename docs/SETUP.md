# SETUP GUIDE — Metallics Jewellery Catalogue

## Prerequisites

| Tool | Version | Purpose |
|------|---------|---------|
| Node.js | ≥ 18.x | Runtime |
| npm | ≥ 9.x | Package manager |
| Git | any | Version control |
| Supabase account | — | Backend services |
| Vercel account | — | Frontend deployment (production) |

---

## 1. Supabase Project Setup

### 1.1 Create a Supabase Project

1. Go to [supabase.com](https://supabase.com) and create a new project.
2. Choose a region close to your target audience.
3. Set a strong database password.
4. Note down the following from **Settings → API**:
   - **Project URL** (e.g. `https://xxxx.supabase.co`)
   - **Anon public key** (safe for frontend use)
   - **Service role key** (server-side only — NEVER expose in frontend)

### 1.2 Apply Database Migrations

Migrations are located in `supabase/migrations/` and must be run **in order** (001 through 011).

**Option A — Supabase CLI (recommended):**

```bash
# Install Supabase CLI (if not installed)
npm install -g supabase

# Login and link to your project
supabase login
supabase link --project-ref YOUR_PROJECT_REF

# Apply all migrations
supabase db push
```

**Option B — SQL Editor (manual):**

1. Open the **SQL Editor** in your Supabase Dashboard.
2. Copy and paste each migration file's contents in order:
   - `001_categories.sql` — Categories table + seed data
   - `002_products.sql` — Products table + updated_at trigger
   - `003_product_images.sql` — Product images table
   - `004_orders.sql` — Orders table
   - `005_order_items.sql` — Order items table (snapshots)
   - `006_admin_users.sql` — Admin users table
   - `007_site_settings.sql` — Site settings + seed defaults
   - `008_indexes.sql` — Performance indexes
   - `009_rls_policies.sql` — `is_admin()` function + all RLS policies
   - `010_create_order_function.sql` — Transactional order creation function
   - `011_storage_policies.sql` — Storage bucket + access policies
3. Run each one and verify it completes without errors.

### 1.3 Verify the Schema

After applying migrations, verify in the Supabase Dashboard:

| Table | Check |
|-------|-------|
| `categories` | 4 rows (Earrings, Necklace, Bracelet, Ring) |
| `products` | Empty, ready for data |
| `product_images` | Empty |
| `orders` | Empty |
| `order_items` | Empty |
| `admin_users` | Empty (you'll add your user next) |
| `site_settings` | 6 rows with default values |

Verify RLS is enabled on all tables (Table Editor → each table → RLS toggle should be ON).

### 1.4 Create the Storage Bucket

> [!NOTE]
> Migration 011 attempts to create the bucket via SQL. If this doesn't work
> (some Supabase plans restrict `storage.buckets` inserts), create it manually:

1. Go to **Storage** in the Supabase Dashboard.
2. Click **New Bucket**.
3. Name: `product-images`
4. Toggle **Public bucket** to ON.
5. Click **Create bucket**.

The storage access policies are created by migration 011. If you created the bucket manually, the policies from the migration still apply.

### 1.5 Create the First Admin Account

> [!IMPORTANT]
> There is no public admin registration. The first admin must be created manually.

**Step 1 — Create an auth user:**

1. Go to **Authentication → Users** in the Supabase Dashboard.
2. Click **Add User** → **Create New User**.
3. Enter the admin's email and a strong password.
4. Note the generated **User UID** (click the user row to see it).

**Step 2 — Grant admin role:**

Go to **SQL Editor** and run:

```sql
INSERT INTO public.admin_users (user_id, role)
VALUES ('PASTE-YOUR-USER-UID-HERE', 'admin');
```

Replace `PASTE-YOUR-USER-UID-HERE` with the actual UUID from step 1.

**Step 3 — Verify:**

```sql
SELECT au.id, au.user_id, au.role, u.email
FROM public.admin_users au
JOIN auth.users u ON u.id = au.user_id;
```

You should see your admin user listed.

---

## 2. Local Development Setup

### 2.1 Clone & Install

```bash
git clone <repository-url>
cd Metallics
npm install
```

### 2.2 Environment Variables

Copy the example file and fill in your Supabase credentials:

```bash
cp .env.example .env.local
```

Edit `.env.local`:

```env
VITE_SUPABASE_URL=https://your-project-ref.supabase.co
VITE_SUPABASE_ANON_KEY=eyJ...your-anon-key
VITE_APP_URL=http://localhost:5173
```

> [!CAUTION]
> Never put the **service role key** in any `VITE_` variable.
> It belongs exclusively in Edge Function secrets.

### 2.3 Start Development Server

```bash
npm run dev
```

The app will be available at `http://localhost:5173`.

---

## 3. Supabase Edge Functions

### 3.1 Set Secrets

The `create-order` Edge Function requires the service role key:

```bash
supabase secrets set SERVICE_ROLE_KEY=your-service-role-key-here
```

> [!WARNING]
> `SUPABASE_URL` is automatically available in Edge Functions.
> Only `SERVICE_ROLE_KEY` needs to be set manually.

### 3.2 Deploy

```bash
supabase functions deploy create-order
```

### 3.3 Local Testing

```bash
# Create a local secrets file (gitignored)
echo 'SERVICE_ROLE_KEY=your-service-role-key-here' > supabase/.env.local

# Serve locally
supabase functions serve create-order --env-file ./supabase/.env.local
```

---

## 4. Vercel Deployment

### 4.1 Connect Repository

1. Push code to GitHub / GitLab / Bitbucket.
2. Import the repository in [vercel.com](https://vercel.com).

### 4.2 Build Settings

| Setting | Value |
|---------|-------|
| Framework Preset | Vite |
| Build Command | `npm run build` |
| Output Directory | `dist` |
| Install Command | `npm install` |

### 4.3 Environment Variables

Add in Vercel Dashboard → Settings → Environment Variables:

| Variable | Value |
|----------|-------|
| `VITE_SUPABASE_URL` | Your Supabase project URL |
| `VITE_SUPABASE_ANON_KEY` | Your Supabase anon key |
| `VITE_APP_URL` | Your Vercel URL (e.g. `https://metallics.vercel.app`) |

### 4.4 SPA Routing

The `vercel.json` file is already configured for SPA routing:

```json
{
  "rewrites": [
    { "source": "/(.*)", "destination": "/" }
  ]
}
```

---

## 5. Post-Deployment Checklist

- [ ] Database migrations applied (all 11 files)
- [ ] RLS enabled on all 7 tables
- [ ] `is_admin()` function exists
- [ ] `create_order()` function exists
- [ ] Storage bucket `product-images` created and public
- [ ] Storage policies applied (4 policies on `storage.objects`)
- [ ] First admin account created in auth + admin_users
- [ ] Edge Function `create-order` deployed
- [ ] `SERVICE_ROLE_KEY` secret set for Edge Function
- [ ] Vercel environment variables configured
- [ ] Admin login tested at `/admin/login`
- [ ] Site settings visible (brand name loads)
- [ ] Categories load on `/catalog` (4 categories)

---

## 6. Environment Variables Reference

| Variable | Location | Purpose | Secret? |
|----------|----------|---------|---------|
| `VITE_SUPABASE_URL` | `.env.local`, Vercel | Supabase API endpoint | No |
| `VITE_SUPABASE_ANON_KEY` | `.env.local`, Vercel | Public API key | No |
| `VITE_APP_URL` | `.env.local`, Vercel | Base URL for order links | No |
| `SERVICE_ROLE_KEY` | Edge Function secrets | Server-side DB access | **YES** |

---

## 7. Database Schema Summary

```
categories ──1:N──► products ──1:N──► product_images
                        │
                        └──N:1──► order_items ◄──N:1── orders

auth.users ──1:1──► admin_users

site_settings (standalone key-value store)
```

### Migration Files

| File | Purpose |
|------|---------|
| `001_categories.sql` | Categories table + 4 seed rows |
| `002_products.sql` | Products table + `update_updated_at()` trigger |
| `003_product_images.sql` | Product images + one-primary-per-product constraint |
| `004_orders.sql` | Orders table + status enum + updated_at trigger |
| `005_order_items.sql` | Order items with snapshot fields |
| `006_admin_users.sql` | Admin users (FK to auth.users) |
| `007_site_settings.sql` | Site settings + 6 default rows + updated_at trigger |
| `008_indexes.sql` | 11 performance indexes |
| `009_rls_policies.sql` | `is_admin()` + 22 RLS policies on 7 tables |
| `010_create_order_function.sql` | Transactional `create_order()` function |
| `011_storage_policies.sql` | `product-images` bucket + 4 storage policies |
