# PROJECT SPEC — Metallics Jewellery Catalogue

## Overview

A premium, editorial-style jewellery catalogue website enabling customers to browse products, build a cart, and submit orders via Instagram DM. No online payments, no customer registration, no traditional checkout.

---

## Technology Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 19 · TypeScript · Vite · Tailwind CSS v4 · React Router · Lucide React |
| Backend | Supabase PostgreSQL · Supabase Auth · Supabase Storage · Supabase Edge Functions |
| Deployment | Vercel (frontend) · Supabase (backend) |

No Django, Flask, Firebase, or additional databases.

---

## Design Direction

### Visual Reference

The catalogue follows an editorial jewellery-magazine aesthetic with asymmetric masonry layouts, large portrait-oriented photography, generous whitespace, and understated elegance.

### Colour Palette

| Token | Value | Usage |
|-------|-------|-------|
| Background | `#F7F4EB` | Warm ivory page background |
| Primary | `#650019` | Burgundy / wine-red accents, active states |
| Text | `#351F21` | Primary body text |
| Muted text | `#847975` | Secondary labels, prices |
| Border | `#D9D0C5` | Card borders, dividers |
| Card BG | `#F7F4EB` | Card surfaces |

### Typography

- **Headings / Brand:** Elegant serif (e.g. Playfair Display)
- **Body / UI:** Clean sans-serif (e.g. Inter)
- Product names: refined italic serif treatment

### Layout Characteristics

- Asymmetric masonry grid (not uniform rectangles)
- Mix of large featured cards and smaller product cards
- Circular arrow overlay on product images
- Generous spacing
- Interspersed brand taglines between products
- Portrait-oriented imagery emphasis

---

## Pages

| # | Route | Purpose |
|---|-------|---------|
| 1 | `/` | Home / Collection — hero, featured products, brand intro |
| 2 | `/catalog` | Primary catalogue with categories, search, sort, pagination |
| 3 | `/product/:slug` | Product details with gallery, description, add-to-cart |
| 4 | `/cart` | Shopping cart with quantities, totals, DM-to-Order |
| 5 | `/order/confirmation` | Post-order confirmation with copy & Instagram link |
| 6 | `/order/:publicToken` | Public order details (read-only via secure token) |
| 7 | `/about` | Brand information (admin-configurable content) |
| 8 | `/admin/login` | Admin authentication |
| 9 | `/admin/dashboard` | Admin overview statistics |
| 10 | `/admin/products` | Product CRUD with search, filter |
| 11 | `/admin/products/new` | New product form |
| 12 | `/admin/products/:id/edit` | Edit product form |
| 13 | `/admin/orders` | Order management with status updates |
| 14 | `/admin/categories` | Category management |
| 15 | `/admin/settings` | Brand settings, Instagram username, currency |

---

## Header

- **Left:** About Us · Collection · Catalog
- **Centre:** Configurable brand name / wordmark (serif font)
- **Right:** Search icon · Cart icon (live badge count)
- Responsive: hamburger menu on mobile

---

## Catalogue Requirements

### Categories (filter tabs)
All (virtual) · Earrings · Necklace · Bracelet · Ring

### Sorting Options
Recommended · Newest · Price Low→High · Price High→Low · Name A→Z

### Pagination
- **25 products per page** via Supabase `range()` queries
- Independent per category / search / sort
- Reset to page 1 on filter change
- Previous / Next / Page number controls
- "View More" navigates to next page (never fetches all)

### States
Loading (skeleton) · Empty catalogue · No search results · Error with retry

---

## Product Details

- Product name, price, description, category
- Multi-image gallery with thumbnail strip
- Image switching & zoom/enlarge
- Availability status
- Add to Cart button
- URL: `/product/:slug`

---

## Shopping Cart

- Add / remove / adjust quantity (increment existing, no duplicates)
- Per-item: photo, name, price, quantity, line total
- Totals: item count, subtotal
- Persist cart IDs + quantities in `localStorage`
- Retrieve **live prices** from DB before order submission
- Handle unavailable products gracefully
- Empty state, responsive design
- **DM to Order** button
- Cart badge on header icon

---

## Order / DM-to-Order Flow

1. Customer clicks **DM to Order**
2. Frontend calls Supabase Edge Function → validates products, calculates totals, creates order transactionally
3. Order saved with status `awaiting_dm`
4. Formatted summary copied to clipboard
5. Confirmation screen shown with order code
6. Customer clicks **Open Instagram DM** → `https://ig.me/m/{INSTAGRAM_USERNAME}`
7. Customer pastes & sends message manually

