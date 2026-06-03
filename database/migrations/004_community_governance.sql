-- =============================================================================
-- RoadWatch Database — Migration 004
-- Community Governance System
-- File: database/migrations/004_community_governance.sql
-- =============================================================================

SET search_path = rw, public;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM public.schema_migrations WHERE version = '004') THEN

    -- ─── ENUMs ────────────────────────────────────────────────────────────────
    CREATE TYPE rw.post_category AS ENUM (
      'ROAD_DAMAGE','REPAIR_DELAY','SAFETY_CONCERN','ACCIDENT_REPORT',
      'FLOODING','STREETLIGHT_FAILURE','TRAFFIC_ISSUE','GOVERNMENT_FEEDBACK','OTHER'
    );

    CREATE TYPE rw.vote_type AS ENUM ('UPVOTE','DOWNVOTE');

    CREATE TYPE rw.mod_action AS ENUM (
      'hide','unhide','lock','unlock','pin','unpin',
      'supervote','delete_media','suspend_user','flag'
    );

    -- ─── community_posts ──────────────────────────────────────────────────────
    CREATE TABLE rw.community_posts (
      id                UUID              PRIMARY KEY DEFAULT uuid_generate_v4(),
      road_id           UUID              NOT NULL REFERENCES rw.roads(id) ON DELETE CASCADE,
      author_id         UUID              NOT NULL REFERENCES rw.users(id) ON DELETE RESTRICT,
      title             VARCHAR(150)      NOT NULL CHECK (char_length(title) BETWEEN 3 AND 150),
      subject_category  rw.post_category  NOT NULL DEFAULT 'ROAD_DAMAGE',
      content           TEXT              NOT NULL CHECK (char_length(content) BETWEEN 10 AND 5000),
      -- Denormalised counters (trigger-maintained)
      upvote_count      INTEGER           NOT NULL DEFAULT 0 CHECK (upvote_count >= 0),
      downvote_count    INTEGER           NOT NULL DEFAULT 0 CHECK (downvote_count >= 0),
      comment_count     INTEGER           NOT NULL DEFAULT 0 CHECK (comment_count >= 0),
      view_count        INTEGER           NOT NULL DEFAULT 0 CHECK (view_count >= 0),
      -- Computed score cache (updated by trigger)
      score             NUMERIC(12,2)     NOT NULL DEFAULT 0,
      -- Authority actions
      is_pinned         BOOLEAN           NOT NULL DEFAULT FALSE,
      pinned_by         UUID              REFERENCES rw.users(id) ON DELETE SET NULL,
      pinned_at         TIMESTAMPTZ,
      is_supervoted     BOOLEAN           NOT NULL DEFAULT FALSE,
      supervoted_by     UUID              REFERENCES rw.users(id) ON DELETE SET NULL,
      supervoted_at     TIMESTAMPTZ,
      -- Moderation
      is_locked         BOOLEAN           NOT NULL DEFAULT FALSE,
      is_hidden         BOOLEAN           NOT NULL DEFAULT FALSE,
      -- Spam protection
      spam_score        SMALLINT          NOT NULL DEFAULT 0 CHECK (spam_score BETWEEN 0 AND 100),
      -- Trending flag (trigger/scheduler maintained)
      is_trending       BOOLEAN           NOT NULL DEFAULT FALSE,
      -- Full text search vector
      search_vector     TSVECTOR,
      created_at        TIMESTAMPTZ       NOT NULL DEFAULT now(),
      updated_at        TIMESTAMPTZ       NOT NULL DEFAULT now()
    );

    CREATE INDEX idx_cp_road_id       ON rw.community_posts (road_id, created_at DESC);
    CREATE INDEX idx_cp_author_id     ON rw.community_posts (author_id);
    CREATE INDEX idx_cp_score         ON rw.community_posts (is_hidden, is_pinned DESC, is_supervoted DESC, score DESC);
    CREATE INDEX idx_cp_trending      ON rw.community_posts (is_trending, created_at DESC) WHERE is_trending = TRUE;
    CREATE INDEX idx_cp_category      ON rw.community_posts (subject_category);
    CREATE INDEX idx_cp_search        ON rw.community_posts USING GIN (search_vector);

    -- ─── community_post_media ─────────────────────────────────────────────────
    CREATE TABLE rw.community_post_media (
      id          UUID            PRIMARY KEY DEFAULT uuid_generate_v4(),
      post_id     UUID            NOT NULL REFERENCES rw.community_posts(id) ON DELETE CASCADE,
      media_url   TEXT            NOT NULL,
      media_type  rw.media_type   NOT NULL DEFAULT 'image',
      file_size   INTEGER,
      mime_type   VARCHAR(80),
      sort_order  SMALLINT        NOT NULL DEFAULT 0,
      created_at  TIMESTAMPTZ     NOT NULL DEFAULT now()
    );

    CREATE INDEX idx_cpm_post_id ON rw.community_post_media (post_id);

    -- ─── community_post_votes ─────────────────────────────────────────────────
    CREATE TABLE rw.community_post_votes (
      id          UUID            PRIMARY KEY DEFAULT uuid_generate_v4(),
      post_id     UUID            NOT NULL REFERENCES rw.community_posts(id) ON DELETE CASCADE,
      user_id     UUID            NOT NULL REFERENCES rw.users(id) ON DELETE CASCADE,
      vote_type   rw.vote_type    NOT NULL,
      created_at  TIMESTAMPTZ     NOT NULL DEFAULT now(),
      updated_at  TIMESTAMPTZ     NOT NULL DEFAULT now(),
      CONSTRAINT  cpv_unique_vote UNIQUE (post_id, user_id)
    );

    CREATE INDEX idx_cpv_post_id ON rw.community_post_votes (post_id);
    CREATE INDEX idx_cpv_user_id ON rw.community_post_votes (user_id);

    -- ─── community_post_comments ──────────────────────────────────────────────
    CREATE TABLE rw.community_post_comments (
      id                UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
      post_id           UUID        NOT NULL REFERENCES rw.community_posts(id) ON DELETE CASCADE,
      author_id         UUID        NOT NULL REFERENCES rw.users(id) ON DELETE RESTRICT,
      parent_comment_id UUID        REFERENCES rw.community_post_comments(id) ON DELETE CASCADE,
      content           TEXT        NOT NULL CHECK (char_length(content) BETWEEN 1 AND 2000),
      upvote_count      INTEGER     NOT NULL DEFAULT 0 CHECK (upvote_count >= 0),
      is_hidden         BOOLEAN     NOT NULL DEFAULT FALSE,
      is_authority_reply BOOLEAN    NOT NULL DEFAULT FALSE,
      created_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
      updated_at        TIMESTAMPTZ NOT NULL DEFAULT now()
    );

    CREATE INDEX idx_cpc_post_id    ON rw.community_post_comments (post_id, created_at);
    CREATE INDEX idx_cpc_author_id  ON rw.community_post_comments (author_id);
    CREATE INDEX idx_cpc_parent_id  ON rw.community_post_comments (parent_comment_id);

    -- ─── community_post_views ─────────────────────────────────────────────────
    CREATE TABLE rw.community_post_views (
      id          BIGSERIAL   PRIMARY KEY,
      post_id     UUID        NOT NULL REFERENCES rw.community_posts(id) ON DELETE CASCADE,
      user_id     UUID        REFERENCES rw.users(id) ON DELETE SET NULL,
      ip_hash     TEXT,       -- SHA-256 of IP for anonymous counting
      viewed_at   TIMESTAMPTZ NOT NULL DEFAULT now()
    );

    CREATE INDEX idx_cpv2_post_id ON rw.community_post_views (post_id, viewed_at DESC);

    -- ─── community_moderation_logs ────────────────────────────────────────────
    CREATE TABLE rw.community_moderation_logs (
      id            BIGSERIAL       PRIMARY KEY,
      post_id       UUID            NOT NULL REFERENCES rw.community_posts(id) ON DELETE CASCADE,
      moderator_id  UUID            NOT NULL REFERENCES rw.users(id) ON DELETE RESTRICT,
      action        rw.mod_action   NOT NULL,
      reason        TEXT,
      created_at    TIMESTAMPTZ     NOT NULL DEFAULT now()
    );

    CREATE INDEX idx_cml_post_id ON rw.community_moderation_logs (post_id, created_at DESC);
    CREATE INDEX idx_cml_mod_id  ON rw.community_moderation_logs (moderator_id);

    -- ─── Rate limiting table ──────────────────────────────────────────────────
    CREATE TABLE rw.community_rate_limits (
      user_id       UUID        NOT NULL REFERENCES rw.users(id) ON DELETE CASCADE,
      action        VARCHAR(30) NOT NULL,  -- 'post','comment','vote'
      window_start  TIMESTAMPTZ NOT NULL,  -- hour or day bucket
      window_type   VARCHAR(10) NOT NULL,  -- 'hour','day'
      count         INTEGER     NOT NULL DEFAULT 1,
      PRIMARY KEY (user_id, action, window_type, window_start)
    );

    -- ─── Triggers for community_posts ─────────────────────────────────────────

    -- Auto update_at
    CREATE TRIGGER trg_community_posts_updated_at
      BEFORE UPDATE ON rw.community_posts
      FOR EACH ROW EXECUTE FUNCTION rw.fn_set_updated_at();

    CREATE TRIGGER trg_community_comments_updated_at
      BEFORE UPDATE ON rw.community_post_comments
      FOR EACH ROW EXECUTE FUNCTION rw.fn_set_updated_at();

    -- Score cache trigger
    CREATE OR REPLACE FUNCTION rw.fn_recalculate_post_score()
    RETURNS TRIGGER LANGUAGE plpgsql AS $func$
    BEGIN
      UPDATE rw.community_posts SET
        score = (upvote_count * 2.0)
              - (downvote_count * 1.0)
              + (comment_count * 0.5)
              + (view_count * 0.1),
        is_trending = (upvote_count > 50 OR comment_count > 20 OR view_count > 500),
        updated_at  = now()
      WHERE id = COALESCE(NEW.post_id, OLD.post_id);
      RETURN NULL;
    END;
    $func$;

    CREATE TRIGGER trg_score_on_vote
      AFTER INSERT OR UPDATE OR DELETE ON rw.community_post_votes
      FOR EACH ROW EXECUTE FUNCTION rw.fn_recalculate_post_score();

    CREATE TRIGGER trg_score_on_comment
      AFTER INSERT OR DELETE ON rw.community_post_comments
      FOR EACH ROW EXECUTE FUNCTION rw.fn_recalculate_post_score();

    -- Vote counter sync
    CREATE OR REPLACE FUNCTION rw.fn_sync_vote_counters()
    RETURNS TRIGGER LANGUAGE plpgsql AS $func$
    BEGIN
      IF TG_OP = 'INSERT' THEN
        IF NEW.vote_type = 'UPVOTE' THEN
          UPDATE rw.community_posts SET upvote_count = upvote_count + 1 WHERE id = NEW.post_id;
        ELSE
          UPDATE rw.community_posts SET downvote_count = downvote_count + 1 WHERE id = NEW.post_id;
        END IF;
      ELSIF TG_OP = 'UPDATE' THEN
        -- Vote changed direction
        IF OLD.vote_type = 'UPVOTE' AND NEW.vote_type = 'DOWNVOTE' THEN
          UPDATE rw.community_posts SET upvote_count = GREATEST(upvote_count-1,0), downvote_count = downvote_count+1 WHERE id = NEW.post_id;
        ELSIF OLD.vote_type = 'DOWNVOTE' AND NEW.vote_type = 'UPVOTE' THEN
          UPDATE rw.community_posts SET downvote_count = GREATEST(downvote_count-1,0), upvote_count = upvote_count+1 WHERE id = NEW.post_id;
        END IF;
      ELSIF TG_OP = 'DELETE' THEN
        IF OLD.vote_type = 'UPVOTE' THEN
          UPDATE rw.community_posts SET upvote_count = GREATEST(upvote_count-1,0) WHERE id = OLD.post_id;
        ELSE
          UPDATE rw.community_posts SET downvote_count = GREATEST(downvote_count-1,0) WHERE id = OLD.post_id;
        END IF;
      END IF;
      RETURN NULL;
    END;
    $func$;

    CREATE TRIGGER trg_vote_counters
      AFTER INSERT OR UPDATE OR DELETE ON rw.community_post_votes
      FOR EACH ROW EXECUTE FUNCTION rw.fn_sync_vote_counters();

    -- Comment counter sync
    CREATE OR REPLACE FUNCTION rw.fn_sync_community_comment_count()
    RETURNS TRIGGER LANGUAGE plpgsql AS $func$
    BEGIN
      IF TG_OP = 'INSERT' THEN
        UPDATE rw.community_posts SET comment_count = comment_count + 1 WHERE id = NEW.post_id;
      ELSIF TG_OP = 'DELETE' THEN
        UPDATE rw.community_posts SET comment_count = GREATEST(comment_count-1,0) WHERE id = OLD.post_id;
      END IF;
      RETURN NULL;
    END;
    $func$;

    CREATE TRIGGER trg_community_comment_count
      AFTER INSERT OR DELETE ON rw.community_post_comments
      FOR EACH ROW EXECUTE FUNCTION rw.fn_sync_community_comment_count();

    -- Full text search vector update
    CREATE OR REPLACE FUNCTION rw.fn_update_post_search_vector()
    RETURNS TRIGGER LANGUAGE plpgsql AS $func$
    BEGIN
      NEW.search_vector := to_tsvector('english',
        coalesce(NEW.title,'') || ' ' ||
        coalesce(NEW.content,'') || ' ' ||
        coalesce(NEW.subject_category::TEXT,'')
      );
      RETURN NEW;
    END;
    $func$;

    CREATE TRIGGER trg_post_search_vector
      BEFORE INSERT OR UPDATE ON rw.community_posts
      FOR EACH ROW EXECUTE FUNCTION rw.fn_update_post_search_vector();

    -- ─── Materialized view for community analytics ─────────────────────────────
    CREATE MATERIALIZED VIEW rw.mv_community_analytics AS
    SELECT
      ro.id             AS road_id,
      ro.road_name,
      ro.district,
      ro.state,
      COUNT(cp.id)                                                    AS total_posts,
      SUM(cp.upvote_count)                                            AS total_upvotes,
      SUM(cp.comment_count)                                           AS total_comments,
      SUM(cp.view_count)                                              AS total_views,
      COUNT(cp.id) FILTER (WHERE cp.is_supervoted)                    AS supervoted_posts,
      COUNT(cp.id) FILTER (WHERE cp.is_trending)                      AS trending_posts,
      MAX(cp.created_at)                                              AS last_post_at
    FROM rw.roads ro
    LEFT JOIN rw.community_posts cp ON cp.road_id = ro.id AND cp.is_hidden = FALSE
    GROUP BY ro.id, ro.road_name, ro.district, ro.state
    WITH DATA;

    CREATE UNIQUE INDEX ON rw.mv_community_analytics (road_id);
    CREATE INDEX ON rw.mv_community_analytics (total_posts DESC);
    CREATE INDEX ON rw.mv_community_analytics (district, total_posts DESC);

    INSERT INTO public.schema_migrations (version, description)
    VALUES ('004', 'Community Governance System — posts, votes, comments, views, moderation, analytics');

    RAISE NOTICE 'Migration 004 applied.';
  ELSE
    RAISE NOTICE 'Migration 004 already applied.';
  END IF;
END $$;
