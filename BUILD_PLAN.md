# BUILD PLAN — Metallics Jewellery Catalogue

## Implementation Sequence

The project is divided into 13 phases, ordered by dependency. Each phase is self-contained and testable before the next begins.

---

## Phase 1 — Project Scaffolding & Design System

**Goal:** Bootable Vite + React 19 + TypeScript app with Tailwind v4, design tokens, fonts, and base layout components.

| Task | Details |
|------|---------|
| 1.1 | Scaffold Vite project with React 19 + TypeScript template |
| 1.2 | Install dependencies: `tailwindcss@4`, `@tailwindcss/vite`, `react-router`, `lucide-react`, `@supabase/supabase-js` |
| 1.3 | Configure Tailwind v4 with design tokens (colours, fonts, spacing) |
| 1.4 | Add Google Fonts: Playfair Display (serif) + Inter (sans-serif) |
| 1.5 | Create base CSS with custom properties for the colour palette |
| 1.6 | Build reusable UI primitives: Button, Input, Badge, Skeleton, Spinner, EmptyState, ErrorState |
| 1.7 | Create layout shells: PublicLayout (header + footer), AdminLayout (sidebar + header) |
| 1.8 | Configure React Router with route structure for all pages |
| 1.9 | Add responsive header: left nav links, centre brand name, right icons (search + cart badge) |
| 1.10 | Add mobile hamburger menu |
| 1.11 | Set up environment variables: `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY` |
| 1.12 | Create Supabase client singleton |

**Deliverable:** Running app with styled header, routing, and placeholder pages.

---

## Phase 2 — Supabase Schema & Migrations

**Goal:** Complete database schema with all tables, indexes, constraints, and seed data.

| Task | Details |
|------|---------|
| 2.1 | Create migration: `categories` table with seed data (Earrings, Necklace, Bracelet, Ring) |
| 2.2 | Create migration: `products` table with foreign key to categories |
| 2.3 | Create migration: `product_images` table with foreign key to products |
| 2.4 | Create migration: `orders` table with order_code, public_token, status enum |
| 2.5 | Create migration: `order_items` table with snapshot fields |
| 2.6 | Create migration: `admin_users` table (user_id FK to auth.users, role, created_at) |
| 2.7 | Create migration: `site_settings` table (key-value pairs for brand config) |
| 2.8 | Add indexes: products(category_id, is_available, sort_order), products(slug), products(created_at), orders(public_token), orders(order_code) |
| 2.9 | Create DB function: `create_order(items, note)` — transactional order + items insert with price validation |
| 2.10 | Seed site_settings with defaults (brand_name, tagline, instagram_username, currency_code, currency_locale) |

**Deliverable:** Complete schema ready for RLS and application use.

---

## Phase 3 — Row Level Security & Auth

**Goal:** All tables locked down with RLS policies. Admin auth flow working.

| Task | Details |
|------|---------|
| 3.1 | Enable RLS on all tables |
| 3.2 | Categories: public SELECT where `is_active = true`; admin full CRUD |
| 3.3 | Products: public SELECT where `is_available = true`; admin full CRUD |
| 3.4 | Product images: public SELECT for available products; admin full CRUD |
| 3.5 | Orders: public SELECT via `public_token` match; admin SELECT/UPDATE all |
| 3.6 | Order items: public SELECT via order's `public_token`; admin SELECT all |
| 3.7 | Admin users: SELECT own row only; no public access |
| 3.8 | Site settings: public SELECT for non-sensitive keys; admin full CRUD |
| 3.9 | Create helper function: `is_admin()` — checks `admin_users` table for current `auth.uid()` |
| 3.10 | Document manual first-admin setup procedure |

**Deliverable:** Fully secured database; unauthenticated users can only read public data.

---

## Phase 4 — Supabase Storage

**Goal:** Product image bucket configured with access policies.

| Task | Details |
|------|---------|
| 4.1 | Create `product-images` storage bucket |
| 4.2 | Set bucket to public read |
| 4.3 | Restrict upload/update/delete to authenticated admins |
| 4.4 | Create storage helper utilities: `uploadImage`, `deleteImage`, `getPublicUrl` |
| 4.5 | Define image path convention: `products/{product_id}/{filename}` |

**Deliverable:** Working image storage with proper access control.

---

## Phase 5 — Admin Authentication

**Goal:** Admin login page, auth context, protected routes.

| Task | Details |
|------|---------|
| 5.1 | Build admin login page (email + password) |
| 5.2 | Create AuthContext / useAuth hook wrapping Supabase Auth |
| 5.3 | On login, verify user exists in `admin_users` table |
| 5.4 | Build ProtectedRoute wrapper — redirects to login if not admin |
| 5.5 | Build admin layout with sidebar navigation |
| 5.6 | Handle session persistence & refresh |
| 5.7 | Add logout functionality |

