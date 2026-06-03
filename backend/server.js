import http from 'node:http';
import { URL } from 'node:url';
import bcrypt from 'bcryptjs';
import { config } from './config.js';
import { id, mutateStore, readStore } from './lib/store.js';
import { parseBody, requirePermission, requireAuth, send, userFromAuth } from './lib/http.js';
import { buildAnalytics } from './services/analytics.js';
import { analyzeComplaint } from './services/ai.js';
import { ingestDemoDatasets, ingestUploadedDataset } from './services/datasets.js';

// ─── Brute-force rate limiter for /api/auth/login ────────────────────────────
// Tracks failed attempts per IP. After MAX_ATTEMPTS failures, blocks for WINDOW_MS.
const loginAttempts = new Map();
const MAX_ATTEMPTS = parseInt(process.env.LOGIN_MAX_ATTEMPTS || '10', 10);
const WINDOW_MS    = parseInt(process.env.LOGIN_WINDOW_MS   || String(15 * 60 * 1000), 10); // 15 min

function isRateLimited(ip) {
  const now = Date.now();
  const entry = loginAttempts.get(ip);
  if (!entry) return false;
  if (now - entry.windowStart > WINDOW_MS) {
    loginAttempts.delete(ip);
    return false;
  }
  return entry.count >= MAX_ATTEMPTS;
}

function recordFailedAttempt(ip) {
  const now  = Date.now();
  const entry = loginAttempts.get(ip);
  if (!entry || now - entry.windowStart > WINDOW_MS) {
    loginAttempts.set(ip, { count: 1, windowStart: now });
  } else {
    entry.count += 1;
  }
}

function clearAttempts(ip) {
  loginAttempts.delete(ip);
}

const entityMap = {
  users: 'users',
  complaints: 'complaints',
  roads: 'roads',
  contractors: 'contractors',
  authorities: 'authorities',
  budgets: 'budgets',
  repairs: 'repairs',
  forums: 'forums',
  notifications: 'notifications',
  ai: 'aiAnalyses',
  dataSources: 'dataSources',
  datasets: 'datasets',
  cities: 'cities',
  wards: 'wards',
};

const adminPermissions = {
  users: 'admin:users',
  authorities: 'admin:authorities',
  contractors: 'admin:contractors',
  complaints: 'admin:complaints',
  forums: 'admin:community',
};

const server = http.createServer(async (req, res) => {
  if (req.method === 'OPTIONS') return send(res, 204, {});
  const url = new URL(req.url, `http://${req.headers.host}`);
  const parts = url.pathname.split('/').filter(Boolean);

  try {
    if (url.pathname === '/health') return send(res, 200, { ok: true, service: 'roadwatch-api' });
    if (url.pathname === '/api/auth/login' && req.method === 'POST') return login(req, res);
    if (url.pathname === '/api/auth/me') return me(req, res);
    if (url.pathname === '/api/analytics') return analytics(req, res, url);
    if (url.pathname === '/api/sync/offline' && req.method === 'POST') return syncOffline(req, res);
    if (url.pathname === '/api/search') return search(req, res, url);
    if (url.pathname === '/api/budgets/summary') return budgetsSummary(req, res);
    if (url.pathname === '/api/datasets/demo-ingest' && req.method === 'POST') return demoDatasetIngest(req, res);
    if (url.pathname === '/api/datasets/upload' && req.method === 'POST') return uploadDataset(req, res);
    if (url.pathname === '/api/wards/rankings') return wardRankings(req, res, url);
    if (parts[0] === 'api' && parts[1] === 'admin') return admin(req, res, parts, url);
    if (parts[0] === 'api' && parts[1]) return entity(req, res, parts, url);
    send(res, 404, { error: 'not_found' });
  } catch (error) {
    // Never expose raw error messages to clients in any environment
    const isDev = (process.env.NODE_ENV || 'development') === 'development';
    send(res, error.statusCode === 413 ? 413 : 500, {
      error: error.statusCode === 413 ? 'payload_too_large' : 'server_error',
      ...(isDev ? { detail: error.message } : {}),
    });
  }
});

async function login(req, res) {
  // ── Rate-limit check ─────────────────────────────────────────────────────
  const ip = req.socket?.remoteAddress || 'unknown';
  if (isRateLimited(ip)) {
    return send(res, 429, { error: 'too_many_requests', message: 'Too many login attempts. Please wait 15 minutes.' });
  }

  const body = await parseBody(req);

  // ── Basic input validation ────────────────────────────────────────────────
  if (!body.email || !body.password ||
      typeof body.email !== 'string' || typeof body.password !== 'string' ||
      body.email.length > 254 || body.password.length > 128) {
    return send(res, 400, { error: 'invalid_input' });
  }

  const store = await readStore();
  // Normalise email to lowercase before lookup
  const user = store.users.find(
    u => u.email?.toLowerCase() === body.email.toLowerCase() && u.status !== 'suspended'
  );

  // ── Constant-time password check (bcrypt or legacy plaintext) ────────────
  const passwordValid = user
    ? (user.password?.startsWith('$2') 
        ? await bcrypt.compare(body.password, user.password)      // bcrypt hash
        : user.password === body.password)                         // legacy plaintext
    : (await bcrypt.hash('dummy', 8), false);                      // timing-safe dummy

  if (!user || !passwordValid) {
    recordFailedAttempt(ip);
    return send(res, 401, { error: 'invalid_credentials' });
  }

  clearAttempts(ip);
  send(res, 200, { token: `token_${user.id}`, user: publicUser(user) });
}

