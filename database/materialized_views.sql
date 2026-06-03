-- =============================================================================
-- RoadWatch Database — Materialized Views for Analytics
-- File: materialized_views.sql
-- Run AFTER schema.sql and triggers.sql
-- Refresh strategy noted per view.
-- =============================================================================

SET search_path = rw, public;

-------------------------------------------------------------------------------
-- 1. District Road Health Leaderboard
--    Refresh: every hour via pg_cron or application scheduler
-------------------------------------------------------------------------------
CREATE MATERIALIZED VIEW rw.mv_district_health AS
SELECT
    r.district,
    r.state,
    ROUND(AVG(r.current_health_score), 1)   AS avg_health_score,
    ROUND(AVG(r.current_risk_score), 1)     AS avg_risk_score,
    COUNT(r.id)                              AS total_roads,
    COUNT(r.id) FILTER (WHERE r.road_status = 'critical') AS critical_roads,
    SUM(r.total_complaints)                  AS total_complaints,
    MAX(r.updated_at)                        AS last_updated
FROM rw.roads r
GROUP BY r.district, r.state
WITH DATA;

CREATE UNIQUE INDEX ON rw.mv_district_health (district, state);
CREATE INDEX ON rw.mv_district_health (avg_health_score);
CREATE INDEX ON rw.mv_district_health (state, avg_health_score);

COMMENT ON MATERIALIZED VIEW rw.mv_district_health IS
    'District-level road health aggregates. Refresh hourly.';


-------------------------------------------------------------------------------
-- 2. State Road Health Summary
--    Refresh: every 6 hours
-------------------------------------------------------------------------------
CREATE MATERIALIZED VIEW rw.mv_state_health AS
SELECT
    r.state,
    ROUND(AVG(r.current_health_score), 1)   AS avg_health_score,
    ROUND(AVG(r.current_risk_score), 1)     AS avg_risk_score,
    COUNT(r.id)                              AS total_roads,
    COUNT(DISTINCT r.district)               AS total_districts,
    SUM(r.total_complaints)                  AS total_complaints,
    SUM(r.total_repairs)                     AS total_repairs
FROM rw.roads r
GROUP BY r.state
WITH DATA;

CREATE UNIQUE INDEX ON rw.mv_state_health (state);
CREATE INDEX ON rw.mv_state_health (avg_health_score);

COMMENT ON MATERIALIZED VIEW rw.mv_state_health IS
    'State-level road health aggregates. Refresh every 6 hours.';


-------------------------------------------------------------------------------
-- 3. Top Damaged Roads (worst 100 roads by health score)
--    Refresh: every 30 minutes
-------------------------------------------------------------------------------
CREATE MATERIALIZED VIEW rw.mv_top_damaged_roads AS
SELECT
    r.id,
    r.road_name,
    r.road_code,
    r.district,
    r.state,
    r.current_health_score,
    r.current_risk_score,
    r.total_complaints,
    r.road_status,
    r.latitude,
    r.longitude,
    r.updated_at
FROM rw.roads r
ORDER BY r.current_health_score ASC, r.current_risk_score DESC
LIMIT 100
WITH DATA;

CREATE UNIQUE INDEX ON rw.mv_top_damaged_roads (id);
CREATE INDEX ON rw.mv_top_damaged_roads (district, current_health_score);

COMMENT ON MATERIALIZED VIEW rw.mv_top_damaged_roads IS
    'Worst 100 roads by health score. Refresh every 30 minutes.';


-------------------------------------------------------------------------------
-- 4. Accident Risk Hotspots (most recent risk per road)
--    Refresh: every 15 minutes
-------------------------------------------------------------------------------
CREATE MATERIALIZED VIEW rw.mv_accident_hotspots AS
WITH latest_risk AS (
    SELECT DISTINCT ON (road_id)
        road_id, risk_score, reason, district, state, generated_at
    FROM rw.accident_risk_history
    ORDER BY road_id, generated_at DESC
)
SELECT
    lr.road_id,
    ro.road_name,
    ro.road_code,
    lr.district,
    lr.state,
    lr.risk_score,
    lr.reason,
    lr.generated_at,
    ro.latitude,
    ro.longitude,
    ro.total_complaints
FROM latest_risk lr
JOIN rw.roads ro ON ro.id = lr.road_id
WHERE lr.risk_score >= 60   -- only high-risk roads
ORDER BY lr.risk_score DESC
WITH DATA;

CREATE UNIQUE INDEX ON rw.mv_accident_hotspots (road_id);
CREATE INDEX ON rw.mv_accident_hotspots (district, risk_score DESC);

COMMENT ON MATERIALIZED VIEW rw.mv_accident_hotspots IS
    'Current high-risk roads (risk_score >= 60). Refresh every 15 minutes.';


-------------------------------------------------------------------------------
-- 5. Most Active Citizens (leaderboard)
--    Refresh: every 6 hours
-------------------------------------------------------------------------------
CREATE MATERIALIZED VIEW rw.mv_citizen_leaderboard AS
SELECT
    u.id,
    u.full_name,
    u.district,
    u.state,
    u.citizen_level,
    u.points,
    u.total_reports,
    u.verified_reports,
    RANK() OVER (ORDER BY u.points DESC)                               AS global_rank,
    RANK() OVER (PARTITION BY u.district ORDER BY u.points DESC)       AS district_rank