**Deliverable:** Secure admin login with session management.

---

## Phase 6 — Admin Panel — Core Features

**Goal:** Full admin CRUD for products, categories, and settings.

| Task | Details |
|------|---------|
| 6.1 | **Dashboard:** stats cards (products, categories, orders by status) |
| 6.2 | **Category management:** list, add, edit, reorder, toggle active |
| 6.3 | **Product list:** table with search, category filter, pagination |
| 6.4 | **Product form (new/edit):** name, slug (auto-generated), SKU, category, description, price, availability, featured, sort order |
| 6.5 | **Image manager (within product form):** multi-upload with progress, preview grid, set primary, reorder (drag or arrows), delete, alt text |
| 6.6 | **Product archiving:** toggle availability; warn if product has order history |
| 6.7 | **CSV import:** file upload → parse → validate → preview → confirm → batch insert |
| 6.8 | **CSV export:** download current products as CSV |
| 6.9 | **Settings page:** brand name, logo upload, tagline, Instagram username, currency, About Us content (rich text or markdown) |

**Deliverable:** Fully functional admin panel for all content management.

---

## Phase 7 — Public Catalogue

**Goal:** Editorial-layout catalogue page with real Supabase data.

| Task | Details |
|------|---------|
| 7.1 | Create Supabase service: `getProducts({ category, search, sort, page })` with range-based pagination |
| 7.2 | Create Supabase service: `getCategories()` with client-side caching |
| 7.3 | Build category filter tabs (pill-style, horizontal scroll on mobile) |
| 7.4 | Build search bar with 300ms debounce |
| 7.5 | Build sort dropdown (5 options) |
| 7.6 | Build editorial masonry grid layout (asymmetric cards, interspersed taglines) |
| 7.7 | Build ProductCard component (image, name, price, arrow overlay, add-to-cart) |
| 7.8 | Build FeaturedProductCard (large variant) |
| 7.9 | Implement pagination controls (prev, next, page numbers) |
| 7.10 | Implement skeleton loaders for product grid |
| 7.11 | Implement empty/error/no-results states |
| 7.12 | Lazy-load product images with `loading="lazy"` |
| 7.13 | Refined placeholder for products without images |

**Deliverable:** Catalogue page fetching real data, filtered, sorted, paginated.

---

## Phase 8 — Product Details Page

**Goal:** Full product page with image gallery and add-to-cart.

| Task | Details |
|------|---------|
| 8.1 | Create Supabase service: `getProductBySlug(slug)` with images |
| 8.2 | Build product page layout (image left/top, details right/bottom) |
| 8.3 | Build image gallery: main image + thumbnail strip, click to switch |
| 8.4 | Build image zoom/enlarge on click (lightbox or modal) |
| 8.5 | Display: name, price, description, category badge, availability |
| 8.6 | Add to Cart button (integrates with cart context) |
| 8.7 | Handle product not found (404 state) |
| 8.8 | Responsive layout (stacked on mobile) |

**Deliverable:** Product detail pages accessible via `/product/:slug`.

---

## Phase 9 — Shopping Cart

**Goal:** Fully functional cart with localStorage persistence.

| Task | Details |
|------|---------|
| 9.1 | Create CartContext / useCart hook |
| 9.2 | Cart state: `{ productId, quantity }[]` in localStorage |
| 9.3 | On cart page load, fetch product details for all cart items from Supabase |
| 9.4 | Implement: addToCart, removeFromCart, updateQuantity, clearCart |
| 9.5 | Merge duplicates (same product → increment quantity) |
| 9.6 | Build cart page UI: product rows with image, name, price, qty controls, line total |
| 9.7 | Show subtotal and total item count |
| 9.8 | Handle unavailable products: warning banner, disable submission |
| 9.9 | Empty cart state |
| 9.10 | Cart badge on header icon (from context) |
| 9.11 | DM to Order button (proceeds to order creation) |
| 9.12 | Responsive cart layout |

**Deliverable:** Working cart with persistence and live data validation.

---

## Phase 10 — Order Creation & Edge Function

**Goal:** Secure server-side order creation with validation.