async function me(req, res) {
  const store = await readStore();
  const user = userFromAuth(req, store);
  if (!user) return send(res, 401, { error: 'unauthenticated' });
  send(res, 200, publicUser(user));
}

async function entity(req, res, parts, url) {
  const name = parts[1];
  const key = entityMap[name];
  if (!key) return send(res, 404, { error: 'unknown_entity' });
  const itemId = parts[2];

  if (req.method === 'GET') {
    const store = await readStore();
    if (itemId) {
      if (name === 'complaints' && parts[3] === 'ai') {
        const ai = store.aiAnalyses.find(x => x.complaint_id === itemId);
        if (!ai) return send(res, 404, { error: 'ai_analysis_not_found' });
        return send(res, 200, ai);
      }
      const row = store[key].find(x => x.id === itemId);
      if (!row) return send(res, 404, { error: 'not_found' });
      return send(res, 200, row);
    }

    let list = store[key] || [];
    if (url) {
      const country = url.searchParams.get('country');
      const state = url.searchParams.get('state');
      const district = url.searchParams.get('district');
      const ward = url.searchParams.get('ward');
      
      if (country) list = list.filter(x => x.country === country);
      if (state) list = list.filter(x => x.state === state);
      if (district) list = list.filter(x => x.district === district);
      if (ward) list = list.filter(x => x.ward === ward);
    }
    return send(res, 200, list);
  }

  // ── All mutation methods require authentication ───────────────────────────
  const store0 = await readStore();
  const actor = requireAuth(req, res, store0);
  if (!actor) return;

  return mutateStore(async store => {
    if (req.method === 'POST') {
      const body = await parseBody(req);
      // Strip any attempt to inject privileged fields from the client
      const { id: _id, created_date: _cd, updated_date: _ud, ai_confidence: _ac,
              ai_verification_status: _avs, ...safeBody } = body;
      const item = {
        id: body.id || id(name.slice(0, 3)),
        ...safeBody,
        created_date: new Date().toISOString(),
        updated_date: new Date().toISOString(),
      };
      store[key].unshift(item);
      if (name === 'complaints') await processComplaint(store, item);
      return send(res, 201, item);
    }
    const row = store[key].find(x => x.id === itemId);
    if (!row) return send(res, 404, { error: 'not_found' });
    if (req.method === 'PUT' || req.method === 'PATCH') {
      const body = await parseBody(req);
      // Prevent clients from overwriting system-managed fields
      const { id: _i, created_date: _c, ...safeBody } = body;
      Object.assign(row, safeBody, { updated_date: new Date().toISOString() });
      return send(res, 200, row);
    }
    if (req.method === 'DELETE') {
      store[key] = store[key].filter(x => x.id !== itemId);
      return send(res, 200, { ok: true });
    }
    return send(res, 405, { error: 'method_not_allowed' });
  });
}

async function admin(req, res, parts, url) {
  const store = await readStore();
  const module = parts[2];
  const permission = adminPermissions[module] || 'admin:users';
  const user = requirePermission(req, res, store, permission);
  if (!user) return;
  return entity(req, res, ['api', module, ...parts.slice(3)], url);
}

async function analytics(req, res, url) {
  const store = await readStore();
  send(res, 200, buildAnalytics(store, Object.fromEntries(url.searchParams.entries())));
}

async function search(req, res, url) {
  const q = (url.searchParams.get('q') || '').toLowerCase();
  const type = url.searchParams.get('type') || '';
  const store = await readStore();

  let results = [];
  if (type === 'road') {
    results = store.roads.filter(r => (r.name || r.road_name || '').toLowerCase().includes(q));
  } else if (type === 'ward') {
    results = store.wards.filter(w => `${w.name || w.ward_name || ''} ${w.ward_number || ''} ${w.city || ''}`.toLowerCase().includes(q));
  } else if (type === 'city') {
    results = store.cities.filter(c => `${c.name || ''} ${c.district || ''} ${c.state || ''}`.toLowerCase().includes(q));
  } else {
    results = [
      ...store.roads.filter(r => `${r.name || r.road_name || ''} ${r.ward || ''} ${r.city || ''}`.toLowerCase().includes(q)).map(r => ({ ...r, result_type: 'road' })),
      ...store.wards.filter(w => `${w.name || w.ward_name || ''} ${w.ward_number || ''} ${w.city || ''}`.toLowerCase().includes(q)).map(w => ({ ...w, result_type: 'ward' })),
      ...store.cities.filter(c => `${c.name || ''} ${c.district || ''} ${c.state || ''}`.toLowerCase().includes(q)).map(c => ({ ...c, result_type: 'city' })),
    ];
  }
  send(res, 200, results);
}

