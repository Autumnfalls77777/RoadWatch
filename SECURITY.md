# Security Policy

## Reporting a Vulnerability

If you discover a security vulnerability in RoadWatch, please **do not open a public GitHub issue**.

Instead, email the team at: **[prabaljaiswal69420@gmail.com]**

Please include:
- A description of the vulnerability
- Steps to reproduce
- Potential impact

We aim to respond within **48 hours** and will coordinate a fix and disclosure together.

---

## Security Measures Implemented

### Backend (Node.js / Express)

| Measure | Details |
|---|---|
| **Security Headers** | Every response includes `X-Content-Type-Options`, `X-Frame-Options: DENY`, `X-XSS-Protection`, `Referrer-Policy`, and `Strict-Transport-Security` (in production) |
| **CORS Restriction** | Only the origin specified in `ALLOWED_ORIGIN` env var is accepted. Defaults to `localhost:5173` for dev |
| **Rate Limiting** | Login endpoint blocks an IP after 10 failed attempts for 15 minutes (configurable via `LOGIN_MAX_ATTEMPTS` and `LOGIN_WINDOW_MS`) |
| **Password Verification** | Supports bcrypt hashed passwords. Falls back to plaintext only for legacy demo records. **Hash all passwords before deploying to production** |
| **Body Size Limit** | Request bodies over 1 MB are rejected with HTTP 413 (configurable via `MAX_BODY_BYTES`) |
| **Authentication on Mutations** | All `POST`, `PUT`, `PATCH`, `DELETE` entity requests require a valid Bearer token |
| **Privilege Field Protection** | Client-supplied `id`, `created_date`, `ai_confidence`, and `ai_verification_status` fields are stripped before persistence |
| **Error Message Scrubbing** | Internal `error.message` details are only returned when `NODE_ENV=development`. Production returns generic error codes only |

### ML Service (Python / FastAPI)

| Measure | Details |
|---|---|
| **CORS Restriction** | Only origins in `ALLOWED_ORIGINS` env var are accepted |
| **Upload Size Limits** | Images: max 10 MB (`MAX_IMAGE_BYTES`). Videos: max 100 MB (`MAX_VIDEO_BYTES`). Requests exceeding limits return HTTP 413 |
| **API Docs Hidden in Production** | `/docs`, `/redoc`, and `/openapi.json` return 404 when `APP_ENV=production` |
| **Error Scrubbing** | Exception details are suppressed in production; only generic messages are returned to clients |
| **File Type Validation** | Upload routes validate MIME type and file extension before processing |

---

## Known Limitations / Recommendations Before Production

> [!WARNING]
> The following items **must** be addressed before a production deployment:

### 1. Hash All Passwords with bcrypt
The demo data store contains plaintext passwords for testing. Before deploying:
```js
import bcrypt from 'bcryptjs';
const hash = await bcrypt.hash('your-plain-password', 12);
// Store hash in your user record
```

### 2. Replace Token-Based Auth with Real JWTs
Current tokens use the format `token_<userId>`, which are guessable. Replace with signed JWTs:
```js
import jwt from 'jsonwebtoken';
const token = jwt.sign({ userId: user.id, role: user.role }, process.env.ROADWATCH_JWT_SECRET, { expiresIn: '7d' });
```

### 3. Migrate from JSON File Store to PostgreSQL
The backend currently uses a JSON file as a data store. This is fine for demos but exposes you to:
- Race conditions on concurrent writes
- No row-level access control
- No audit log

Use the `database/schema.sql` with Supabase or a managed PostgreSQL instance.

### 4. Set `NODE_ENV=production` and `APP_ENV=production`
This enables HSTS, hides ML docs, and disables dev error details.

### 5. Use HTTPS
Always serve behind HTTPS in production (e.g., Vercel, Railway, or Nginx + Let's Encrypt).

### 6. Rotate `ROADWATCH_JWT_SECRET`
Use a randomly generated 256-bit secret:
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

---

## Dependency Audits

Run regularly to check for known vulnerabilities:

```bash
# Node.js
npm audit

# Python
pip install pip-audit
pip-audit
```
