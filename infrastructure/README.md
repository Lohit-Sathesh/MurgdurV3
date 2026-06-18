# Murgdur Infrastructure

This folder contains everything needed to run Murgdur outside of local dev:
local Docker Compose for dependencies, Kubernetes manifests for a production
deployment, monitoring (Prometheus/Grafana/Loki/Tempo), CI/CD via GitHub
Actions + ArgoCD, and Cloudflare edge config.

Everything that can be done in code has been written. The remaining steps
below require accounts/credentials only you can create.

## What's already done

- `docker-compose.local.yml` — Postgres, Redis, Meilisearch, MinIO for local
  dev (already in use), plus an optional `full` profile that also builds and
  runs the backend/frontend containers.
- `backend/Dockerfile`, `frontend/Dockerfile` — multi-stage production images.
  Frontend uses Next.js `output: 'standalone'`.
- `backend/src/health` — `/health`, `/health/ready` (DB check), `/metrics`
  (Prometheus format via `prom-client`), all excluded from the global
  response wrapper so they return plain text/JSON as monitoring tools expect.
- `frontend/src/app/api/health` — `/api/health` for the frontend probe.
- `k8s/namespace.yaml`, `k8s/configmap.yaml`, `k8s/secrets-bridge.yaml` —
  namespace + non-secret config + a fully-documented secret template listing
  every env var the app needs.
- `k8s/backend/*`, `k8s/frontend/*` — Deployments (with resource limits,
  readiness/liveness probes wired to the health endpoints above), Services,
  and HorizontalPodAutoscalers.
- `k8s/backend/migration-job.yaml` — a `prisma migrate deploy` Job, wired as
  an ArgoCD PreSync hook so migrations run before each rollout.
- `k8s/pgbouncer-deployment.yaml` — PgBouncer pooler + Service, config driven
  entirely by `murgdur-secrets`.
- `k8s/redis`, `k8s/meilisearch` — Deployments with PersistentVolumeClaims for
  durable storage, plus a Meilisearch Ingress (so the browser can query search
  directly with a search-only key).
- `k8s/ingress.yaml`, `k8s/cluster-issuer.yaml` — nginx Ingress routing `/api`
  to the backend and everything else to the frontend, with automatic TLS via
  cert-manager + Let's Encrypt.
- `k8s/monitoring/*` — Prometheus, Grafana (with Loki/Tempo/Prometheus
  datasources and a starter dashboard pre-provisioned), Loki, and Tempo, each
  with their own Deployment/Service/PVC/ConfigMap. Grafana gets its own
  Ingress at `grafana.murgdur.example`.
- `argocd/application.yaml` — points at this repo, auto-syncs `k8s/` into the
  `murgdur` namespace.
- `github-actions/workflows/deploy.yaml` — on push to `main`: lint+build both
  apps, build & push Docker images to GHCR, then (if `KUBE_CONFIG` secret is
  set) run migrations and roll out the new images.
- `cloudflare/*.json` + `cloudflare/apply.sh` — WAF rules (block scrapers,
  challenge brute-force on auth endpoints, block cross-site admin API writes)
  and cache/page rules (cache static assets & media, bypass cache for
  `/api` and `/admin`, redirect `www` → apex), applied via the Cloudflare API.

## What you need to do

These all require accounts/credentials that only you can provision. Pick one
path for hosting (A) — everything else (B–E) is independent of which you pick.

### A. A Kubernetes cluster

You need *some* Kubernetes cluster reachable from the internet. Cheapest
realistic options:
- **DigitalOcean Kubernetes (DOKS)** or **Linode LKE** — simplest, ~$12-24/mo
  for a small node.
- **AWS EKS** — what the manifests assume (`ghcr.io` images, nginx ingress,
  cert-manager all work the same anywhere), but EKS itself costs more and is
  more complex to set up than DOKS/LKE.
- A single VM running **k3s** also works fine for this app's scale.

Once you have a cluster and `kubectl` pointed at it:
```bash
kubectl apply -f infrastructure/k8s/namespace.yaml
helm repo add ingress-nginx https://kubernetes.github.io/ingress-nginx
helm install ingress-nginx ingress-nginx/ingress-nginx -n ingress-nginx --create-namespace
helm repo add jetstack https://charts.jetstack.io
helm install cert-manager jetstack/cert-manager -n cert-manager --create-namespace --set installCRDs=true
kubectl apply -f infrastructure/k8s/cluster-issuer.yaml
```

### B. A managed Postgres database

The app needs a Postgres 16 instance reachable from the cluster (Neon,
Supabase, RDS, DigitalOcean Managed DB, etc. all work). Once created:
1. Run the existing migrations against it once: `DATABASE_URL=<prod-url> npx prisma migrate deploy` (from `backend/`), or let the `backend-migrate` Job do it on first deploy.
2. Fill `DATABASE_URL` (and `DB_HOST`/`DB_USER`/`DB_PASSWORD`/`DB_NAME`/`DB_PORT` if using the included PgBouncer) into the secret below.