async function demoDatasetIngest(req, res) {
  const result = await mutateStore(async store => ingestDemoDatasets(store));
  send(res, 200, { datasets: result });
}

async function uploadDataset(req, res) {
  const body = await parseBody(req);
  const result = await mutateStore(async store => ingestUploadedDataset(store, body));
  send(res, 201, result);
}

async function wardRankings(req, res, url) {
  const store = await readStore();
  const filters = Object.fromEntries(url.searchParams.entries());
  const wards = store.wards
    .filter(row => ['country', 'state', 'district', 'city'].every(k => !filters[k] || row[k] === filters[k]))
    .sort((a, b) => (b.health_score || 0) - (a.health_score || 0))
    .map((ward, index) => ({ ...ward, rank: index + 1 }));
  send(res, 200, wards);
}

async function budgetsSummary(req, res) {
  const store = await readStore();
  const roads = store.roads || [];

  const totalAllocated = roads.reduce((sum, r) => sum + Number(r.allocated_budget || 0), 0);
  const totalSpent = roads.reduce((sum, r) => sum + Number(r.spent_budget || 0), 0);

  const contractorBreakdown = {};
  const authorityBreakdown = {};
  const fundingSourceBreakdown = {};

  roads.forEach(r => {
    const contractor = r.contractor_name || 'Unassigned';
    const authority = r.authority_name || 'Unassigned';
    const funding = r.funding_source || 'Other';

    contractorBreakdown[contractor] = (contractorBreakdown[contractor] || 0) + Number(r.allocated_budget || 0);
    authorityBreakdown[authority] = (authorityBreakdown[authority] || 0) + Number(r.allocated_budget || 0);
    fundingSourceBreakdown[funding] = (fundingSourceBreakdown[funding] || 0) + Number(r.allocated_budget || 0);
  });

  send(res, 200, {
    total_allocated: totalAllocated,
    total_spent: totalSpent,
    total_remaining: totalAllocated - totalSpent,
    contractor_breakdown: Object.entries(contractorBreakdown).map(([name, allocated]) => ({ name, allocated })),
    authority_breakdown: Object.entries(authorityBreakdown).map(([name, allocated]) => ({ name, allocated })),
    funding_source_breakdown: Object.entries(fundingSourceBreakdown).map(([name, allocated]) => ({ name, allocated })),
  });
}

async function syncOffline(req, res) {
  const body = await parseBody(req);
  const results = await mutateStore(async store => {
    const synced = [];
    for (const complaint of body.complaints || []) {
      const item = { id: complaint.id || id('cmp'), ...complaint, synced_at: new Date().toISOString() };
      store.complaints.unshift(item);
      await processComplaint(store, item);
      synced.push(item.id);
    }
    return synced;
  });
  send(res, 200, { synced: results });
}

async function processComplaint(store, complaint) {
  const road = store.roads.find(r => r.id === complaint.road_id) || identifyRoad(store, complaint);
  const authority = store.authorities.find(a => a.roads?.includes(road?.id)) || store.authorities[0];
  const contractor = store.contractors.find(c => c.assigned_roads?.includes(road?.id)) || store.contractors[0];
  Object.assign(complaint, {
    road_id: road?.id || complaint.road_id,
    road_name: road?.name || road?.road_name || complaint.road_name,
    authority: authority?.name || complaint.authority,
    contractor_id: contractor?.id || complaint.contractor_id,
    status: complaint.status || 'Submitted',
  });
  const ai = await analyzeComplaint({ complaint });
  store.aiAnalyses.unshift(ai);
  Object.assign(complaint, {
    ai_confidence: ai.confidence,
    ai_verification_status: 'AI Verified',
    detected_issue_type: ai.issue_type,
    severity_prediction: complaint.severity,
    duplicate_count: ai.duplicate_detection ? 1 : 0,
  });
}

function identifyRoad(store, complaint) {
  const q = `${complaint.location_text || ''} ${complaint.title || ''}`.toLowerCase();
  return store.roads.find(r => q.includes((r.name || r.road_name || '').toLowerCase().split(' ')[0]));
}

function publicUser(user) {
  const { password, ...safe } = user;
  return safe;
}

server.listen(config.port, () => {
  console.log(`RoadWatch API running on http://localhost:${config.port}`);
});
