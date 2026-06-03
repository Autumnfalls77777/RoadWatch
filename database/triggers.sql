-- =============================================================================
-- RoadWatch Database — Triggers
-- File: triggers.sql
-- Run AFTER schema.sql
-- =============================================================================

SET search_path = rw, public;

-------------------------------------------------------------------------------
-- Helper: auto-update updated_at on any row change
-------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION rw.fn_set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$;

-- Apply to all tables with updated_at
CREATE TRIGGER trg_users_updated_at
    BEFORE UPDATE ON rw.users
    FOR EACH ROW EXECUTE FUNCTION rw.fn_set_updated_at();

CREATE TRIGGER trg_reports_updated_at
    BEFORE UPDATE ON rw.reports
    FOR EACH ROW EXECUTE FUNCTION rw.fn_set_updated_at();

CREATE TRIGGER trg_roads_updated_at
    BEFORE UPDATE ON rw.roads
    FOR EACH ROW EXECUTE FUNCTION rw.fn_set_updated_at();

CREATE TRIGGER trg_contractors_updated_at
    BEFORE UPDATE ON rw.contractors
    FOR EACH ROW EXECUTE FUNCTION rw.fn_set_updated_at();

CREATE TRIGGER trg_repair_assignments_updated_at
    BEFORE UPDATE ON rw.repair_assignments
    FOR EACH ROW EXECUTE FUNCTION rw.fn_set_updated_at();

CREATE TRIGGER trg_inspections_updated_at
    BEFORE UPDATE ON rw.road_inspections
    FOR EACH ROW EXECUTE FUNCTION rw.fn_set_updated_at();

CREATE TRIGGER trg_comments_updated_at
    BEFORE UPDATE ON rw.report_comments
    FOR EACH ROW EXECUTE FUNCTION rw.fn_set_updated_at();


-------------------------------------------------------------------------------
-- Sync: keep reports.upvote_count in sync with report_votes
-------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION rw.fn_sync_vote_count()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        UPDATE rw.reports SET upvote_count = upvote_count + 1 WHERE id = NEW.report_id;
    ELSIF TG_OP = 'DELETE' THEN
        UPDATE rw.reports SET upvote_count = GREATEST(upvote_count - 1, 0) WHERE id = OLD.report_id;
    END IF;
    RETURN NULL; -- AFTER trigger, return value ignored
END;
$$;

CREATE TRIGGER trg_report_vote_count
    AFTER INSERT OR DELETE ON rw.report_votes
    FOR EACH ROW EXECUTE FUNCTION rw.fn_sync_vote_count();


-------------------------------------------------------------------------------
-- Sync: keep reports.comment_count in sync with report_comments
-------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION rw.fn_sync_comment_count()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        UPDATE rw.reports SET comment_count = comment_count + 1 WHERE id = NEW.report_id;
    ELSIF TG_OP = 'DELETE' THEN
        UPDATE rw.reports SET comment_count = GREATEST(comment_count - 1, 0) WHERE id = OLD.report_id;
    END IF;
    RETURN NULL;
END;
$$;

CREATE TRIGGER trg_report_comment_count
    AFTER INSERT OR DELETE ON rw.report_comments
    FOR EACH ROW EXECUTE FUNCTION rw.fn_sync_comment_count();


-------------------------------------------------------------------------------
-- Sync: when a report is resolved, set resolved_at automatically
-------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION rw.fn_set_resolved_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
    IF NEW.status = 'completed' AND OLD.status <> 'completed' THEN
        NEW.resolved_at = now();
    END IF;
    RETURN NEW;
END;
$$;

CREATE TRIGGER trg_report_resolved_at
    BEFORE UPDATE ON rw.reports
    FOR EACH ROW EXECUTE FUNCTION rw.fn_set_resolved_at();


-------------------------------------------------------------------------------
-- Sync: update roads.current_health_score when a new health record is inserted
-------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION rw.fn_update_road_current_health()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
    UPDATE rw.roads
    SET
        current_health_score = NEW.road_health_score,
        current_risk_score   = NEW.risk_score,
        updated_at           = now()
    WHERE id = NEW.road_id;
    RETURN NULL;
END;
$$;

CREATE TRIGGER trg_road_health_sync
    AFTER INSERT ON rw.road_health_history
    FOR EACH ROW EXECUTE FUNCTION rw.fn_update_road_current_health();


-------------------------------------------------------------------------------
-- Sync: update roads.total_complaints counter
-------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION rw.fn_sync_road_complaint_count()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
    IF TG_OP = 'INSERT' AND NEW.road_id IS NOT NULL THEN
        UPDATE rw.roads SET total_complaints = total_complaints + 1 WHERE id = NEW.road_id;
    ELSIF TG_OP = 'DELETE' AND OLD.road_id IS NOT NULL THEN
        UPDATE rw.roads
        SET total_complaints = GREATEST(total_complaints - 1, 0)
        WHERE id = OLD.road_id;
    END IF;
    RETURN NULL;
END;
$$;

