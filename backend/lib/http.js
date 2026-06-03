import { roles } from '../config.js';

// ─── Configurable CORS origin (set ALLOWED_ORIGIN in .env for production) ────
const ALLOWED_ORIGIN = process.env.ALLOWED_ORIGIN || 'http://localhost:5173';
const NODE_ENV = process.env.NODE_ENV || 'development';

// ─── Security headers sent on every response ──────────────────────────────────
const SECURITY_HEADERS = {
  'content-type': 'application/json',
  // CORS — restrict to configured origin only
  'access-control-allow-origin': ALLOWED_ORIGIN,
  'access-control-allow-methods': 'GET,POST,PUT,PATCH,DELETE,OPTIONS',
  'access-control-allow-headers': 'content-type,authorization',
  'access-control-max-age': '600',
  // Prevent MIME-type sniffing
  'x-content-type-options': 'nosniff',
  // Stop the API responses from being embedded in iframes
  'x-frame-options': 'DENY',
  // Basic XSS protection for older browsers
  'x-xss-protection': '1; mode=block',
  // Don't send referrer info outside origin
  'referrer-policy': 'strict-origin-when-cross-origin',
  // Only serve over HTTPS in production
  ...(NODE_ENV === 'production'
    ? { 'strict-transport-security': 'max-age=31536000; includeSubDomains' }
    : {}),
};

// ─── Body size limit (default 1 MB) ──────────────────────────────────────────
const MAX_BODY_BYTES = parseInt(process.env.MAX_BODY_BYTES || String(1 * 1024 * 1024), 10);

export async function parseBody(req) {
  const chunks = [];
  let totalBytes = 0;

  for await (const chunk of req) {
    totalBytes += chunk.length;
    if (totalBytes > MAX_BODY_BYTES) {
      // Drain the stream so the connection stays clean
      req.resume();
      throw Object.assign(new Error('Request body too large'), { statusCode: 413 });
    }
    chunks.push(chunk);
  }

  const raw = Buffer.concat(chunks).toString('utf8');
  if (!raw) return {};
  try { return JSON.parse(raw); } catch { return {}; }
}

export function send(res, status, payload) {
  res.writeHead(status, SECURITY_HEADERS);
  res.end(JSON.stringify(payload));
}

export function userFromAuth(req, store) {
  const authHeader = req.headers.authorization || '';
  // Reject malformed headers early
  if (!authHeader.startsWith('Bearer ')) return null;
  const token = authHeader.slice(7).trim();
  if (!token || token.length > 512) return null;
  // Tokens are stored as `token_<userId>` in the demo store
  return store.users.find(u => `token_${u.id}` === token) || null;
}

export function can(user, permission) {
  if (!user) return false;
  const perms = roles[user.role] || [];
  return perms.includes('*') || perms.includes(permission);
}

export function requirePermission(req, res, store, permission) {
  const user = userFromAuth(req, store);
  if (!can(user, permission)) {
    // Don't reveal whether the user exists — use a generic message
    send(res, 403, { error: 'forbidden' });
    return null;
  }
  return user;
}

export function requireAuth(req, res, store) {
  const user = userFromAuth(req, store);
  if (!user) {
    send(res, 401, { error: 'unauthenticated' });
    return null;
  }
  return user;
}
