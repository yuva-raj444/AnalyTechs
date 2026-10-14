# Causal Analytics — User Analytics Application

A production-minded full-stack user analytics application built for the CausalFunnel Full Stack Engineer assignment.

## Stack

- Next.js 16 + TypeScript — dashboard
- Fastify + TypeScript — event/API service
- MongoDB — event storage and aggregation
- Vanilla TypeScript — embeddable tracking SDK
- Tailwind CSS — UI styling
- Zod — runtime validation
- Pino — structured logging
- Vitest — API/domain tests
- Playwright — browser E2E tests
- pnpm + Turborepo — monorepo

## Features

- Automatic `page_view` tracking
- Click tracking with viewport-relative x/y coordinates
- Persistent anonymous session ID using first-party localStorage
- Batched event delivery with `sendBeacon` fallback
- Session list with event counts and last activity
- Session journey / event timeline
- Page-level click heatmap with normalized coordinates
- API validation, CORS, rate limiting, security headers, health endpoint
- MongoDB indexes designed for the required queries
- Demo website for generating realistic traffic

## Local setup

Requirements: Node.js 20+, pnpm 10+, MongoDB 7+ or MongoDB Atlas.

```bash
pnpm install
cp .env.example .env
pnpm dev
```

Open:

- Dashboard: http://localhost:3000
- API: http://localhost:4000
- Demo site: http://localhost:5173
- API health: http://localhost:4000/health

## Production deployment

Deploy `apps/dashboard` to Vercel and `apps/api` to Render, Railway, Fly.io, Azure Container Apps, or another Node-compatible platform. Use MongoDB Atlas for production storage. Deploy `packages/tracker` as a static bundle through the same API/domain or a CDN.

Set the production environment variables from `.env.example` and restrict `CORS_ORIGIN` to the dashboard/demo origins actually used.

## Tracking script

The built SDK exposes a tiny browser API:

```html
<script src="https://YOUR_API_HOST/tracker.js" data-project-id="your-project"></script>
```

It tracks the initial page view and clicks. The SDK sends events to `POST /v1/events`.

## Event shape

```json
{
  "projectId": "demo-project",
  "sessionId": "sess_...",
  "type": "click",
  "page": {"url":"https://example.com/products","path":"/products"},
  "timestamp":"2026-10-13T12:00:00.000Z",
  "click":{"x":642,"y":381,"viewportWidth":1440,"viewportHeight":900}
}
```

## Assumptions / trade-offs

1. Session IDs are anonymous client-generated IDs; no personally identifiable information is collected.
2. Coordinates are viewport coordinates rather than DOM-element coordinates so the tracker remains framework-agnostic.
3. Events are immutable facts. Session summaries are derived using MongoDB aggregation rather than maintaining a second mutable session record.
4. The assignment only requires page views and clicks, so no fingerprinting, cookies, replay, or keystroke capture is included.
5. A production analytics product would add project authentication, retention policies, bot filtering, sampling, consent controls, and queue-based ingestion at larger scale.
