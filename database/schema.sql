-- =============================================================================
-- RoadWatch Database Schema
-- File: schema.sql
-- Description: Complete PostgreSQL schema for the RoadWatch AI road-safety
--              platform. Run this file once on a fresh database.
-- Compatible with: PostgreSQL 15+
-- =============================================================================

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";      -- UUID generation
CREATE EXTENSION IF NOT EXISTS "pgcrypto";        -- password hashing helpers
CREATE EXTENSION IF NOT EXISTS "postgis";         -- geo-spatial support (optional but recommended)
CREATE EXTENSION IF NOT EXISTS "pg_trgm";         -- trigram indexes for text search

-- Use a dedicated schema to avoid polluting public
CREATE SCHEMA IF NOT EXISTS rw;
SET search_path = rw, public;

-------------------------------------------------------------------------------
-- 0. ENUMS  (centralised, avoids magic strings everywhere)
-------------------------------------------------------------------------------

CREATE TYPE rw.role_level AS ENUM (
    'citizen',            -- L1
    'junior_officer',     -- L2
    'road_inspector',     -- L3
    'executive_engineer', -- L4
    'district_authority', -- L5
    'state_authority',    -- L6
    'super_admin'         -- L7
);

CREATE TYPE rw.account_status AS ENUM (
    'active', 'suspended', 'pending_verification', 'deactivated'
);

CREATE TYPE rw.report_status AS ENUM (
    'submitted', 'under_review', 'verified',
    'assigned', 'repair_in_progress', 'completed', 'rejected'
);

CREATE TYPE rw.report_type AS ENUM (
    'pothole', 'crack', 'waterlogging', 'broken_road',
    'missing_signage', 'unsafe_construction', 'drainage_issue', 'other'
);

CREATE TYPE rw.priority_level AS ENUM ('low', 'medium', 'high', 'critical');

CREATE TYPE rw.severity_level AS ENUM ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL');

CREATE TYPE rw.verification_status AS ENUM (
    'pending', 'ai_verified', 'officer_verified', 'rejected'
);

CREATE TYPE rw.media_type AS ENUM ('image', 'video', 'thumbnail');

CREATE TYPE rw.road_status AS ENUM (
    'excellent', 'good', 'moderate', 'poor', 'critical', 'under_repair', 'closed'
);

CREATE TYPE rw.road_type AS ENUM (
    'national_highway', 'state_highway', 'district_road', 'urban_road', 'rural_road'
);

CREATE TYPE rw.traffic_density AS ENUM ('low', 'medium', 'high', 'very_high');

CREATE TYPE rw.repair_status AS ENUM (
    'pending', 'approved', 'contractor_assigned', 'in_progress',
    'paused', 'completed', 'cancelled'
);

CREATE TYPE rw.notification_type AS ENUM (
    'report_verified', 'report_rejected', 'repair_assigned',
    'repair_started', 'repair_completed', 'authority_update',
    'system_alert', 'comment_reply', 'upvote_milestone'
);

CREATE TYPE rw.citizen_level AS ENUM (
    'road_scout', 'road_reporter', 'road_guardian', 'road_inspector', 'road_champion'
);


-------------------------------------------------------------------------------
-- 1. RBAC — roles · permissions · role_permissions
-------------------------------------------------------------------------------

CREATE TABLE rw.roles (
    id          SMALLSERIAL     PRIMARY KEY,
    name        rw.role_level   NOT NULL UNIQUE,
    display_name VARCHAR(60)    NOT NULL,
    description  TEXT,
    level        SMALLINT       NOT NULL CHECK (level BETWEEN 1 AND 7),
    created_at   TIMESTAMPTZ    NOT NULL DEFAULT now()
);

COMMENT ON TABLE rw.roles IS 'L1-L7 RBAC roles for the RoadWatch platform.';

CREATE TABLE rw.permissions (
    id          SMALLSERIAL  PRIMARY KEY,
    code        VARCHAR(80)  NOT NULL UNIQUE,  -- e.g. 'reports:verify'
    description TEXT,
    module      VARCHAR(40)  NOT NULL          -- e.g. 'reports', 'repairs', 'analytics'
);

COMMENT ON TABLE rw.permissions IS 'Granular permission codes grouped by module.';