FROM rw.users u
WHERE u.role_id = (SELECT id FROM rw.roles WHERE name = 'citizen')
  AND u.account_status = 'active'
WITH DATA;

CREATE UNIQUE INDEX ON rw.mv_citizen_leaderboard (id);
CREATE INDEX ON rw.mv_citizen_leaderboard (district, district_rank);

COMMENT ON MATERIALIZED VIEW rw.mv_citizen_leaderboard IS
    'Citizen gamification leaderboard. Refresh every 6 hours.';


-------------------------------------------------------------------------------
-- 6. Average Repair Time by District
--    Refresh: daily
-------------------------------------------------------------------------------
CREATE MATERIALIZED VIEW rw.mv_repair_performance AS
SELECT
    rep.district,
    rep.state,
    COUNT(ra.id)                                                    AS total_assignments,
    COUNT(ra.id) FILTER (WHERE ra.repair_status = 'completed')      AS completed,
    ROUND(AVG(
        CASE WHEN ra.actual_completion IS NOT NULL AND ra.actual_start IS NOT NULL
             THEN ra.actual_completion - ra.actual_start
        END
    )::NUMERIC, 1)                                                   AS avg_repair_days,
    ROUND(AVG(ra.final_cost) FILTER (WHERE ra.final_cost IS NOT NULL), 2) AS avg_final_cost,
    COUNT(DISTINCT ra.contractor_id)                                AS contractors_used
FROM rw.repair_assignments ra
JOIN rw.reports rep ON rep.id = ra.report_id
GROUP BY rep.district, rep.state
WITH DATA;

CREATE UNIQUE INDEX ON rw.mv_repair_performance (district, state);
CREATE INDEX ON rw.mv_repair_performance (avg_repair_days);

COMMENT ON MATERIALIZED VIEW rw.mv_repair_performance IS
    'Repair efficiency by district. Refresh daily.';


-------------------------------------------------------------------------------
-- 7. AI Detection Statistics
--    Refresh: hourly
-------------------------------------------------------------------------------
CREATE MATERIALIZED VIEW rw.mv_ml_statistics AS
SELECT
    rep.district,
    rep.state,
    COUNT(ma.id)                                                    AS total_analyses,
    SUM(ma.pothole_count)                                           AS total_potholes,
    ROUND(AVG(ma.average_confidence)::NUMERIC, 4)                  AS avg_confidence,
    ROUND(AVG(ma.road_health_score)::NUMERIC, 1)                   AS avg_road_health,
    COUNT(*) FILTER (WHERE ma.highest_severity = 'CRITICAL')       AS critical_detections,
    COUNT(*) FILTER (WHERE ma.highest_severity = 'HIGH')           AS high_detections,
    MAX(ma.created_at)                                             AS last_analysis
FROM rw.ml_analysis ma
JOIN rw.reports rep ON rep.id = ma.report_id
GROUP BY rep.district, rep.state
WITH DATA;

CREATE UNIQUE INDEX ON rw.mv_ml_statistics (district, state);
CREATE INDEX ON rw.mv_ml_statistics (total_potholes DESC);

COMMENT ON MATERIALIZED VIEW rw.mv_ml_statistics IS
    'ML detection aggregates by district. Refresh hourly.';


-------------------------------------------------------------------------------
-- 8. Road Health Trend (last 90 days per road)
--    Refresh: daily  |  used for chart data
-------------------------------------------------------------------------------
CREATE MATERIALIZED VIEW rw.mv_road_health_trend AS
SELECT
    road_id,
    district,
    state,
    DATE_TRUNC('week', recorded_at)         AS week_start,
    ROUND(AVG(road_health_score)::NUMERIC, 1) AS avg_health,
    ROUND(AVG(risk_score)::NUMERIC, 1)      AS avg_risk,
    MAX(pothole_count)                      AS max_potholes
FROM rw.road_health_history
WHERE recorded_at >= now() - INTERVAL '90 days'
GROUP BY road_id, district, state, DATE_TRUNC('week', recorded_at)
WITH DATA;

CREATE INDEX ON rw.mv_road_health_trend (road_id, week_start DESC);
CREATE INDEX ON rw.mv_road_health_trend (district, week_start DESC);

COMMENT ON MATERIALIZED VIEW rw.mv_road_health_trend IS
    'Weekly road health trends for the last 90 days. Refresh daily.';


-------------------------------------------------------------------------------
-- Refresh helper function — call this from application/pg_cron
-------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION rw.refresh_all_materialized_views()
RETURNS VOID LANGUAGE plpgsql AS $$
BEGIN
    REFRESH MATERIALIZED VIEW CONCURRENTLY rw.mv_district_health;
    REFRESH MATERIALIZED VIEW CONCURRENTLY rw.mv_state_health;
    REFRESH MATERIALIZED VIEW CONCURRENTLY rw.mv_top_damaged_roads;
    REFRESH MATERIALIZED VIEW CONCURRENTLY rw.mv_accident_hotspots;
    REFRESH MATERIALIZED VIEW CONCURRENTLY rw.mv_citizen_leaderboard;
    REFRESH MATERIALIZED VIEW CONCURRENTLY rw.mv_repair_performance;
    REFRESH MATERIALIZED VIEW CONCURRENTLY rw.mv_ml_statistics;
    REFRESH MATERIALIZED VIEW CONCURRENTLY rw.mv_road_health_trend;
END;
$$;
