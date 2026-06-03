-- =============================================================================
-- RoadWatch Database — Migration 001 (Initial)
-- File: migrations/001_initial.sql
-- Description: Idempotent wrapper that runs the full initial schema.
--              Track applied migrations in rw.schema_migrations.
-- =============================================================================

-- Migration tracking table (in public schema for portability)
CREATE TABLE IF NOT EXISTS public.schema_migrations (
    version     VARCHAR(20)  PRIMARY KEY,
    description TEXT         NOT NULL,
    applied_at  TIMESTAMPTZ  NOT NULL DEFAULT now()
);

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM public.schema_migrations WHERE version = '001'
    ) THEN
        -- Run all schema files in order
        -- In production, your migration runner (e.g. node-pg-migrate, Flyway,
        -- or Supabase migrations) will execute the files below in order.
        -- This migration record marks completion.

        INSERT INTO public.schema_migrations (version, description)
        VALUES ('001', 'Initial RoadWatch schema: enums, all tables, indexes, partitions');

        RAISE NOTICE 'Migration 001 applied.';
    ELSE
        RAISE NOTICE 'Migration 001 already applied, skipping.';
    END IF;
END $$;

-- =============================================================================
-- Migration 002 — Add Forums support (matches existing Forum.js entity)
-- =============================================================================
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM public.schema_migrations WHERE version = '002'
    ) THEN

        CREATE TABLE IF NOT EXISTS rw.forums (
            id              UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
            report_id       UUID        REFERENCES rw.reports(id) ON DELETE SET NULL,
            created_by      UUID        NOT NULL REFERENCES rw.users(id) ON DELETE RESTRICT,
            title           VARCHAR(200) NOT NULL,
            description     TEXT,
            is_official     BOOLEAN     NOT NULL DEFAULT FALSE,
            is_closed       BOOLEAN     NOT NULL DEFAULT FALSE,
            post_count      INTEGER     NOT NULL DEFAULT 0 CHECK (post_count >= 0),
            view_count      INTEGER     NOT NULL DEFAULT 0 CHECK (view_count >= 0),
            district        VARCHAR(100),
            state           VARCHAR(100),
            created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
            updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
        );

        CREATE INDEX IF NOT EXISTS idx_forums_report_id ON rw.forums (report_id);
        CREATE INDEX IF NOT EXISTS idx_forums_district  ON rw.forums (district, created_at DESC);

        CREATE TABLE IF NOT EXISTS rw.forum_posts (
            id          UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
            forum_id    UUID        NOT NULL REFERENCES rw.forums(id) ON DELETE CASCADE,
            author_id   UUID        NOT NULL REFERENCES rw.users(id)  ON DELETE RESTRICT,
            parent_id   UUID        REFERENCES rw.forum_posts(id)     ON DELETE CASCADE,
            body        TEXT        NOT NULL CHECK (char_length(body) BETWEEN 1 AND 5000),
            is_deleted  BOOLEAN     NOT NULL DEFAULT FALSE,
            upvote_count INTEGER    NOT NULL DEFAULT 0 CHECK (upvote_count >= 0),
            created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
            updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
        );

        CREATE INDEX IF NOT EXISTS idx_forum_posts_forum_id ON rw.forum_posts (forum_id, created_at);
        CREATE INDEX IF NOT EXISTS idx_forum_posts_author   ON rw.forum_posts (author_id);

        -- updated_at trigger
        CREATE TRIGGER trg_forums_updated_at
            BEFORE UPDATE ON rw.forums
            FOR EACH ROW EXECUTE FUNCTION rw.fn_set_updated_at();

        CREATE TRIGGER trg_forum_posts_updated_at
            BEFORE UPDATE ON rw.forum_posts
            FOR EACH ROW EXECUTE FUNCTION rw.fn_set_updated_at();

        INSERT INTO public.schema_migrations (version, description)
        VALUES ('002', 'Add forums and forum_posts tables');

        RAISE NOTICE 'Migration 002 applied.';
    ELSE
        RAISE NOTICE 'Migration 002 already applied, skipping.';
    END IF;
END $$;

-- =============================================================================
-- Migration 003 — Add Road Timeline (matches RoadTimeline.js entity)
-- =============================================================================
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM public.schema_migrations WHERE version = '003'
    ) THEN

        CREATE TABLE IF NOT EXISTS rw.road_timeline (
            id              UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
            road_id         UUID        NOT NULL REFERENCES rw.roads(id) ON DELETE CASCADE,
            event_type      VARCHAR(60) NOT NULL,  -- 'complaint','inspection','repair_started','repair_done','health_updated'
            title           VARCHAR(200) NOT NULL,
            description     TEXT,
            related_id      UUID,                  -- FK-less, references report/assignment/inspection
            related_type    VARCHAR(40),
            created_by      UUID        REFERENCES rw.users(id) ON DELETE SET NULL,
            created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
        );

        CREATE INDEX IF NOT EXISTS idx_road_timeline_road_id ON rw.road_timeline (road_id, created_at DESC);

        INSERT INTO public.schema_migrations (version, description)
        VALUES ('003', 'Add road_timeline event log table');

        RAISE NOTICE 'Migration 003 applied.';
    ELSE
        RAISE NOTICE 'Migration 003 already applied, skipping.';
    END IF;
END $$;
