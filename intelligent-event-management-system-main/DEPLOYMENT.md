# Deployment Guide — Agentic AI for Smart Event Management Operations

This document describes a recommended production deployment using Vercel (frontend) and Render (backend + Postgres). Adjust to your preferred cloud provider.

Prerequisites
- GitHub repository
- Render account (or alternative cloud provider)
- Vercel account for frontend
- Managed Postgres instance (Render Postgres, RDS, Cloud SQL)
- Secrets stored in platform secret manager (Render/Github/Vercel)

High-level steps
1. Provision Postgres and note `DATABASE_URL`.
2. Set up Render service for the backend:
   - Connect GitHub repo
   - Set build command: `npm ci` and start command: `node server.js`
   - Set environment variables from `.env.example` (do NOT paste secrets into repo)
   - Attach Postgres by setting `DATABASE_URL` secret
3. Deploy frontend to Vercel:
   - Connect GitHub repo, set build command `npm run build` and output directory `dist`
   - Configure `VITE_API_BASE_URL` and `VITE_SOCKET_URL` in Vercel environment settings
4. Configure domain names and HTTPS in both services.
5. Configure logging & monitoring (Render provides logs; add external monitoring like Sentry/Datadog).

Notes & Recommendations
- Replace the JSON store with Postgres for production. See `backend/lib/jsonStore.js` for migration points.
- Use GitHub Actions for CI (see `.github/workflows/ci-cd.yml`). Add registry publish steps if using Docker images.
- Store secrets in platform secret manager or GitHub Secrets — do not commit secrets.
- For Socket.IO, ensure the server uses a single shared adapter (Redis) if scaling to multiple instances.

Rollback
- Render offers previous deploys. Use their UI to rollback.
- For DB migrations, use non-destructive migrations and always create backups before applying.

Smoke test checklist
- Open frontend URL
- Login as admin (use secure admin account)
- Call `/api/health` and verify status
- Create a registration and check persistence
