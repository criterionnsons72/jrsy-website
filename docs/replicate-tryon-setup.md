# Enabling real 2D try-on (Replicate)

The try-on module is provider-agnostic. A **mock** ships by default; switch to
**Replicate** for real AI 2D try-on (a Style Preview — never a fit guarantee).

## 1. Get credentials

1. Sign up at **replicate.com** and add a payment method (per-use billing).
2. Create an API token: **replicate.com/account/api-tokens** → keep it secret.
3. Pick a try-on model (e.g. **cuuupid/idm-vton** or an OOTDiffusion model) and
   copy its **version id** from the model's **API** tab.

## 2. Configure env (apps/api/.env)

The easy path — give the model **owner/name** and the app resolves its latest
version automatically (no version hash to copy):

```env
TRYON_PROVIDER=replicate
REPLICATE_API_TOKEN=r8_your_token_here
REPLICATE_TRYON_MODEL=cuuupid/idm-vton
```

To pin an exact version instead (recommended once you go live, so a new model
release can't change behaviour), also set:

```env
REPLICATE_TRYON_VERSION=<the model version id>
```

If `REPLICATE_TRYON_VERSION` is set it wins; otherwise the latest version of
`REPLICATE_TRYON_MODEL` is used.

Object storage (S3-compatible, e.g. Cloudflare R2 or MinIO) must also be
configured so the person photo and the generated result can be stored and
served via signed URLs. For R2, set `S3_REGION=auto`.

## 3. How it works

- The customer uploads a full-body photo → stored in object storage.
- The worker builds two short-lived URLs: the **person photo** and the
  **garment image** (the product's first image), and sends them to Replicate.
- Replicate returns a generated image; the worker **downloads it into our own
  storage** and serves it via a signed URL. Cost is tracked per job.

## 4. Adjusting the model

Input field names (`human_img`, `garm_img`, `garment_des`) match IDM-VTON. If
you choose a different model, update the field names in
`apps/api/src/modules/tryon/replicate/replicate-tryon.provider.ts` to match its
schema (see the model's card), or map them via env in a follow-up.

## 5. Safety & cost

- Every result keeps the **"Style Preview — not a guaranteed fit"** disclaimer.
- Usage/cost is visible in the admin analytics report.
- Check the model's **model-training terms** for privacy before going live.
- Keep the token out of git; set it via the secrets manager in production.
