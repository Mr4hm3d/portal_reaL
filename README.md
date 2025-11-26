# White-label Client Portal Monorepo (MVP scaffold)

This repository contains a self-hosted, white-label client portal built with **TypeScript**, **Next.js**, **Prisma/PostgreSQL**, **Redis/BullMQ**, and modular packages for core domains (auth, tickets, services, billing, files, wiki, payments, and more). Hungarian (`hu`) is the default language with English (`en`) as a secondary locale via `next-intl`.

## Monorepo layout

```
apps/
  web/       Next.js App Router UI with locale-based routing and API routes
  worker/    BullMQ worker bootstrap for PDF/email queues
packages/
  config/                Shared env parsing (Zod)
  core-domain/           Shared enums & language constants
  auth/, users/, ...     Domain packages (placeholders for now)
  ui/                    Shared UI primitives
prisma/                  Prisma schema targeting PostgreSQL
```

## Getting started

1. **Install dependencies** (Node 20+):
   ```bash
   npm install
   ```
   Local packages are linked via `file:` dependencies for compatibility with older npm versions, so installing from the repo root will wire the internal modules without requiring workspace protocol support.
2. **Copy environment** and edit values (defaults align with the local docker-compose stack):
   ```bash
   cp .env.example .env
   ```
3. **Start local services** (PostgreSQL, Redis, Mailhog SMTP catcher):
   ```bash
   docker-compose up -d
   ```
4. **Run Prisma** (after the DB is up):
   ```bash
   npx prisma generate
   npx prisma migrate dev --name init
   ```
5. **Seed baseline data** (creates admin/client users, starter service, wiki, ticket, billing request):
   ```bash
   npm run db:seed
   ```
   Default credentials (override via `SEED_*` env vars in `.env`):
   - Admin: `admin@example.com` / `ChangeMe123!`
   - Client: `client@example.com` / `Client123!`

6. **Start the web app**:
   ```bash
   npm run dev:web
   ```

7. **(Optional) Start the worker** for queued emails/PDF tasks:
    ```bash
    npm run dev:worker
    ```

### Localization
- Hungarian (`hu`) is the default locale with English (`en`) as a secondary option.
- A header locale switcher preserves the current path while toggling languages across the site.

### Authentication API (MVP)
- `POST /api/v1/auth/register` — public registration (controlled by `ALLOW_PUBLIC_REGISTRATION`).
- `POST /api/v1/auth/login` — email/password login.
- `POST /api/v1/auth/logout` — clear httpOnly session cookie.
- `POST /api/v1/auth/password-reset` — request a one-hour reset link emailed to the user.
- `POST /api/v1/auth/password-reset/confirm` — confirm token + new password to rotate credentials.
- `GET /api/v1/users/me` — return current authenticated user.
- `PATCH /api/v1/users/me` — update profile details or password (current password required to rotate).
- `GET /api/v1/users` — list users (admin).
- `POST /api/v1/users` — create a user with roles (admin).
- `GET /api/v1/users/:id` — fetch a single user (admin).
- `PATCH /api/v1/users/:id` — update user profile/roles/password (admin).

### Admin UI
- Admins see a **Users** link in the main navigation that opens `/[locale]/admin/users` for listing existing accounts and creating
  new users with localized language/role selection.
- Billing/admin roles can manage **Billing requests** from `/[locale]/billing`, including creating new pro forma requests for any
  client/service and using the detail page controls to send PDFs, mark requests as paid, or generate Billingo invoices after
  payment.
- Admins can manage **Service templates and client assignments** from `/[locale]/services`, creating reusable templates with
  pricing/metadata and cloning them for specific clients.

Sessions are signed JWT cookies using `SESSION_SECRET`, `SESSION_COOKIE_NAME`, and `SESSION_TTL_SECONDS`.

Security defaults:
- Authentication endpoints are rate limited per-IP using Redis with the configurable `RATE_LIMIT_WINDOW_MS` and `RATE_LIMIT_MAX_REQUESTS` environment variables (default 60 seconds / 15 requests).
- Global security headers (CSP, frame busting, referrer policy, MIME sniffing protections, and restrictive permissions policies) are emitted from `next.config.mjs` for all routes.

### Tickets API (MVP)
- `GET /api/v1/tickets` — list tickets (clients see their own; staff can filter by status/service/client/priority).
- `POST /api/v1/tickets` — create a ticket with optional service link.
- `GET /api/v1/tickets/:id` — fetch a single ticket (respecting ACL).
- `PATCH /api/v1/tickets/:id` — update status/assignee (admin/support).
- `GET /api/v1/tickets/:id/messages` — list messages for a ticket (ACL enforced).
- `POST /api/v1/tickets/:id/messages` — post a threaded reply on a ticket.