CREATE TABLE rw.role_permissions (
    role_id       SMALLINT  NOT NULL REFERENCES rw.roles(id) ON DELETE CASCADE,
    permission_id SMALLINT  NOT NULL REFERENCES rw.permissions(id) ON DELETE CASCADE,
    granted_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
    PRIMARY KEY (role_id, permission_id)
);


-------------------------------------------------------------------------------
-- 2. USERS
-------------------------------------------------------------------------------

CREATE TABLE rw.users (
    id              UUID            PRIMARY KEY DEFAULT uuid_generate_v4(),
    full_name       VARCHAR(120)    NOT NULL,
    email           VARCHAR(254)    NOT NULL,
    phone           VARCHAR(20),
    password_hash   TEXT            NOT NULL,
    role_id         SMALLINT        NOT NULL REFERENCES rw.roles(id) ON DELETE RESTRICT,
    profile_photo   TEXT,                        -- URL to object storage
    district        VARCHAR(100),
    state           VARCHAR(100),
    account_status  rw.account_status NOT NULL DEFAULT 'pending_verification',
    email_verified  BOOLEAN         NOT NULL DEFAULT FALSE,
    phone_verified  BOOLEAN         NOT NULL DEFAULT FALSE,
    last_login      TIMESTAMPTZ,
    login_attempts  SMALLINT        NOT NULL DEFAULT 0,
    locked_until    TIMESTAMPTZ,                 -- brute-force lockout
    created_at      TIMESTAMPTZ     NOT NULL DEFAULT now(),
    updated_at      TIMESTAMPTZ     NOT NULL DEFAULT now(),

    -- Citizen gamification (only meaningful for L1)
    citizen_level   rw.citizen_level NOT NULL DEFAULT 'road_scout',
    points          INTEGER         NOT NULL DEFAULT 0 CHECK (points >= 0),
    total_reports   INTEGER         NOT NULL DEFAULT 0 CHECK (total_reports >= 0),
    verified_reports INTEGER        NOT NULL DEFAULT 0 CHECK (verified_reports >= 0),

    -- Notification preferences
    notify_email    BOOLEAN         NOT NULL DEFAULT TRUE,
    notify_sms      BOOLEAN         NOT NULL DEFAULT FALSE,
    notify_whatsapp BOOLEAN         NOT NULL DEFAULT FALSE,

    bio             TEXT,

    CONSTRAINT users_email_unique UNIQUE (email),
    CONSTRAINT users_email_format CHECK (email ~* '^[A-Za-z0-9._%+\-]+@[A-Za-z0-9.\-]+\.[A-Za-z]{2,}$'),
    CONSTRAINT users_phone_format CHECK (phone IS NULL OR phone ~ '^\+?[0-9]{7,15}$')
);

COMMENT ON TABLE rw.users IS 'All platform users across every role level.';
COMMENT ON COLUMN rw.users.locked_until IS 'Brute-force protection: account locked until this timestamp.';

-- Prevent login_attempts overflow from causing silent issues
CREATE INDEX idx_users_email          ON rw.users (email);
CREATE INDEX idx_users_role_district  ON rw.users (role_id, district);
CREATE INDEX idx_users_state          ON rw.users (state);
CREATE INDEX idx_users_account_status ON rw.users (account_status);


-------------------------------------------------------------------------------
-- 3. USER SESSIONS  (JWT refresh token store)
-------------------------------------------------------------------------------

