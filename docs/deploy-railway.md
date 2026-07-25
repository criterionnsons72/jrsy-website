# Deploy to Railway (beginner-friendly)

Railway can host the **API + PostgreSQL + Redis** together, deploying from GitHub.
The **web** app can go on Railway too, or on Vercel. Object storage (for try-on
uploads) uses **Cloudflare R2** and can be added later — the core store (catalog,
cart, checkout, orders) works without it.

> You do the clicks in the dashboards; this guide gives the exact values.

## 0. Accounts

- **railway.app** — sign up with GitHub.
- (later, for try-on) **Cloudflare R2** — S3-compatible object storage.

## 1. Create the project + databases

1. Railway → **New Project** → **Deploy from GitHub repo** → pick `jrsy-website`.
2. In the project, **+ New** → **Database → Add PostgreSQL**.
3. **+ New** → **Database → Add Redis**.

## 2. The API service

1. **+ New → GitHub Repo → jrsy-website** (a service).
2. Service **Settings**:
   - **Root Directory:** `/` (repo root)
   - **Dockerfile Path:** `apps/api/Dockerfile`
3. Service **Variables** (Railway injects DB/Redis refs):
   - `NODE_ENV=production`
   - `PORT=3001`
   - `API_PREFIX=api/v1`
   - `DATABASE_URL=${{Postgres.DATABASE_URL}}`
   - `REDIS_URL=${{Redis.REDIS_URL}}`
   - `JWT_ACCESS_SECRET=` → paste output of `openssl rand -base64 48`
   - `JWT_REFRESH_SECRET=` → another `openssl rand -base64 48`
   - `CORS_ORIGIN=` → the web URL (fill after step 3)
   - `TRYON_PROVIDER=mock` (switch to `replicate` later)
4. Deploy. The container runs DB migrations automatically on start, then serves.
   Health check: open `https://<api-domain>/api/v1/health` → `{ "status": "ok" }`.
   API docs: `https://<api-domain>/docs`.

## 3. The web service

1. **+ New → GitHub Repo → jrsy-website** (second service).
2. Settings:
   - **Root Directory:** `/`
   - **Dockerfile Path:** `apps/web/Dockerfile`
3. Variables:
   - `NODE_ENV=production`
   - `NEXT_PUBLIC_API_URL=` → the API's public URL (from step 2), e.g. `https://tailor-api.up.railway.app`
4. Deploy, then copy the web URL back into the **API's `CORS_ORIGIN`** and redeploy the API.

## 4. Seed reference data (once)

In the API service **Settings → Deploy → Custom Start Command** temporarily, or via
Railway's shell, run once:

```
npm run db:seed -w apps/api
```

This creates the 12 roles, demo categories, fabrics, and products. (Skip in a real
production catalog; add your own via the admin.)

## 5. Try it

Open the web URL → Register → browse the catalog → configure → cart → checkout.

## 6. Add real try-on (optional, later)

1. Create a **Cloudflare R2** bucket; get endpoint + access key + secret.
2. Add to the API variables: `S3_ENDPOINT`, `S3_REGION`, `S3_BUCKET`,
   `S3_ACCESS_KEY`, `S3_SECRET_KEY`.
3. Add `TRYON_PROVIDER=replicate`, `REPLICATE_API_TOKEN`, `REPLICATE_TRYON_VERSION`
   (see `docs/replicate-tryon-setup.md`).
4. Redeploy the API.

## Notes

- Secrets live only in Railway variables — never in git.
- Custom domain: add it in each service's **Settings → Networking**, then update
  `CORS_ORIGIN` / `NEXT_PUBLIC_API_URL`.
- Legal/consent copy is placeholder — **have a qualified lawyer review it** before a public launch.
