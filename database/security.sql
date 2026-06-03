-- =============================================================================
-- RoadWatch Database — Security Configuration
-- File: security.sql
-- Run AFTER schema.sql
-- Implements: RLS, dedicated roles, sensitive column protection
-- =============================================================================

SET search_path = rw, public;

-------------------------------------------------------------------------------
-- 1. Database Roles (PostgreSQL-level, distinct from application RBAC)
-------------------------------------------------------------------------------

-- Application connection role (used by Node.js backend)
DO $$ BEGIN
    IF NOT EXISTS (SELECT FROM pg_roles WHERE rolname = 'rw_app') THEN
        CREATE ROLE rw_app WITH LOGIN PASSWORD 'CHANGE_IN_PRODUCTION';
    END IF;
END $$;

-- Read-only role for analytics/reporting tools
DO $$ BEGIN
    IF NOT EXISTS (SELECT FROM pg_roles WHERE rolname = 'rw_readonly') THEN
        CREATE ROLE rw_readonly WITH LOGIN PASSWORD 'CHANGE_IN_PRODUCTION';
    END IF;
END $$;

-- Migration role (runs schema changes)
DO $$ BEGIN
    IF NOT EXISTS (SELECT FROM pg_roles WHERE rolname = 'rw_migrate') THEN
        CREATE ROLE rw_migrate WITH LOGIN PASSWORD 'CHANGE_IN_PRODUCTION';
    END IF;
END $$;

-- Grant schema usage
GRANT USAGE ON SCHEMA rw TO rw_app, rw_readonly;

-- rw_app: full DML on all tables
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES    IN SCHEMA rw TO rw_app;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA rw TO rw_app;

-- rw_readonly: SELECT only, no password_hash
GRANT SELECT ON ALL TABLES IN SCHEMA rw TO rw_readonly;
-- Explicitly revoke password_hash from readonly role
REVOKE SELECT (password_hash) ON rw.users FROM rw_readonly;

-- rw_migrate: full DDL
GRANT ALL PRIVILEGES ON SCHEMA rw TO rw_migrate;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA rw TO rw_migrate;

-- Ensure future tables are also covered
ALTER DEFAULT PRIVILEGES IN SCHEMA rw
    GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO rw_app;
ALTER DEFAULT PRIVILEGES IN SCHEMA rw
    GRANT SELECT ON TABLES TO rw_readonly;

-- Revoke public from schema (defence in depth)
REVOKE ALL ON SCHEMA rw FROM PUBLIC;
REVOKE ALL ON SCHEMA public FROM PUBLIC;


-------------------------------------------------------------------------------
-- 2. Row-Level Security (RLS)
-------------------------------------------------------------------------------

-- USERS: citizens can only read their own row; officers+ can read all in their scope
ALTER TABLE rw.users ENABLE ROW LEVEL SECURITY;

CREATE POLICY users_self_read ON rw.users
    FOR SELECT
    USING (
        -- App passes current_setting('app.current_user_id') via SET LOCAL
        id::TEXT = current_setting('app.current_user_id', TRUE)
        OR current_setting('app.current_role', TRUE) IN (
            'junior_officer','road_inspector','executive_engineer',
            'district_authority','state_authority','super_admin'
        )
    );

CREATE POLICY users_self_write ON rw.users
    FOR UPDATE
    USING (id::TEXT = current_setting('app.current_user_id', TRUE))
    WITH CHECK (id::TEXT = current_setting('app.current_user_id', TRUE));

-- Super admin bypass
CREATE POLICY users_admin_all ON rw.users
    FOR ALL
    USING (current_setting('app.current_role', TRUE) = 'super_admin');


-- REPORTS: citizens see all public reports; sensitive columns restricted
ALTER TABLE rw.reports ENABLE ROW LEVEL SECURITY;

CREATE POLICY reports_public_read ON rw.reports
    FOR SELECT
    USING (TRUE);  -- All reports are publicly readable (by design)

CREATE POLICY reports_citizen_insert ON rw.reports
    FOR INSERT
    WITH CHECK (
        citizen_id::TEXT = current_setting('app.current_user_id', TRUE)
    );