| Task | Details |
|------|---------|
| 10.1 | Create Supabase Edge Function: `create-order` |
| 10.2 | Accept: `{ items: [{ product_id, quantity }], customer_note? }` |
| 10.3 | Validate: product IDs exist, are available, quantities > 0, note length ≤ 500 |
| 10.4 | Fetch current prices from DB |
| 10.5 | Calculate line totals and subtotal server-side |
| 10.6 | Generate unique `order_code` (e.g. `MET-{timestamp}-{random}`) |
| 10.7 | Generate secure `public_token` (UUID v4) |
| 10.8 | Call DB function to insert order + items transactionally |
| 10.9 | Snapshot product name, slug, SKU, unit_price, image_path into order_items |
| 10.10 | Return: order_code, public_token, items summary, subtotal |
| 10.11 | Add rate limiting headers and abuse protection |
| 10.12 | Add idempotency support (optional idempotency key) |

**Deliverable:** Secure, validated order creation endpoint.

---

## Phase 11 — DM to Order & Confirmation

**Goal:** Complete order flow from cart submission to Instagram handoff.

| Task | Details |
|------|---------|
| 11.1 | On "DM to Order" click: call Edge Function with cart items |
| 11.2 | On success: generate formatted order summary text |
| 11.3 | Copy summary to clipboard (Clipboard API with fallback) |
| 11.4 | Navigate to confirmation page |
| 11.5 | Build confirmation page: order code, "copied" notice, Copy button, Open Instagram DM button |
| 11.6 | Instagram link: `https://ig.me/m/{INSTAGRAM_USERNAME}` from site_settings |
| 11.7 | If clipboard fails: display full selectable summary text + retry copy |
| 11.8 | Clear cart after successful order creation |
| 11.9 | Build public order page: `/order/:publicToken` — displays order via RLS-secured query |
| 11.10 | Public order page: products, images, quantities, prices, subtotal, status |

**Deliverable:** Complete DM-to-Order flow working end-to-end.

---

## Phase 12 — Home Page & About Page

**Goal:** Polished landing and information pages.

| Task | Details |
|------|---------|
| 12.1 | Home page: hero section with brand intro and tagline (from settings) |
| 12.2 | Home page: featured products section (is_featured=true from Supabase) |
| 12.3 | Home page: "Browse Collection" CTA linking to catalogue |
| 12.4 | About page: render admin-configured About Us content |
| 12.5 | Footer: brand name, Instagram link, copyright |

**Deliverable:** Complete public-facing pages.

---

## Phase 13 — Admin Order Management

**Goal:** Order viewing and status management in admin.

| Task | Details |
|------|---------|
| 13.1 | Order list page: table with order code, date, items count, total, status, actions |
| 13.2 | Search by order code |
| 13.3 | Filter by status |
| 13.4 | Order detail view: all items with images, prices, quantities, line totals, subtotal, note, timestamps |
| 13.5 | Status update dropdown: awaiting_dm → contacted → confirmed → completed / cancelled |
| 13.6 | Pagination for order list |

**Deliverable:** Admin can manage the full order lifecycle.

---

## Phase 14 — Polish, Testing & Deployment

**Goal:** Production-ready application.

| Task | Details |
|------|---------|
| 14.1 | Cross-browser testing (Chrome, Safari, Firefox, mobile Safari, mobile Chrome) |
| 14.2 | Responsive design audit at all breakpoints |
| 14.3 | Accessibility audit (keyboard nav, focus states, contrast, alt text) |
| 14.4 | Performance audit (Lighthouse, image optimization, lazy loading) |
| 14.5 | Error handling audit (network failures, edge cases) |
| 14.6 | Configure Vercel deployment (build settings, env vars, redirects for SPA) |
| 14.7 | Configure Supabase production project |
| 14.8 | Run migrations on production |
| 14.9 | Set up first admin account |
| 14.10 | Final end-to-end walkthrough of all 30 acceptance criteria |

**Deliverable:** Deployed, production-ready application.

---

## Dependency Graph

```
Phase 1 (Scaffold) ──┐
                      ├── Phase 2 (Schema) ── Phase 3 (RLS) ── Phase 4 (Storage)
                      │                                              │
                      │         ┌────────────────────────────────────┘
                      │         │
                      ├── Phase 5 (Admin Auth) ── Phase 6 (Admin Panel)
                      │                                    │
                      ├── Phase 7 (Catalogue) ─────────────┤
                      │         │                          │
                      ├── Phase 8 (Product Details)        │
                      │         │                          │
                      ├── Phase 9 (Cart) ──────────────────┤
                      │         │                          │
                      └── Phase 10 (Edge Function) ── Phase 11 (DM Flow)
                                                           │
                                Phase 12 (Home/About) ─────┤
                                                           │
                                Phase 13 (Admin Orders) ───┤
                                                           │
                                Phase 14 (Polish/Deploy) ──┘
```

Phases 1–4 are sequential (each depends on the prior). After Phase 4, Phases 5–9 can be partially parallelised. Phase 10 requires 9; Phase 11 requires 10. Phases 12–13 can run alongside 11. Phase 14 is the final pass.