### Services API (MVP)
- `GET /api/v1/services` — list services; clients see their own, staff can filter by `clientId` or `type`.
- `POST /api/v1/services` — create a service template (admin).
- `GET /api/v1/services/:id` — fetch a single service if visible to the requester.
- `PATCH /api/v1/services/:id` — update a service template (admin).
- `POST /api/v1/services/:id/assign` — clone a template and assign it to a client (admin).

### Files
- `GET /api/v1/files` — list files visible to the requester; supports `ticketId` and `serviceId` filters.
- `POST /api/v1/files` — multipart upload; fields: `file`, optional `ticketId`, `serviceId`, and `visibility` (defaults to `PRIVATE`).
- `GET /api/v1/files/:id` — download a file after ACL checks (streams with `Content-Disposition`).
- `DELETE /api/v1/files/:id` — delete a file (owner or staff).

### Wiki
- `GET /api/v1/wiki` — list articles with optional `serviceId`, `visibility`, and `language` filters; clients see public/client-only docs tied to their services or global.
- `POST /api/v1/wiki` — create an article (admin/support).
- `GET /api/v1/wiki/:id` — fetch a single article respecting ACL.
- `PATCH /api/v1/wiki/:id` — update an article (admin/support).

### Billing requests (Pro Forma)
- `GET /api/v1/billing/requests` — list billing requests (clients see their own; billing/admin can filter by `clientId`, `serviceId`, or `status`).
- `POST /api/v1/billing/requests` — create a billing request for a client/service (billing/admin).
- `GET /api/v1/billing/requests/:id` — fetch a billing request if visible to the requester.
- `PATCH /api/v1/billing/requests/:id` — update status, invoice/pdf metadata, or due date/notes (billing/admin).
- `POST /api/v1/billing/requests/:id/pay` — start a Barion payment for a billing request, returning the Barion redirect URL and payment id.
- `POST /api/v1/billing/requests/:id/send` — generate a localized pro forma PDF, email it to the client, persist it to storage, and mark the request as `SENT` (billing/admin).

### Billingo invoices
- `POST /api/v1/integrations/billingo/create-invoice` — billing/admin only; create a Billingo invoice for a paid billing request and persist the PDF locally.
- `GET /api/v1/integrations/billingo/invoices/:id/pdf` — download a stored Billingo invoice PDF if the requester owns the billing request or is billing/admin.

### Payments & webhooks
- `POST /api/v1/webhooks/barion` — Barion webhook receiver. Expects `barion-signature` header; marks payment success/failure and updates the related billing request.

### Internationalization
- Default locale is `hu`; English is available under `/en`.
- Translation messages live in `apps/web/messages`. The middleware redirects to locale segments.

### Background workers
- `apps/worker` consumes BullMQ queues backed by Redis using `REDIS_URL`.
- Email delivery jobs are added via the shared `@portal/jobs` helpers; the worker invokes the existing Nodemailer pipeline. If the queue is unavailable, callers fall back to immediate sends to avoid losing critical notifications.
- Extend with processors for PDF generation and other external integrations as needed. Queue defaults include retries and backoff for resiliency.

### Email
- Configure `SMTP_HOST`, `SMTP_PORT`, and optional `SMTP_USER`/`SMTP_PASS` for Nodemailer delivery.
- Outbound emails default to the brand name (`BRANDING_NAME`) as the sender and fall back to `no-reply@<APP_BASE_URL host>` when no SMTP user is provided.

### File storage
- Files should be written under `FILE_STORAGE_ROOT` on the VPS. Add adapters later for MinIO/S3-compatible backends.

### Local stack
- `docker-compose.yml` brings up Postgres, Redis, and Mailhog on the default ports to match `.env.example`.
- Access captured emails at <http://localhost:8025> when using the default SMTP settings.
- Postgres credentials: `portal` / `portal`, database `client_portal`; Redis is unauthenticated for local dev.

### Branding
- Brand name and primary color come from environment variables (`BRANDING_NAME`, `BRANDING_PRIMARY_COLOR`). No hard-coded branding remains.

### Configuration for auth
- `SESSION_SECRET` must be at least 32 chars; configure cookie name/TTL via env.
- `ALLOW_PUBLIC_REGISTRATION` toggles whether unauthenticated users can sign up.

### Payments configuration
- `BARION_POSKEY` — required to start Barion payments (sandbox or production key).
- `BARION_API_URL` — override Barion API base (defaults to sandbox `https://api.test.barion.com/v2`).
- `BARION_PAYEE` — Barion payee account email.
- `BARION_WEBHOOK_SECRET` — shared secret for validating webhook signatures (HMAC-SHA256 over the raw request body).

### Billingo configuration
- `BILLINGO_API_KEY` — required to call the Billingo v3 API.
- `BILLINGO_API_URL` — optional override of the Billingo API base (defaults to `https://api.billingo.hu/v3`).

## Testing & linting

- Lint/test commands are defined in Turbo pipeline placeholders. Add package-level scripts as features mature.

## Notes

- Follow the product spec to flesh out each domain module, enforce RBAC, implement Barion/Billingo integrations, and add CI/CD for VPS deployments.