CREATE TABLE rw.user_sessions (
    id              UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id         UUID        NOT NULL REFERENCES rw.users(id) ON DELETE CASCADE,
    refresh_token   TEXT        NOT NULL UNIQUE,   -- store hashed in production
    ip_address      INET,
    user_agent      TEXT,
    device_fingerprint TEXT,
    is_valid        BOOLEAN     NOT NULL DEFAULT TRUE,
    expires_at      TIMESTAMPTZ NOT NULL,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    last_used_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_sessions_user_id ON rw.user_sessions (user_id);
CREATE INDEX idx_sessions_token   ON rw.user_sessions (refresh_token);
CREATE INDEX idx_sessions_expiry  ON rw.user_sessions (expires_at) WHERE is_valid = TRUE;

COMMENT ON TABLE rw.user_sessions IS 'JWT refresh-token store with device tracking.';


-------------------------------------------------------------------------------
-- 4. ROADS
-------------------------------------------------------------------------------

CREATE TABLE rw.roads (
    id                  UUID            PRIMARY KEY DEFAULT uuid_generate_v4(),
    road_name           VARCHAR(200)    NOT NULL,
    road_code           VARCHAR(30)     UNIQUE,     -- e.g. NH-48, SH-22
    road_type           rw.road_type    NOT NULL DEFAULT 'urban_road',
    length_km           NUMERIC(8,2),
    district            VARCHAR(100)    NOT NULL,
    state               VARCHAR(100)    NOT NULL,
    latitude            NUMERIC(10,8),
    longitude           NUMERIC(11,8),
    -- Current aggregate health (denormalised for fast reads)
    current_health_score SMALLINT       NOT NULL DEFAULT 100 CHECK (current_health_score BETWEEN 0 AND 100),
    current_risk_score   SMALLINT       NOT NULL DEFAULT 0   CHECK (current_risk_score   BETWEEN 0 AND 100),
    road_status         rw.road_status  NOT NULL DEFAULT 'good',
    traffic_density     rw.traffic_density NOT NULL DEFAULT 'medium',
    construction_date   DATE,
    last_repair_date    DATE,
    authority_name      VARCHAR(150),
    allocated_budget    NUMERIC(14,2),
    spent_budget        NUMERIC(14,2)   NOT NULL DEFAULT 0,
    total_complaints    INTEGER         NOT NULL DEFAULT 0 CHECK (total_complaints >= 0),
    total_repairs       INTEGER         NOT NULL DEFAULT 0 CHECK (total_repairs >= 0),
    description         TEXT,
    created_at          TIMESTAMPTZ     NOT NULL DEFAULT now(),
    updated_at          TIMESTAMPTZ     NOT NULL DEFAULT now()
);

CREATE INDEX idx_roads_district    ON rw.roads (district);
CREATE INDEX idx_roads_state       ON rw.roads (state);
CREATE INDEX idx_roads_health      ON rw.roads (current_health_score);
CREATE INDEX idx_roads_district_health ON rw.roads (district, current_health_score);

COMMENT ON TABLE rw.roads IS 'Master road registry. Health scores are denormalised for fast dashboard reads.';


-------------------------------------------------------------------------------
-- 5. REPORTS
-------------------------------------------------------------------------------

CREATE TABLE rw.reports (
    id                  UUID                    PRIMARY KEY DEFAULT uuid_generate_v4(),
    citizen_id          UUID                    NOT NULL REFERENCES rw.users(id) ON DELETE RESTRICT,
    road_id             UUID                    REFERENCES rw.roads(id) ON DELETE SET NULL,
    title               VARCHAR(200)            NOT NULL,
    description         TEXT,
    location_name       VARCHAR(300),
    latitude            NUMERIC(10,8)           NOT NULL,
    longitude           NUMERIC(11,8)           NOT NULL,
    address             TEXT,
    road_name           VARCHAR(200),
    district            VARCHAR(100)            NOT NULL,
    state               VARCHAR(100)            NOT NULL,
    report_type         rw.report_type          NOT NULL DEFAULT 'pothole',
    status              rw.report_status        NOT NULL DEFAULT 'submitted',
    priority            rw.priority_level       NOT NULL DEFAULT 'medium',
    verification_status rw.verification_status  NOT NULL DEFAULT 'pending',
    upvote_count        INTEGER                 NOT NULL DEFAULT 0 CHECK (upvote_count >= 0),
    comment_count       INTEGER                 NOT NULL DEFAULT 0 CHECK (comment_count >= 0),
    is_duplicate        BOOLEAN                 NOT NULL DEFAULT FALSE,
    duplicate_of        UUID                    REFERENCES rw.reports(id) ON DELETE SET NULL,
    forum_created       BOOLEAN                 NOT NULL DEFAULT FALSE,
    resolved_at         TIMESTAMPTZ,
    assigned_officer_id UUID                    REFERENCES rw.users(id) ON DELETE SET NULL,
    created_at          TIMESTAMPTZ             NOT NULL DEFAULT now(),
    updated_at          TIMESTAMPTZ             NOT NULL DEFAULT now()
);

CREATE INDEX idx_reports_citizen       ON rw.reports (citizen_id);
CREATE INDEX idx_reports_road_id       ON rw.reports (road_id);
CREATE INDEX idx_reports_status        ON rw.reports (status);
CREATE INDEX idx_reports_district      ON rw.reports (district);
CREATE INDEX idx_reports_state         ON rw.reports (state);
CREATE INDEX idx_reports_district_status ON rw.reports (district, status);
CREATE INDEX idx_reports_location      ON rw.reports (latitude, longitude);
CREATE INDEX idx_reports_created_at    ON rw.reports (created_at DESC);
-- Partial: only active reports need fast status lookups
CREATE INDEX idx_reports_active        ON rw.reports (status, district)
    WHERE status NOT IN ('completed', 'rejected');

COMMENT ON TABLE rw.reports IS 'Citizen-submitted road hazard reports (primary entity).';


-------------------------------------------------------------------------------
-- 6. REPORT MEDIA
-------------------------------------------------------------------------------

CREATE TABLE rw.report_media (
    id              UUID            PRIMARY KEY DEFAULT uuid_generate_v4(),
    report_id       UUID            NOT NULL REFERENCES rw.reports(id) ON DELETE CASCADE,
    media_type      rw.media_type   NOT NULL,
    file_url        TEXT            NOT NULL,   -- signed URL or CDN path
    thumbnail_url   TEXT,
    file_size_bytes INTEGER,
    mime_type       VARCHAR(80),
    original_filename TEXT,
    storage_key     TEXT,                       -- internal object-storage key
    is_primary      BOOLEAN         NOT NULL DEFAULT FALSE,
    sort_order      SMALLINT        NOT NULL DEFAULT 0,
    uploaded_at     TIMESTAMPTZ     NOT NULL DEFAULT now()
);

CREATE INDEX idx_media_report_id ON rw.report_media (report_id);

COMMENT ON TABLE rw.report_media IS 'Supports multiple images/videos per report.';


-------------------------------------------------------------------------------
-- 7. ML ANALYSIS
-------------------------------------------------------------------------------

CREATE TABLE rw.ml_analysis (
    id                  UUID            PRIMARY KEY DEFAULT uuid_generate_v4(),
    report_id           UUID            NOT NULL REFERENCES rw.reports(id) ON DELETE CASCADE,
    media_id            UUID            REFERENCES rw.report_media(id) ON DELETE SET NULL,
    -- Aggregate results from the FastAPI ML service
    pothole_count       SMALLINT        NOT NULL DEFAULT 0 CHECK (pothole_count >= 0),
    average_confidence  NUMERIC(5,4)    NOT NULL CHECK (average_confidence BETWEEN 0 AND 1),
    highest_severity    rw.severity_level NOT NULL DEFAULT 'LOW',
    road_health_score   SMALLINT        NOT NULL CHECK (road_health_score   BETWEEN 0 AND 100),
    risk_score          SMALLINT        NOT NULL CHECK (risk_score           BETWEEN 0 AND 100),
    -- Severity distribution (stored as jsonb for flexibility)
    severity_distribution JSONB         NOT NULL DEFAULT '{"LOW":0,"MEDIUM":0,"HIGH":0,"CRITICAL":0}',
    -- Raw payload from ML service for full auditability
    raw_response        JSONB,
    model_version       VARCHAR(40),
    processing_ms       INTEGER,        -- inference latency
    created_at          TIMESTAMPTZ     NOT NULL DEFAULT now()
);

CREATE INDEX idx_ml_analysis_report_id  ON rw.ml_analysis (report_id);
CREATE INDEX idx_ml_analysis_severity   ON rw.ml_analysis (highest_severity);
CREATE INDEX idx_ml_analysis_created_at ON rw.ml_analysis (created_at DESC);
-- GIN index on JSONB for flexible queries on severity_distribution
CREATE INDEX idx_ml_analysis_dist_gin   ON rw.ml_analysis USING GIN (severity_distribution);

COMMENT ON TABLE rw.ml_analysis IS 'Stores aggregate output from the YOLOv8 FastAPI ML service per media item.';


CREATE TABLE rw.ml_detections (
    id              UUID                PRIMARY KEY DEFAULT uuid_generate_v4(),
    analysis_id     UUID                NOT NULL REFERENCES rw.ml_analysis(id) ON DELETE CASCADE,
    confidence      NUMERIC(5,4)        NOT NULL CHECK (confidence BETWEEN 0 AND 1),
    severity        rw.severity_level   NOT NULL,
    -- Bounding box coordinates (pixels)
    x1              NUMERIC(10,2)       NOT NULL,
    y1              NUMERIC(10,2)       NOT NULL,
    x2              NUMERIC(10,2)       NOT NULL,
    y2              NUMERIC(10,2)       NOT NULL,
    width           NUMERIC(10,2)       NOT NULL,
    height          NUMERIC(10,2)       NOT NULL,
    area            NUMERIC(14,2)       NOT NULL
);

-- Partitioned by analysis_id hash bucket for scalability at 1M+ rows
CREATE INDEX idx_detections_analysis_id ON rw.ml_detections (analysis_id);
CREATE INDEX idx_detections_severity    ON rw.ml_detections (severity);

COMMENT ON TABLE rw.ml_detections IS 'Individual bounding-box detections from the ML service. Designed for 1M+ rows.';


-------------------------------------------------------------------------------
-- 8. ROAD HEALTH HISTORY
-------------------------------------------------------------------------------

CREATE TABLE rw.road_health_history (
    id              BIGSERIAL       PRIMARY KEY,
    road_id         UUID            NOT NULL REFERENCES rw.roads(id) ON DELETE CASCADE,
    road_health_score SMALLINT      NOT NULL CHECK (road_health_score BETWEEN 0 AND 100),
    risk_score      SMALLINT        NOT NULL CHECK (risk_score        BETWEEN 0 AND 100),
    pothole_count   INTEGER         NOT NULL DEFAULT 0,
    district        VARCHAR(100)    NOT NULL,   -- denormalised for partition pruning
    state           VARCHAR(100)    NOT NULL,
    source          VARCHAR(40)     NOT NULL DEFAULT 'ml_analysis', -- 'ml_analysis'|'inspection'|'manual'
    recorded_at     TIMESTAMPTZ     NOT NULL DEFAULT now()
)
PARTITION BY RANGE (recorded_at);

-- Create quarterly partitions (add more as needed)
CREATE TABLE rw.road_health_history_2025_q1 PARTITION OF rw.road_health_history
    FOR VALUES FROM ('2025-01-01') TO ('2025-04-01');
CREATE TABLE rw.road_health_history_2025_q2 PARTITION OF rw.road_health_history
    FOR VALUES FROM ('2025-04-01') TO ('2025-07-01');
CREATE TABLE rw.road_health_history_2025_q3 PARTITION OF rw.road_health_history
    FOR VALUES FROM ('2025-07-01') TO ('2025-10-01');
CREATE TABLE rw.road_health_history_2025_q4 PARTITION OF rw.road_health_history
    FOR VALUES FROM ('2025-10-01') TO ('2026-01-01');
CREATE TABLE rw.road_health_history_2026_q1 PARTITION OF rw.road_health_history
    FOR VALUES FROM ('2026-01-01') TO ('2026-04-01');
CREATE TABLE rw.road_health_history_2026_q2 PARTITION OF rw.road_health_history
    FOR VALUES FROM ('2026-04-01') TO ('2026-07-01');
CREATE TABLE rw.road_health_history_2026_q3 PARTITION OF rw.road_health_history
    FOR VALUES FROM ('2026-07-01') TO ('2026-10-01');
CREATE TABLE rw.road_health_history_2026_q4 PARTITION OF rw.road_health_history
    FOR VALUES FROM ('2026-10-01') TO ('2027-01-01');
-- Catch-all for future rows
CREATE TABLE rw.road_health_history_future PARTITION OF rw.road_health_history
    FOR VALUES FROM ('2027-01-01') TO (MAXVALUE);

CREATE INDEX idx_rhh_road_id    ON rw.road_health_history (road_id, recorded_at DESC);
CREATE INDEX idx_rhh_district   ON rw.road_health_history (district, recorded_at DESC);
CREATE INDEX idx_rhh_state      ON rw.road_health_history (state, recorded_at DESC);

COMMENT ON TABLE rw.road_health_history IS
    'Time-series of road health scores. Range-partitioned by quarter for efficient trend queries.';


-------------------------------------------------------------------------------
-- 9. ROAD INSPECTIONS
-------------------------------------------------------------------------------

CREATE TABLE rw.road_inspections (
    id                  UUID            PRIMARY KEY DEFAULT uuid_generate_v4(),
    report_id           UUID            NOT NULL REFERENCES rw.reports(id) ON DELETE RESTRICT,
    inspector_id        UUID            NOT NULL REFERENCES rw.users(id)   ON DELETE RESTRICT,
    notes               TEXT,
    condition_status    rw.road_status  NOT NULL,
    severity_assessment rw.severity_level NOT NULL DEFAULT 'LOW',
    latitude            NUMERIC(10,8),
    longitude           NUMERIC(11,8),
    photos              TEXT[],                 -- array of URLs for field photos
    inspection_date     DATE            NOT NULL DEFAULT CURRENT_DATE,
    created_at          TIMESTAMPTZ     NOT NULL DEFAULT now(),
    updated_at          TIMESTAMPTZ     NOT NULL DEFAULT now()
);

CREATE INDEX idx_inspections_report_id   ON rw.road_inspections (report_id);
CREATE INDEX idx_inspections_inspector   ON rw.road_inspections (inspector_id);
CREATE INDEX idx_inspections_date        ON rw.road_inspections (inspection_date DESC);

COMMENT ON TABLE rw.road_inspections IS 'L3 Road Inspector field inspection records.';


-------------------------------------------------------------------------------
-- 10. CONTRACTORS
-------------------------------------------------------------------------------

CREATE TABLE rw.contractors (
    id                  UUID            PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_name        VARCHAR(200)    NOT NULL,
    registration_number VARCHAR(80)     NOT NULL UNIQUE,
    contact_person      VARCHAR(120),
    email               VARCHAR(254),
    phone               VARCHAR(20),
    district            VARCHAR(100),
    state               VARCHAR(100),
    license_expiry      DATE,
    performance_rating  NUMERIC(3,2)    CHECK (performance_rating BETWEEN 0 AND 5),
    total_jobs_assigned INTEGER         NOT NULL DEFAULT 0,
    total_jobs_completed INTEGER        NOT NULL DEFAULT 0,
    is_active           BOOLEAN         NOT NULL DEFAULT TRUE,
    created_at          TIMESTAMPTZ     NOT NULL DEFAULT now(),
    updated_at          TIMESTAMPTZ     NOT NULL DEFAULT now(),

    CONSTRAINT contractor_email_format CHECK (
        email IS NULL OR email ~* '^[A-Za-z0-9._%+\-]+@[A-Za-z0-9.\-]+\.[A-Za-z]{2,}$'
    )
);

CREATE INDEX idx_contractors_district ON rw.contractors (district);
CREATE INDEX idx_contractors_active   ON rw.contractors (is_active);

COMMENT ON TABLE rw.contractors IS 'Pre-approved road repair contractors.';


-------------------------------------------------------------------------------
-- 11. REPAIR ASSIGNMENTS
-------------------------------------------------------------------------------

CREATE TABLE rw.repair_assignments (
    id                  UUID                PRIMARY KEY DEFAULT uuid_generate_v4(),
    report_id           UUID                NOT NULL REFERENCES rw.reports(id) ON DELETE RESTRICT,
    engineer_id         UUID                NOT NULL REFERENCES rw.users(id)   ON DELETE RESTRICT,
    contractor_id       UUID                REFERENCES rw.contractors(id)      ON DELETE SET NULL,
    repair_status       rw.repair_status    NOT NULL DEFAULT 'pending',
    priority            rw.priority_level   NOT NULL DEFAULT 'medium',
    cost_estimate       NUMERIC(12,2),
    final_cost          NUMERIC(12,2),
    estimated_start     DATE,
    estimated_completion DATE,
    actual_start        DATE,
    actual_completion   DATE,
    notes               TEXT,
    created_at          TIMESTAMPTZ         NOT NULL DEFAULT now(),
    updated_at          TIMESTAMPTZ         NOT NULL DEFAULT now(),

    CONSTRAINT repair_dates_valid CHECK (
        estimated_completion IS NULL OR estimated_start IS NULL
        OR estimated_completion >= estimated_start
    )
);

CREATE INDEX idx_repair_report_id    ON rw.repair_assignments (report_id);
CREATE INDEX idx_repair_engineer_id  ON rw.repair_assignments (engineer_id);
CREATE INDEX idx_repair_contractor_id ON rw.repair_assignments (contractor_id);
CREATE INDEX idx_repair_status       ON rw.repair_assignments (repair_status);

COMMENT ON TABLE rw.repair_assignments IS 'L4 Executive Engineer repair assignments and tracking.';


-------------------------------------------------------------------------------
-- 12. REPAIR UPDATES  (progress log)
-------------------------------------------------------------------------------

CREATE TABLE rw.repair_updates (
    id              UUID                PRIMARY KEY DEFAULT uuid_generate_v4(),
    assignment_id   UUID                NOT NULL REFERENCES rw.repair_assignments(id) ON DELETE CASCADE,
    updated_by      UUID                NOT NULL REFERENCES rw.users(id) ON DELETE RESTRICT,
    status          rw.repair_status    NOT NULL,
    notes           TEXT,
    photos          TEXT[],             -- progress photos
    created_at      TIMESTAMPTZ         NOT NULL DEFAULT now()
);

CREATE INDEX idx_repair_updates_assignment ON rw.repair_updates (assignment_id, created_at DESC);

COMMENT ON TABLE rw.repair_updates IS 'Append-only progress log for repair assignments.';


-------------------------------------------------------------------------------
-- 13. ACCIDENT RISK HISTORY
-------------------------------------------------------------------------------

CREATE TABLE rw.accident_risk_history (
    id              BIGSERIAL       PRIMARY KEY,
    road_id         UUID            NOT NULL REFERENCES rw.roads(id) ON DELETE CASCADE,
    risk_score      SMALLINT        NOT NULL CHECK (risk_score BETWEEN 0 AND 100),
    reason          TEXT,
    contributing_factors JSONB,     -- {pothole_count, severity, traffic_density, …}
    district        VARCHAR(100)    NOT NULL,
    state           VARCHAR(100)    NOT NULL,
    generated_at    TIMESTAMPTZ     NOT NULL DEFAULT now()
)
PARTITION BY RANGE (generated_at);

CREATE TABLE rw.accident_risk_history_2025 PARTITION OF rw.accident_risk_history
    FOR VALUES FROM ('2025-01-01') TO ('2026-01-01');
CREATE TABLE rw.accident_risk_history_2026 PARTITION OF rw.accident_risk_history
    FOR VALUES FROM ('2026-01-01') TO ('2027-01-01');
CREATE TABLE rw.accident_risk_history_future PARTITION OF rw.accident_risk_history
    FOR VALUES FROM ('2027-01-01') TO (MAXVALUE);

CREATE INDEX idx_arh_road_id     ON rw.accident_risk_history (road_id, generated_at DESC);
CREATE INDEX idx_arh_district    ON rw.accident_risk_history (district, generated_at DESC);
CREATE INDEX idx_arh_risk_score  ON rw.accident_risk_history (risk_score DESC, generated_at DESC);

COMMENT ON TABLE rw.accident_risk_history IS 'Time-series of accident risk scores. Partitioned by year.';


-------------------------------------------------------------------------------
-- 14. REPORT VOTES  (citizen upvotes)
-------------------------------------------------------------------------------

CREATE TABLE rw.report_votes (
    report_id   UUID        NOT NULL REFERENCES rw.reports(id) ON DELETE CASCADE,
    user_id     UUID        NOT NULL REFERENCES rw.users(id)   ON DELETE CASCADE,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
    PRIMARY KEY (report_id, user_id)   -- one vote per citizen per report
);

CREATE INDEX idx_votes_report_id ON rw.report_votes (report_id);
CREATE INDEX idx_votes_user_id   ON rw.report_votes (user_id);

COMMENT ON TABLE rw.report_votes IS 'Citizen upvotes. Unique constraint prevents multiple votes.';


-------------------------------------------------------------------------------
-- 15. REPORT COMMENTS
-------------------------------------------------------------------------------

CREATE TABLE rw.report_comments (
    id          UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
    report_id   UUID        NOT NULL REFERENCES rw.reports(id) ON DELETE CASCADE,
    author_id   UUID        NOT NULL REFERENCES rw.users(id)   ON DELETE RESTRICT,
    parent_id   UUID        REFERENCES rw.report_comments(id)  ON DELETE CASCADE,  -- threading
    body        TEXT        NOT NULL CHECK (char_length(body) BETWEEN 1 AND 2000),
    is_deleted  BOOLEAN     NOT NULL DEFAULT FALSE,  -- soft-delete
    created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_comments_report_id ON rw.report_comments (report_id, created_at);
CREATE INDEX idx_comments_author_id ON rw.report_comments (author_id);
CREATE INDEX idx_comments_parent_id ON rw.report_comments (parent_id);

COMMENT ON TABLE rw.report_comments IS 'Threaded comments on reports. Soft-delete preserves thread integrity.';


-------------------------------------------------------------------------------
-- 16. NOTIFICATIONS
-------------------------------------------------------------------------------

CREATE TABLE rw.notifications (
    id              UUID                    PRIMARY KEY DEFAULT uuid_generate_v4(),
    recipient_id    UUID                    NOT NULL REFERENCES rw.users(id) ON DELETE CASCADE,
    notification_type rw.notification_type  NOT NULL,
    title           VARCHAR(200)            NOT NULL,
    body            TEXT                    NOT NULL,
    related_entity  VARCHAR(40),            -- 'report' | 'repair' | 'road'
    related_id      UUID,                   -- FK-less for flexibility
    is_read         BOOLEAN                 NOT NULL DEFAULT FALSE,
    read_at         TIMESTAMPTZ,
    sent_email      BOOLEAN                 NOT NULL DEFAULT FALSE,
    sent_sms        BOOLEAN                 NOT NULL DEFAULT FALSE,
    created_at      TIMESTAMPTZ             NOT NULL DEFAULT now()
);

CREATE INDEX idx_notif_recipient        ON rw.notifications (recipient_id, is_read, created_at DESC);
CREATE INDEX idx_notif_unread           ON rw.notifications (recipient_id)
    WHERE is_read = FALSE;

COMMENT ON TABLE rw.notifications IS 'In-app notifications with email/SMS delivery tracking.';


-------------------------------------------------------------------------------
-- 17. AUDIT LOGS  (mandatory — every important action traced)
-------------------------------------------------------------------------------

CREATE TABLE rw.audit_logs (
    id              BIGSERIAL       PRIMARY KEY,
    user_id         UUID            REFERENCES rw.users(id) ON DELETE SET NULL,  -- NULL if system action
    action          VARCHAR(80)     NOT NULL,      -- e.g. 'report.verified', 'repair.assigned'
    entity_type     VARCHAR(60)     NOT NULL,      -- e.g. 'report', 'repair_assignment'
    entity_id       UUID            NOT NULL,
    old_value       JSONB,
    new_value       JSONB,
    ip_address      INET,
    user_agent      TEXT,
    metadata        JSONB,                         -- any extra context
    created_at      TIMESTAMPTZ     NOT NULL DEFAULT now()
)
PARTITION BY RANGE (created_at);

-- Monthly partitions for audit logs (high volume)
CREATE TABLE rw.audit_logs_2025_q1 PARTITION OF rw.audit_logs
    FOR VALUES FROM ('2025-01-01') TO ('2025-04-01');
CREATE TABLE rw.audit_logs_2025_q2 PARTITION OF rw.audit_logs
    FOR VALUES FROM ('2025-04-01') TO ('2025-07-01');
CREATE TABLE rw.audit_logs_2025_q3 PARTITION OF rw.audit_logs
    FOR VALUES FROM ('2025-07-01') TO ('2025-10-01');
CREATE TABLE rw.audit_logs_2025_q4 PARTITION OF rw.audit_logs
    FOR VALUES FROM ('2025-10-01') TO ('2026-01-01');
CREATE TABLE rw.audit_logs_2026_q1 PARTITION OF rw.audit_logs
    FOR VALUES FROM ('2026-01-01') TO ('2026-04-01');
CREATE TABLE rw.audit_logs_2026_q2 PARTITION OF rw.audit_logs
    FOR VALUES FROM ('2026-04-01') TO ('2026-07-01');
CREATE TABLE rw.audit_logs_2026_q3 PARTITION OF rw.audit_logs
    FOR VALUES FROM ('2026-07-01') TO ('2026-10-01');
CREATE TABLE rw.audit_logs_2026_q4 PARTITION OF rw.audit_logs
    FOR VALUES FROM ('2026-10-01') TO ('2027-01-01');
CREATE TABLE rw.audit_logs_future PARTITION OF rw.audit_logs
    FOR VALUES FROM ('2027-01-01') TO (MAXVALUE);

CREATE INDEX idx_audit_user_id     ON rw.audit_logs (user_id, created_at DESC);
CREATE INDEX idx_audit_entity      ON rw.audit_logs (entity_type, entity_id, created_at DESC);
CREATE INDEX idx_audit_action      ON rw.audit_logs (action, created_at DESC);

COMMENT ON TABLE rw.audit_logs IS
    'Immutable append-only audit trail for all important actions. Partitioned monthly.';
