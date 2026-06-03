export const config = {
  port: Number(process.env.ROADWATCH_API_PORT || 8787),
  aiServiceUrl: process.env.ROADWATCH_AI_URL || 'http://127.0.0.1:8000',
  jwtSecret: process.env.ROADWATCH_JWT_SECRET || 'roadwatch-dev-secret',
  databaseUrl: process.env.DATABASE_URL || '',
};

export const roles = {
  citizen: ['complaints:create', 'complaints:read', 'complaints:validate', 'forums:write'],
  junior_officer: ['complaints:read', 'complaints:verify', 'complaints:reject', 'complaints:escalate', 'forums:moderate'],
  road_inspector: ['complaints:read', 'inspections:write', 'ai:read', 'roads:read'],
  executive_engineer: ['repairs:write', 'budgets:approve', 'contractors:assign', 'complaints:assign'],
  district_authority: ['analytics:district', 'authorities:read', 'contractors:read', 'budgets:read'],
  state_authority: ['analytics:state', 'authorities:rank', 'budgets:read'],
  contractor: ['repairs:read', 'repairs:update', 'complaints:assigned'],
  admin: ['admin:users', 'admin:authorities', 'admin:contractors', 'admin:complaints', 'admin:community'],
  super_admin: ['*'],
};