CREATE POLICY reports_authority_modify ON rw.reports
    FOR UPDATE
    USING (
        current_setting('app.current_role', TRUE) IN (
            'junior_officer','road_inspector','executive_engineer',
            'district_authority','state_authority','super_admin'
        )
    );


-- AUDIT LOGS: only super_admin and rw_readonly can read; nobody can write directly
ALTER TABLE rw.audit_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY audit_logs_read ON rw.audit_logs
    FOR SELECT
    USING (
        current_setting('app.current_role', TRUE) = 'super_admin'
        OR current_user = 'rw_readonly'
        OR current_user = 'rw_app'   -- app writes via function, reads for display
    );

-- No UPDATE/DELETE possible (covered by trigger fn_protect_audit_logs)


-- USER SESSIONS: users can only see their own sessions
ALTER TABLE rw.user_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY sessions_own ON rw.user_sessions
    FOR ALL
    USING (user_id::TEXT = current_setting('app.current_user_id', TRUE));

CREATE POLICY sessions_admin ON rw.user_sessions
    FOR ALL
    USING (current_setting('app.current_role', TRUE) = 'super_admin');


-- NOTIFICATIONS: only recipient can read their own
ALTER TABLE rw.notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY notifications_own ON rw.notifications
    FOR ALL
    USING (recipient_id::TEXT = current_setting('app.current_user_id', TRUE));

CREATE POLICY notifications_admin ON rw.notifications
    FOR SELECT
    USING (current_setting('app.current_role', TRUE) = 'super_admin');


-------------------------------------------------------------------------------
-- 3. Secure View — users without password_hash (use in application layer)
-------------------------------------------------------------------------------
CREATE VIEW rw.v_users_safe AS
SELECT
    id, full_name, email, phone,
    role_id, profile_photo, district, state,
    account_status, email_verified, phone_verified,
    last_login, citizen_level, points, total_reports, verified_reports,
    notify_email, notify_sms, notify_whatsapp,
    bio, created_at, updated_at
FROM rw.users;

COMMENT ON VIEW rw.v_users_safe IS
    'Safe user view — password_hash is excluded. Always query through this view.';

GRANT SELECT ON rw.v_users_safe TO rw_app, rw_readonly;


-------------------------------------------------------------------------------
-- 4. Sensitive column protection — revoke direct access to password_hash
-------------------------------------------------------------------------------
-- rw_app uses the safe view or explicit column lists
REVOKE SELECT (password_hash) ON rw.users FROM rw_app;
-- Grant explicit access only for the login check function
-- (In practice, password comparison should be done via a SECURITY DEFINER function)


-------------------------------------------------------------------------------
-- 5. Secure password-check function (SECURITY DEFINER bypasses RLS)
-------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION rw.verify_password(p_email TEXT, p_password TEXT)
RETURNS TABLE(user_id UUID, role_name rw.role_level, account_status rw.account_status)
LANGUAGE plpgsql
SECURITY DEFINER   -- runs with owner's privileges, not caller's
STABLE
AS $$
BEGIN
    RETURN QUERY
    SELECT u.id, ro.name, u.account_status
    FROM rw.users u
    JOIN rw.roles ro ON ro.id = u.role_id
    WHERE u.email = p_email
      AND u.password_hash = crypt(p_password, u.password_hash)
      AND u.account_status = 'active'
      AND (u.locked_until IS NULL OR u.locked_until < now());
END;
$$;

-- Only rw_app may call this function
REVOKE ALL ON FUNCTION rw.verify_password(TEXT, TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION rw.verify_password(TEXT, TEXT) TO rw_app;


-------------------------------------------------------------------------------
-- 6. Invalidate expired sessions automatically (call via pg_cron or scheduler)
-------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION rw.cleanup_expired_sessions()
RETURNS INTEGER LANGUAGE plpgsql AS $$
DECLARE deleted INTEGER;
BEGIN
    DELETE FROM rw.user_sessions
    WHERE expires_at < now() OR is_valid = FALSE;
    GET DIAGNOSTICS deleted = ROW_COUNT;
    RETURN deleted;
END;
$$;