### Order Summary Template

```
Hello! I would like to place an order.

Order ID: {ORDER_CODE}

Products:
1. {Name}
   Quantity: {qty}
   Unit Price: ₹{price}
   Subtotal: ₹{line_total}
   Product Link: {url}

Total Items: {count}
Product Subtotal: ₹{subtotal}

View My Complete Order:
{PUBLIC_ORDER_URL}
```

---

## Admin Panel

### Authentication
- Supabase Auth (email/password)
- Database-backed `admin_users` table for authorization
- No public registration

### Capabilities
- **Dashboard:** product count, category count, order counts by status
- **Products:** CRUD, search, filter, featured toggle, sort order, SKU, availability
- **Images:** multi-upload, reorder, set primary, delete, alt text, progress indicator
- **Categories:** manage name, slug, sort order, active toggle
- **Orders:** list with search/filter, status update, detail view with snapshots
- **Settings:** brand name, logo, tagline, Instagram username, currency code/locale, About Us content
- **CSV Import/Export:** validate before import, error reporting, duplicate SKU prevention

### Product Archiving
- Mark inactive/unavailable instead of deleting
- Archived products hidden from public catalogue
- Historical order data preserved

---

## Security Model

### Row Level Security (RLS)

| Table | Public Read | Public Write | Admin Full |
|-------|------------|-------------|-----------|
| categories | Active only | ✗ | ✓ |
| products | Available only | ✗ | ✓ |
| product_images | For available products | ✗ | ✓ |
| orders | Own order via public_token | Via Edge Function only | ✓ |
| order_items | Own order via public_token | Via Edge Function only | ✓ |
| admin_users | ✗ | ✗ | Self only |
| site_settings | Public settings only | ✗ | ✓ |

### Order Creation
- **Edge Function** (server-side) validates all inputs
- Backend calculates totals — never trusts frontend prices
- Transactional insert (order + items in one DB function)
- Service-role key stays server-side only
- Abuse protection: rate limiting, max request size, note length cap

---

## Performance Requirements

- Paginated queries (25/page, never all)
- Lazy-loaded images
- Debounced search (300ms)
- Category/settings caching
- Skeleton loaders
- No duplicate API calls
- Proper React cleanup (listeners, subscriptions)
- Supabase indexes on: `category_id`, `is_available`, `is_featured`, `sort_order`, `slug`, `created_at`

---

## Responsive Breakpoints

| Viewport | Layout |
|----------|--------|
| Desktop (≥1024px) | 3-column editorial masonry, full header |
| Tablet (768–1023px) | 2-column grid, compact nav |
| Mobile (<768px) | 1–2 column, hamburger menu, horizontal category scroll |

---

## Accessibility

- Semantic HTML (`<nav>`, `<main>`, `<article>`, `<button>`)
- Descriptive `alt` text on all images
- Keyboard navigation & visible focus states
- Colour contrast compliance
- Form labels & error messages
- Loading indicators & empty states

---

## Out of Scope

- Payment gateways (Razorpay, Stripe, etc.)
- Customer accounts / registration / login
- Shipping & delivery tracking
- Inventory quantity management
- Instagram Messaging API
- AI chatbot / recommendation engine

---

## Acceptance Criteria

1. Products display from Supabase (not hardcoded)
2. Category filtering works (All, Earrings, Necklace, Bracelet, Ring)
3. Search works
4. Sorting works (5 options)
5. Pagination: exactly 25/page with correct controls
6. Product images display correctly
7. Multi-image galleries work
8. Product detail pages work with slug URLs
9. Add to Cart works
10. Quantity adjustments work
11. Remove from cart works
12. Cart persists on refresh (localStorage)
13. Cart subtotal is accurate
14. Orders stored correctly in Supabase (Edge Function)
15. Backend calculates all totals
16. Order items preserve price/product snapshots
17. Order summary generated correctly
18. Clipboard copy works (with manual fallback)
19. Instagram DM link opens correct account
20. Customer can paste & send order
21. Public order links show only their order
22. Admin auth works
23. Unauthorized users blocked from admin
24. Admin can CRUD products
25. Admin can manage multiple images per product
26. Admin can manage categories
27. Admin can CSV import/export
28. Admin can view & update orders
29. Admin can change brand settings
30. Full responsive design (desktop → mobile)
