# Enterprise Deployment & Operations Guide

## 1. System Architecture
```
                                 USERS
                                   │
                                   ▼
                       ┌───────────────────────┐
                       │       Frontend        │
                       │ React + Vite (Port 3000)
                       └───────────┬───────────┘
                                   │ HTTPS / REST / WSS
                                   ▼
                       ┌───────────────────────┐
                       │     Backend / API     │
                       │ Express + Node (Port 5002)
                       └───────────┬───────────┘
                                   │
         ┌─────────────────────────┼─────────────────────────┐
         ▼                         ▼                         ▼
  JSON Data Store           AI Agents Layer              Socket.IO
  (Thread-Safe Lock)        (7 Specialized)          (Real-Time Engine)
         │                         │                         │
         └─────────────────────────┼─────────────────────────┘
                                   ▼
                        Event Intelligence Engine
                                   │
                                   ▼
                       Agent Orchestration Layer
                                   │
                                   ▼
                       Alerts & Executive Dashboards
```

---

## 2. Environment Configuration

### Backend Environment Variables (`backend/.env`)
| Variable | Production Value | Description |
| :--- | :--- | :--- |
| `NODE_ENV` | `production` | Production runtime environment flag |
| `PORT` | `5002` | Express HTTP server port |
| `DATABASE_URL` | `./registrations.json` | Path to JSON database files |
| `JWT_SECRET` | `<SECURE_PRODUCTION_JWT_SECRET>` | Secret key for signing authorization tokens |
| `FRONTEND_URL` | `http://localhost:3000` | Allowed CORS frontend origin |
| `BACKEND_URL` | `http://localhost:5002` | Public backend API URL |
| `AI_API_KEY` | `<SECURE_OPENAI_API_KEY>` | LLM / AI service authentication key |
| `SMTP_HOST` | `smtp.gmail.com` | Email delivery SMTP server |

### Frontend Environment Variables (`frontend/.env`)
| Variable | Production Value | Description |
| :--- | :--- | :--- |
| `VITE_API_BASE_URL` | `http://localhost:5002` | API gateway endpoint |
| `VITE_SOCKET_URL` | `http://localhost:5002` | Socket.IO server endpoint |
| `VITE_APP_ENV` | `production` | Frontend application mode |

---

## 3. Database Backup & Recovery Procedure

### Automated Backup Creation
Run the automated snapshot tool to create a timestamped backup of all 15 JSON entity collections:
```bash
cd backend
node scripts/backup.js create
```
* **Storage Path**: `backend/backups/backup_<TIMESTAMP>/`

### Restore Procedure
List all available snapshot backups and restore a chosen snapshot:
```bash
# List snapshots
node scripts/backup.js list

# Restore snapshot
node scripts/backup.js restore backup_2026-09-05T10-16-41-926Z
```

---

## 4. Rollback Plan

If a production deployment issue occurs:
1. **Prevent Bad Release**: CI/CD pipeline automatically blocks deployments if any test in `backend/tests/*.test.js` or `backend/tests/smoke.test.js` fails.
2. **Rollback Source Code**: Revert to the last stable git commit (`git checkout <STABLE_TAG>`).
3. **Restore Database**: Execute `node backend/scripts/backup.js restore <LAST_STABLE_BACKUP>` to return entity records to the pre-deployment state.
4. **Restart Services**: Restart backend with `node server.js` and frontend with `npm run build`.

---

## 5. Monitoring & Health Endpoints

- **Health Check URL**: `GET http://localhost:5002/health`
- **Payload Structure**:
```json
{
  "status": "healthy",
  "environment": "production",
  "uptimeSeconds": 342,
  "components": {
    "database": { "status": "healthy", "userCount": 669 },
    "intelligenceEngine": { "status": "operational" },
    "orchestrationEngine": { "status": "operational" },
    "socketIO": { "status": "operational" }
  }
}
```
