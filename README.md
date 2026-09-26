# فروشگاه آریا — Persian mini e-commerce (test bed for a Persian AI sales agent)

A small, realistic Persian (RTL) online store built with React + TypeScript + Tailwind on
TanStack Start, backed by a PostgreSQL database (Supabase / Lovable Cloud).
It exists to provide real product, customer, inventory and order data for a future
Python FastAPI Persian AI sales agent.

No payment gateway, no SMS/email provider, no AI — those belong to later phases.

## Running the project

```bash
bun install      # or npm install
bun run dev      # http://localhost:8080
bun run build    # production build
```

Environment variables (already generated in `.env`, never commit secrets):

| Variable | Used by |
| --- | --- |
| `VITE_SUPABASE_URL` | browser client |
| `VITE_SUPABASE_PUBLISHABLE_KEY` | browser client (anon key, safe to expose) |
| `VITE_SUPABASE_PROJECT_ID` | tooling |

The service-role key is never used in the frontend.

## Project structure

```
src/
  routes/                     file-based routes (TanStack Router)
    index.tsx                 home page
    products.index.tsx        product listing (search / category / sort)
    products.$slug.tsx        product details
    cart.tsx                  shopping cart
    checkout.tsx              checkout form
    order-confirmation.tsx    confirmation of the order just placed
    track.tsx                 public order tracking + customer cancellation
    account.tsx               order history by phone number
    auth.tsx                  admin sign in / sign up
    _authenticated/           auth-gated subtree
      route.tsx               session gate (redirects to /auth)
      admin*.tsx              dashboard, products, categories, orders, customers
  services/                   all database access (catalog, orders, admin)
  components/store/           reusable storefront components
  components/ui/              shadcn primitives
  lib/                        formatting, cart state, order-status rules
  types/db.ts                 typed database entities
  integrations/supabase/      generated client + generated DB types
drizzle/migrations/           SQL migrations (schema + demo data)
public/images/                product & category images
```

UI never talks to the database directly: components call `src/services/*`, which call the
Data API or a database function.

## Database schema

| Table | Key columns |
| --- | --- |
| `categories` | id, name, slug (unique), description, image, active, created_at |
| `products` | id, category_id → categories, name, slug (unique), description, short_description, price (numeric), stock, sku (unique), image_url, active, created_at, updated_at |
| `customers` | id, full_name, phone (unique, normalized), email, created_at, updated_at |
| `orders` | id, order_number (unique, `ARYA-10001`…), customer_id → customers, status, subtotal, shipping_cost, total, shipping_address, notes, created_at, updated_at |
| `order_items` | id, order_id → orders, product_id → products, product_name, quantity, unit_price, total_price |
| `user_roles` | admin/staff roles, referenced by `has_role()` — roles are never stored on a profile |

Indexes: product name, product SKU, product category, order number, order status,
customer phone, customer email, order items by order/product.

`order_status` enum: `pending`, `confirmed`, `processing`, `shipped`, `delivered`, `cancelled`.

### Business rules (enforced in the database, not in React)

* Stock is decremented atomically at order creation; `stock = 0` cannot be ordered and
  quantity may never exceed available stock.
* Cancelling an order restores stock exactly once (trigger on status change).
* Shipped/delivered orders cannot be cancelled through the customer flow.
* Order numbers come from a sequence (`ARYA-` + `order_number_seq`) and are unique.
* SKU and slug are unique; prices are numeric, formatting happens only in the UI.
* Phone numbers are normalized to `09xxxxxxxxx` (`normalize_phone`), also accepting
  `+98`, `0098` and Persian digits.

### Database API (ready for the FastAPI AI agent)

Callable with the anon key through PostgREST RPC:

| Function | Purpose |
| --- | --- |
| `create_order(p_full_name, p_phone, p_email, p_shipping_address, p_notes, p_items jsonb)` | creates/reuses customer, creates order + items, reduces stock, returns full order |
| `get_order_by_number(p_order_number, p_phone)` | order lookup verified by phone |
| `cancel_order(p_order_number, p_phone)` | customer cancellation with stock restore |
| `get_customer_orders(p_phone)` | order history for a phone number |
| `normalize_phone(p_phone)` | phone normalization helper |

Plain table reads cover the rest of the agent's needs: product by name / SKU,
price, stock, products by category, customers, order items, totals.

### Security (RLS)

* `categories`, `products`: anonymous users can read only `active = true` rows.
* `customers`, `orders`, `order_items`: no anonymous access at all. Customers reach
  their own order only through the `SECURITY DEFINER` functions above, which require the
  order number **and** the matching phone number.
* Everything in the admin panel requires an authenticated user holding the `admin`
  role in `user_roles` (`is_admin()` / `has_role()`).
* The service-role key is never exposed to the frontend.

## Admin account

1. Open `/auth` and create an account with email + password.
2. The **first** account to sign in claims the `admin` role automatically
   (`claim_admin()` inserts the role only while no admin exists).
3. Further administrators are granted by inserting a row into `user_roles`
   (`user_id`, `role = 'admin'`).

The admin panel lives at `/admin`: dashboard, products (create/edit/delete, price, stock,
category, image), categories, orders (search by order number or phone, change status,
cancel) and customers (search, order history).

## Demo data

All demo data is inserted by the first migration in `drizzle/migrations/`
(`0000_arya_store_schema_and_seed.sql`): 5 categories, 16 products, 8 customers and 18
orders across every status, including low-stock, cancelled and delivered cases. Prices are
in تومان and names/addresses/phone numbers follow Iranian conventions.

## GitHub

The project is a standard Vite/TanStack app; connect it to GitHub from Lovable and push.
Only `.env` and build output are ignored.
