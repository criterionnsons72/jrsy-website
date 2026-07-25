# Managing your catalog (Admin → Products)

The Admin panel lets you add, edit, hide, and delete products yourself — no code.

## 1. Give your account admin access (one time)

The admin area needs an admin role. Grant it to the account you registered with:

1. In **Railway → API service → Variables**, add:
   ```
   SEED_ADMIN_EMAIL = you@example.com     (the email you registered with)
   ```
2. Open the API service **Shell / Console** and run once:
   ```
   cd apps/api && npx prisma db seed
   ```
   You should see: `Granted Super Administrator to you@example.com.`
3. Sign out and sign back in on the website so your new role loads.

> You must have **registered** on the website first, otherwise there is no user
> to promote — register, then run the seed.

## 2. Add / edit products

1. Sign in, then open **`/admin`** → **Manage products** (or go to `/admin/products`).
2. Click **+ Add product** and fill in:
   - **Title**, **Category**, **Base price** (the “from” price before options)
   - **Description** (shown on the product page)
   - **Configuration schema** — keep the default so the garment is customisable
   - **Images** — click a **Quick add** placeholder, or paste an image URL
   - **Made-to-measure / Ready size** toggles
3. **Create product.** It appears in the catalog immediately.

Use **Hide** to take a product off the storefront without deleting it, **Edit** to
change details, and **Delete** to remove it (products already in orders are hidden
instead of deleted, to protect order history).

## Images

- Built-in placeholders live in `apps/web/public/products/` and are always available.
- For real photos, host the image somewhere public and paste its URL, **or** drop the
  files into `apps/web/public/products/` and reference them as `/products/your-file.jpg`.
- Full in-app photo **upload** needs object storage (Cloudflare R2) — see
  `docs/deploy-railway.md` §6. It can be added later.