### C. Cloudflare (DNS, CDN, R2 media storage, WAF)

1. **Add your domain to Cloudflare** (free plan is fine) and point its
   nameservers at Cloudflare.
2. **Create DNS records** once your cluster's ingress has a public IP/LB
   hostname:
   - `murgdur.example` → A/CNAME to the ingress load balancer
   - `grafana.murgdur.example` → same
   - `search.murgdur.example` → same
   - `media.murgdur.example` → CNAME to your R2 bucket's public domain (step 4)
   - Set all to "Proxied" (orange cloud) so the WAF/cache rules apply.
3. **Create an R2 bucket** (Cloudflare dashboard → R2 → Create bucket, name it
   `murgdur-media`). Generate an R2 API token (Account API token, with R2
   read/write) for `R2_ACCESS_KEY_ID` / `R2_SECRET_ACCESS_KEY`. Enable a public
   bucket domain or connect a custom domain `media.murgdur.example` to it —
   that's your `R2_PUBLIC_CDN_URL`.
4. **Apply the WAF + cache rules**:
   ```bash
   cd infrastructure/cloudflare
   CF_API_TOKEN=<zone-edit-token> CF_ZONE_ID=<zone-id> ./apply.sh
   ```
   (Both values come from the Cloudflare dashboard: zone ID is on the domain's
   Overview page; create an API token under My Profile → API Tokens with
   "Zone: Edit" permission scoped to this zone.)
5. Optionally add a **Rate Limiting rule** (Security → WAF → Rate limiting
   rules) for `/api/auth/login` and `/api/auth/register` — e.g. 10
   requests/minute per IP — the Cloudflare API for this is separate from the
   custom-rules API used by `apply.sh`.

### D. Secrets

Fill in `infrastructure/k8s/secrets-bridge.yaml` (or better, create the secret
directly with `kubectl create secret generic` using the command in that
file's header comment — don't commit real secrets to git). You'll need:

| Key | Where to get it |
|---|---|
| `DATABASE_URL` | From step B |
| `JWT_SECRET`, `JWT_REFRESH_SECRET`, `NEXTAUTH_SECRET` | Generate with `openssl rand -base64 32` |
| `R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY` | From step C.3 |
| `MEILISEARCH_API_KEY` | Generate with `openssl rand -hex 16`; this becomes the Meilisearch master key |
| `NEXT_PUBLIC_MEILISEARCH_SEARCH_KEY` | After Meilisearch is up, create a search-only key: `curl -X POST http://meilisearch:7700/keys -H "Authorization: Bearer <MEILISEARCH_API_KEY>" -H "Content-Type: application/json" -d '{"actions":["search"],"indexes":["products"],"expiresAt":null}'` |
| `SMTP_USER`, `SMTP_PASS` | A transactional email provider (e.g. an SMTP relay or Gmail app password) |
| `RAZORPAY_KEY_ID`, `RAZORPAY_KEY_SECRET`, `NEXT_PUBLIC_RAZORPAY_KEY_ID` | [Razorpay dashboard](https://dashboard.razorpay.com) → Settings → API Keys (use test keys until ready to go live) |
| `SENTRY_DSN`, `NEXT_PUBLIC_SENTRY_DSN` | Optional — create a free [Sentry](https://sentry.io) project per app if you want error tracking |
| `GRAFANA_ADMIN_PASSWORD` | Pick a password for the Grafana `admin` user |
| `DB_HOST`/`DB_PORT`/`DB_USER`/`DB_PASSWORD`/`DB_NAME` | Only if using `pgbouncer-deployment.yaml` — split from `DATABASE_URL` |

Also update the hostnames baked into `infrastructure/k8s/configmap.yaml`
(`murgdur.example`, `media.murgdur.example`, etc.) to your real domain.

### E. CI/CD wiring

1. In your GitHub repo, go to **Settings → Actions → General → Workflow
   permissions** and enable "Read and write permissions" so the workflow can
   push images to GHCR.
2. If you want GitHub Actions to also roll out the new images (instead of
   relying purely on ArgoCD auto-sync), add a repo secret `KUBE_CONFIG`
   containing your kubeconfig, base64-encoded: `cat ~/.kube/config | base64 -w0`.
3. Install ArgoCD on the cluster and apply `argocd/application.yaml` (the
   `repoURL` is already set to this repo).

## Deploying for the first time

```bash
kubectl apply -f infrastructure/k8s/namespace.yaml
kubectl apply -f infrastructure/k8s/configmap.yaml
# create murgdur-secrets per the instructions in secrets-bridge.yaml
kubectl apply -f infrastructure/k8s/secrets-bridge.yaml   # only if you've filled in real values
kubectl apply -f infrastructure/k8s/cluster-issuer.yaml
kubectl apply -f infrastructure/k8s -R
```
Then push to `main` to trigger the GitHub Actions build, or run
`docker build` + `kubectl set image` manually for the first rollout.
