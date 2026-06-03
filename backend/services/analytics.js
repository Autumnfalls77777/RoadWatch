export function buildAnalytics(data, filters = {}) {
  const complaints = filterGeo(data.complaints, filters);
  const roads = filterGeo(data.roads, filters);
  const contractors = data.contractors;
  const authorities = data.authorities;
  const wards = filterGeo(data.wards || [], filters);
  const resolved = complaints.filter(c => ['Resolved', 'completed', 'Completed'].includes(c.status)).length;
  const allocated = roads.reduce((s, r) => s + Number(r.allocated_budget || 0), 0);
  const spent = roads.reduce((s, r) => s + Number(r.spent_budget || 0), 0);
  const severity = groupBy(complaints, c => c.severity || 'Unknown');
  const aiTypes = groupBy(data.aiAnalyses, a => a.issue_type || a.detected_issue_type || 'Unknown');

  // 1. Complaint by status breakdown
  const complaint_by_status = groupBy(complaints, c => c.status || 'Submitted');

  // 2. Road health distribution (Excellent, Good, Moderate, Poor, Critical/Closed)
  const road_health_distribution = {
    Excellent: roads.filter(r => (r.health_score || r.current_health_score) >= 85).length,
    Good: roads.filter(r => (r.health_score || r.current_health_score) >= 70 && (r.health_score || r.current_health_score) < 85).length,
    Moderate: roads.filter(r => (r.health_score || r.current_health_score) >= 50 && (r.health_score || r.current_health_score) < 70).length,
    Poor: roads.filter(r => (r.health_score || r.current_health_score) >= 30 && (r.health_score || r.current_health_score) < 50).length,
    Critical: roads.filter(r => (r.health_score || r.current_health_score) < 30).length,
  };

  // 3. Monthly trend for the last 6 months (handling months with no data)
  const last6Months = [];
  const now = new Date();
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    last6Months.push(d.toLocaleString('en', { month: 'short' }));
  }

  const complaintsTrendGroup = complaints.reduce((acc, c) => {
    const m = new Date(c.created_date || Date.now()).toLocaleString('en', { month: 'short' });
    acc[m] = (acc[m] || 0) + 1;
    return acc;
  }, {});

  const monthly_trend = last6Months.map(month => ({
    month,
    complaints: complaintsTrendGroup[month] || 0,
    resolved: complaints.filter(c => ['Resolved', 'completed', 'Completed'].includes(c.status) && new Date(c.updated_date || c.created_date).toLocaleString('en', { month: 'short' }) === month).length
  }));

  // 4. Contractor workload (open vs closed cases per contractor)
  const contractor_workload = contractors.map(con => {
    const conComplaints = complaints.filter(c => c.contractor_id === con.id);
    const open = conComplaints.filter(c => !['Resolved', 'completed', 'Completed'].includes(c.status)).length;
    const closed = conComplaints.filter(c => ['Resolved', 'completed', 'Completed'].includes(c.status)).length;
    return {
      contractor_id: con.id,
      name: con.name,
      open,
      closed,
      total: conComplaints.length,
    };
  });

  return {
    filters,
    totals: {
      complaints: complaints.length,
      resolved,
      resolution_rate: complaints.length ? Math.round((resolved / complaints.length) * 100) : 0,
      roads: roads.length,
      road_length_km: round(roads.reduce((s, r) => s + Number(r.length_km || 0), 0)),
      footpath_coverage: Math.round(avg(wards.map(w => w.footpath_coverage_percent).filter(v => v != null)) ?? avg(roads.map(r => r.footpath_coverage_percent).filter(v => v != null)) ?? 0),
      high_risk_wards: wards.filter(w => (w.health_score || 0) < 50).length,
      wards: wards.length,
      budget_allocated: allocated,
      budget_spent: spent,
      budget_remaining: allocated - spent,
    },
    complaint_trends: monthly_trend.map(t => ({ name: t.month, value: t.complaints })),
    resolution_trends: monthly_trend.map(t => ({ name: t.month, value: t.resolved })),
    monthly_trend,
    complaint_by_status,
    road_health_distribution,
    contractor_workload,
    severity,
    budget_usage: roads.map(r => ({ road: r.name || r.road_name, allocated: r.allocated_budget || 0, spent: r.spent_budget || 0, remaining: r.budget_remaining || 0 })),
    contractor_rankings: contractors.sort((a, b) => (b.accountability_score || b.reliability_score || 0) - (a.accountability_score || a.reliability_score || 0)),
    authority_rankings: authorities.sort((a, b) => (b.accountability_score || 0) - (a.accountability_score || 0)),
    road_health_heatmap: roads.map(r => ({ id: r.id, name: r.name || r.road_name, score: r.health_score || r.current_health_score || 0, coordinates: r.coordinates })),
    road_health_rankings: [...roads].sort((a, b) => (a.health_score || 0) - (b.health_score || 0)).map(r => ({ id: r.id, name: r.name || r.road_name, ward: r.ward, score: r.health_score || 0 })),
    ward_rankings: [...wards].sort((a, b) => (b.health_score || 0) - (a.health_score || 0)).map((w, index) => ({ ...w, rank: index + 1 })),
    high_risk_wards: wards.filter(w => (w.health_score || 0) < 50).sort((a, b) => (a.health_score || 0) - (b.health_score || 0)),
    complaint_density: wards.map(w => {
      const wardComplaints = complaints.filter(c => c.ward === w.name || c.ward_id === w.id);
      return { ward: w.name, complaints: wardComplaints.length, per_km: round(wardComplaints.length / (Number(w.length_km || 1))) };
    }),
    datasets: data.datasets || [],
    ai_detection_trends: aiTypes,
  };
}

function filterGeo(rows, filters) {
  return rows.filter(row => ['country', 'state', 'district', 'ward'].every(k => !filters[k] || row[k] === filters[k]));
}

function groupBy(rows, keyFn) {
  return Object.entries(rows.reduce((acc, row) => {
    const key = keyFn(row);
    acc[key] = (acc[key] || 0) + 1;
    return acc;
  }, {})).map(([name, value]) => ({ name, value }));
}

function avg(values) {
  if (!values.length) return null;
  return values.reduce((sum, value) => sum + Number(value || 0), 0) / values.length;
}

function round(value) {
  return Number(Number(value || 0).toFixed(2));
}