CREATE TRIGGER trg_road_complaint_count
    AFTER INSERT OR DELETE ON rw.reports
    FOR EACH ROW EXECUTE FUNCTION rw.fn_sync_road_complaint_count();


-------------------------------------------------------------------------------
-- Citizen gamification: award points when a report is verified
-------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION rw.fn_award_citizen_points()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
DECLARE
    pts INTEGER := 0;
BEGIN
    -- Award points on status transitions
    IF NEW.verification_status = 'ai_verified'      AND OLD.verification_status <> 'ai_verified'      THEN pts := 5;  END IF;
    IF NEW.verification_status = 'officer_verified'  AND OLD.verification_status <> 'officer_verified'  THEN pts := 15; END IF;
    IF NEW.status = 'completed' AND OLD.status <> 'completed' THEN pts := pts + 25; END IF;

    IF pts > 0 THEN
        UPDATE rw.users
        SET
            points           = points + pts,
            verified_reports = CASE WHEN NEW.verification_status = 'officer_verified' THEN verified_reports + 1 ELSE verified_reports END,
            citizen_level    = CASE
                WHEN points + pts >= 500 THEN 'road_champion'
                WHEN points + pts >= 250 THEN 'road_inspector'
                WHEN points + pts >= 100 THEN 'road_guardian'
                WHEN points + pts >= 30  THEN 'road_reporter'
                ELSE 'road_scout'
            END
        WHERE id = NEW.citizen_id;
    END IF;

    RETURN NULL;
END;
$$;

CREATE TRIGGER trg_citizen_gamification
    AFTER UPDATE ON rw.reports
    FOR EACH ROW EXECUTE FUNCTION rw.fn_award_citizen_points();


-------------------------------------------------------------------------------
-- Security: prevent audit_logs rows from being deleted or updated
-------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION rw.fn_protect_audit_logs()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
    RAISE EXCEPTION 'Audit log records are immutable. DELETE/UPDATE on rw.audit_logs is not permitted.';
END;
$$;

CREATE TRIGGER trg_protect_audit_logs
    BEFORE UPDATE OR DELETE ON rw.audit_logs
    FOR EACH ROW EXECUTE FUNCTION rw.fn_protect_audit_logs();


-------------------------------------------------------------------------------
-- Security: prevent password_hash from being exposed in SELECT *
--           (enforce column-level reads through views in application layer)
-- Note: implemented via Row-Level Security policy in security.sql
-------------------------------------------------------------------------------


-------------------------------------------------------------------------------
-- Audit: auto-log report status changes
-------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION rw.fn_audit_report_status()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
    IF OLD.status IS DISTINCT FROM NEW.status
    OR OLD.verification_status IS DISTINCT FROM NEW.verification_status THEN
        INSERT INTO rw.audit_logs
            (user_id, action, entity_type, entity_id, old_value, new_value)
        VALUES (
            NEW.assigned_officer_id,  -- may be NULL for system-triggered changes
            'report.status_changed',
            'report',
            NEW.id,
            jsonb_build_object('status', OLD.status, 'verification_status', OLD.verification_status),
            jsonb_build_object('status', NEW.status, 'verification_status', NEW.verification_status)
        );
    END IF;
    RETURN NULL;
END;
$$;

CREATE TRIGGER trg_audit_report_status
    AFTER UPDATE ON rw.reports
    FOR EACH ROW EXECUTE FUNCTION rw.fn_audit_report_status();


-------------------------------------------------------------------------------
-- Audit: log repair assignment changes
-------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION rw.fn_audit_repair_status()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
    IF OLD.repair_status IS DISTINCT FROM NEW.repair_status THEN
        INSERT INTO rw.audit_logs
            (user_id, action, entity_type, entity_id, old_value, new_value)
        VALUES (
            NEW.engineer_id,
            'repair.status_changed',
            'repair_assignment',
            NEW.id,
            jsonb_build_object('repair_status', OLD.repair_status, 'contractor_id', OLD.contractor_id),
            jsonb_build_object('repair_status', NEW.repair_status, 'contractor_id', NEW.contractor_id)
        );
    END IF;
    RETURN NULL;
END;
$$;

CREATE TRIGGER trg_audit_repair_status
    AFTER UPDATE ON rw.repair_assignments
    FOR EACH ROW EXECUTE FUNCTION rw.fn_audit_repair_status();


-------------------------------------------------------------------------------
-- Brute-force protection: lock account after 5 failed login attempts
-------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION rw.fn_check_lockout()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
    IF NEW.login_attempts >= 5 AND NEW.locked_until IS NULL THEN
        NEW.locked_until = now() + INTERVAL '15 minutes';
    END IF;
    -- Reset attempts on successful login (login_attempts set to 0 by application)
    IF NEW.login_attempts = 0 THEN
        NEW.locked_until = NULL;
    END IF;
    RETURN NEW;
END;
$$;

CREATE TRIGGER trg_user_lockout
    BEFORE UPDATE OF login_attempts ON rw.users
    FOR EACH ROW EXECUTE FUNCTION rw.fn_check_lockout();
