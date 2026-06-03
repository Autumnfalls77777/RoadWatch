-- =============================================================================
-- RoadWatch Database — Seed Data
-- File: seed.sql
-- Inserts: roles, permissions, role_permissions, default super_admin
-- Run AFTER schema.sql
-- =============================================================================

SET search_path = rw, public;

-------------------------------------------------------------------------------
-- 1. Roles
-------------------------------------------------------------------------------
INSERT INTO rw.roles (name, display_name, description, level) VALUES
    ('citizen',            'Citizen',              'Public users who can report road hazards',               1),
    ('junior_officer',     'Junior Officer',        'Reviews and verifies reports',                          2),
    ('road_inspector',     'Road Inspector',        'Conducts field inspections and updates severity',        3),
    ('executive_engineer', 'Executive Engineer',    'Approves repairs and assigns contractors',              4),
    ('district_authority', 'District Authority',    'Monitors district-level analytics',                     5),
    ('state_authority',    'State Authority',       'Views state-wide dashboards',                           6),
    ('super_admin',        'Super Administrator',   'Full system access',                                    7)
ON CONFLICT (name) DO NOTHING;


-------------------------------------------------------------------------------
-- 2. Permissions  (module:action format)
-------------------------------------------------------------------------------
INSERT INTO rw.permissions (code, description, module) VALUES
    -- Reports module
    ('reports:create',            'Submit a new road report',                           'reports'),
    ('reports:read_own',          'Read own reports',                                   'reports'),
    ('reports:read_all',          'Read all reports',                                   'reports'),
    ('reports:verify',            'Mark a report as officer-verified',                   'reports'),
    ('reports:reject',            'Reject a report',                                    'reports'),
    ('reports:assign',            'Assign a report to an officer',                      'reports'),
    ('reports:update_status',     'Update report status',                               'reports'),
    -- Media module
    ('media:upload',              'Upload images/videos',                               'media'),
    -- Inspections module
    ('inspections:create',        'Create a field inspection',                          'inspections'),
    ('inspections:read',          'Read inspection records',                            'inspections'),
    -- Repairs module
    ('repairs:approve',           'Approve a repair request',                           'repairs'),
    ('repairs:assign_contractor', 'Assign a contractor to a repair',                    'repairs'),
    ('repairs:update_progress',   'Update repair progress',                             'repairs'),
    ('repairs:read',              'View repair assignments',                            'repairs'),
    -- Analytics module
    ('analytics:district',        'View district analytics',                            'analytics'),
    ('analytics:state',           'View state analytics',                               'analytics'),
    ('analytics:national',        'View national analytics',                            'analytics'),
    -- AI/ML module
    ('ml:view_analysis',          'View ML analysis results',                           'ml'),
    -- Notifications module
    ('notifications:read_own',    'Read own notifications',                             'notifications'),
    -- Governance module
    ('governance:view',           'Access public governance dashboard',                 'governance'),
    ('governance:export',         'Export governance reports',                          'governance'),
    -- Admin module
    ('admin:manage_users',        'Create/update/deactivate users',                     'admin'),
    ('admin:manage_roles',        'Assign and modify roles',                            'admin'),
    ('admin:view_audit_logs',     'Access audit logs',                                  'admin'),
    ('admin:manage_roads',        'Add/edit roads in the registry',                     'admin'),
    ('admin:manage_contractors',  'Add/edit contractors',                               'admin')
ON CONFLICT (code) DO NOTHING;


-------------------------------------------------------------------------------
-- 3. Role → Permission assignments
-------------------------------------------------------------------------------

-- Helper: grant permissions to a role by code array
DO $$
DECLARE
    v_role_id   SMALLINT;
    v_perm_id   SMALLINT;
    v_role_name TEXT;
    v_perm_code TEXT;
    role_perms  JSON := '{
        "citizen": [
            "reports:create","reports:read_own","media:upload",
            "notifications:read_own","governance:view"
        ],
        "junior_officer": [
            "reports:read_all","reports:verify","reports:reject",
            "inspections:read","ml:view_analysis","analytics:district",
            "notifications:read_own","governance:view"
        ],
        "road_inspector": [
            "reports:read_all","reports:update_status",
            "inspections:create","inspections:read",
            "ml:view_analysis","analytics:district",
            "notifications:read_own","governance:view"
        ],
        "executive_engineer": [
            "reports:read_all","reports:assign","reports:update_status",
            "repairs:approve","repairs:assign_contractor","repairs:update_progress","repairs:read",
            "inspections:read","ml:view_analysis","analytics:district",
            "admin:manage_contractors","notifications:read_own","governance:view","governance:export"
        ],
        "district_authority": [
            "reports:read_all","repairs:read","inspections:read",
            "ml:view_analysis","analytics:district","governance:view","governance:export",
            "notifications:read_own"
        ],
        "state_authority": [
            "reports:read_all","repairs:read","inspections:read",
            "ml:view_analysis","analytics:district","analytics:state",
            "governance:view","governance:export","notifications:read_own"
        ],
        "super_admin": [
            "reports:create","reports:read_own","reports:read_all","reports:verify",
            "reports:reject","reports:assign","reports:update_status",
            "media:upload","inspections:create","inspections:read",
            "repairs:approve","repairs:assign_contractor","repairs:update_progress","repairs:read",
            "analytics:district","analytics:state","analytics:national",
            "ml:view_analysis","notifications:read_own","governance:view","governance:export",
            "admin:manage_users","admin:manage_roles","admin:view_audit_logs",
            "admin:manage_roads","admin:manage_contractors"
        ]
    }'::JSON;
BEGIN
    FOR v_role_name IN SELECT json_object_keys(role_perms) LOOP
        SELECT id INTO v_role_id FROM rw.roles WHERE name = v_role_name::rw.role_level;
        FOR v_perm_code IN SELECT json_array_elements_text(role_perms->v_role_name) LOOP
            SELECT id INTO v_perm_id FROM rw.permissions WHERE code = v_perm_code;
            IF v_perm_id IS NOT NULL THEN
                INSERT INTO rw.role_permissions (role_id, permission_id)
                VALUES (v_role_id, v_perm_id)
                ON CONFLICT DO NOTHING;
            END IF;
        END LOOP;
    END LOOP;
END $$;


-------------------------------------------------------------------------------
-- 4. Default Super Admin user
--    Password: RoadWatch@Admin2025  (CHANGE IMMEDIATELY after first login)
-------------------------------------------------------------------------------
INSERT INTO rw.users (
    full_name, email, phone,
    password_hash,
    role_id, district, state, account_status, email_verified
)
SELECT
    'RoadWatch Super Admin',
    'admin@roadwatch.gov.in',
    '+910000000000',
    crypt('RoadWatch@Admin2025', gen_salt('bf', 12)),
    r.id,
    'Central',
    'National',
    'active',
    TRUE
FROM rw.roles r
WHERE r.name = 'super_admin'
ON CONFLICT (email) DO NOTHING;
