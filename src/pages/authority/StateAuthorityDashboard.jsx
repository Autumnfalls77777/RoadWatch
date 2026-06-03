import { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { motion } from 'framer-motion';
import { TrendingUp, Brain, Map, AlertTriangle, Shield, BarChart2, Activity } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis } from 'recharts';
import AuthorityPageHeader from '@/components/authority/AuthorityPageHeader';
import RoleGuard from '@/components/authority/RoleGuard';
import RoadHeatmapPanel from '@/components/authority/RoadHeatmapPanel';
import PredictiveInsights from '@/components/authority/PredictiveInsights';

function DistrictRankCard({ district, rank, index }) {
  const score = district.score;
  const color = score >= 80 ? '#22c55e' : score >= 60 ? '#eab308' : score >= 40 ? '#f97316' : '#ef4444';
  const resRate = district.complaints > 0 ? Math.round((district.resolved / district.complaints) * 100) : 0;

  return (
    <motion.div initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: index * 0.05 }}
      className="bg-card rounded-2xl border border-border/60 p-4 flex items-center gap-4 text-slate-300">
      <div className="text-xl font-bold font-sora text-slate-500 w-6 text-center">#{rank}</div>
      <div className="w-12 h-12 rounded-2xl flex items-center justify-center text-white font-bold font-sora text-base" style={{ background: color }}>
        {score}
      </div>
      <div className="flex-1 min-w-0">
        <div className="font-bold text-sm text-white">{district.district}</div>
        <div className="text-xs text-slate-400 mt-0.5">{district.complaints} complaints · {resRate}% resolved</div>
        <div className="h-1.5 bg-secondary rounded-full overflow-hidden mt-2">
          <div className="h-full rounded-full transition-all" style={{ width: `${score}%`, background: color }}></div>
        </div>
      </div>
      <div className="text-right text-xs flex-shrink-0">
        <div className="font-bold text-white">{district.budget_use}%</div>
        <div className="text-slate-400">Budget Used</div>
      </div>
    </motion.div>
  );
}

export default function StateAuthorityDashboard() {
  const [complaints, setComplaints] = useState([]);
  const [roads, setRoads] = useState([]);
  const [analyticsData, setAnalyticsData] = useState(null);
  const [activeTab, setActiveTab] = useState('overview');
  const [stateName, setStateName] = useState('Maharashtra');
  const [loading, setLoading] = useState(true);

  const loadData = async () => {
    try {
      const user = await base44.auth.me();
      const st = user?.assigned_state || 'Maharashtra';
      setStateName(st);

      const [analytics, roadsList, complaintsList] = await Promise.all([
        fetch(`http://localhost:8787/api/analytics?state=${st}`).then(r => r.json()),
        fetch(`http://localhost:8787/api/roads?state=${st}`).then(r => r.json()),
        fetch(`http://localhost:8787/api/complaints?state=${st}`).then(r => r.json())
      ]);

      setAnalyticsData(analytics);
      setRoads(roadsList);
      setComplaints(complaintsList);
    } catch (err) {
      console.error('Failed to load state authority data:', err);
      // Fallback
      try {
        const storeRoads = await base44.entities.Road.list();
        const storeComplaints = await base44.entities.Complaint.list();
        setRoads(storeRoads.filter(r => r.state === stateName));
        setComplaints(storeComplaints.filter(c => c.state === stateName));
      } catch {}
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [stateName]);

  const tabs = [
    { id: 'overview', label: '📊 State Overview' },
    { id: 'districts', label: '🗺️ District Rankings' },
    { id: 'heatmap', label: '🔥 Thermal Map' },
    { id: 'predictive', label: '🤖 AI Predictions' },
  ];

  const totals = analyticsData?.totals || {
    complaints: 0,
    resolved: 0,
    resolution_rate: 0,
    roads: 0,
    budget_allocated: 0,
    budget_spent: 0,
    budget_remaining: 0
  };

  const avgScore = roads.length > 0 ? Math.round(roads.reduce((s, r) => s + (r.health_score || 0), 0) / roads.length) : 67;
  const criticalRoads = roads.filter(r => (r.health_score || 0) < 40).length;
  const budgetUtilization = totals.budget_allocated > 0 ? Math.round((totals.budget_spent / totals.budget_allocated) * 100) : 0;

  const stateHealthTrend = [
    { month: 'Mar', score: avgScore - 4 },
    { month: 'Apr', score: avgScore - 2 },
    { month: 'May', score: avgScore }
  ];

  const radarData = [
    { metric: 'SLA Response', value: 78 },
    { metric: 'Resolution', value: totals.resolution_rate || 75 },
    { metric: 'Transparency', value: 85 },
    { metric: 'Citizen Rating', value: 72 },
    { metric: 'Budget Mgmt', value: budgetUtilization || 65 },
  ];

  // Group roads and complaints by district
  const districtGroups = roads.reduce((acc, r) => {
    const d = r.district || 'Other';
    if (!acc[d]) acc[d] = { district: d, scoreSum: 0, count: 0, complaints: 0, resolved: 0, budget: 0, spent: 0 };
    acc[d].scoreSum += (r.health_score || 0);
    acc[d].count += 1;
    acc[d].budget += Number(r.allocated_budget || 0);
    acc[d].spent += Number(r.spent_budget || 0);
    return acc;
  }, {});

  complaints.forEach(c => {
    const d = c.district || 'Other';
    if (districtGroups[d]) {
      districtGroups[d].complaints += 1;
      if (['Resolved', 'completed', 'Completed'].includes(c.status)) districtGroups[d].resolved += 1;
    }
  });

  const districtRankings = Object.values(districtGroups).map(d => ({
    district: d.district,
    score: Math.round(d.scoreSum / d.count),
    complaints: d.complaints,
    resolved: d.resolved,
    budget_use: d.budget > 0 ? Math.round(d.spent / d.budget * 100) : 0
  })).sort((a, b) => b.score - a.score);

  if (loading) {
    return <div className="max-w-6xl mx-auto px-4 py-8 text-center text-slate-400">Loading statewide road parameters...</div>;
  }

  return (
    <RoleGuard allowedRoles={['state_authority', 'super_admin']}>
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6 text-slate-300">
        <AuthorityPageHeader role="State Authority" title="State Road Intelligence" subtitle={`Statewide road health, district rankings, and budget oversight in ${stateName}`} level={6} />

        {/* Tab Nav */}
        <div className="flex items-center gap-2 mb-6 bg-secondary/30 rounded-2xl p-1 border border-border/40 overflow-x-auto scrollbar-hide">
          {tabs.map(t => (
            <button key={t.id} onClick={() => setActiveTab(t.id)}
              className={`flex-shrink-0 py-1.5 px-4 rounded-xl text-xs font-semibold transition-all whitespace-nowrap ${activeTab === t.id ? 'bg-card text-white shadow-sm' : 'text-slate-400 hover:text-white'}`}>
              {t.label}
            </button>
          ))}
        </div>

        {activeTab === 'overview' && (
          <div className="space-y-4">
            {/* KPIs */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {[
                { label: 'State Health Index', value: `${avgScore}/100`, icon: '🛣️', color: 'bg-yellow-500/10 border-yellow-500/20 text-yellow-400' },
                { label: 'Active State Reports', value: totals.complaints, icon: '📋', color: 'bg-blue-500/10 border-blue-500/20 text-blue-400' },
                { label: 'Avg Resolution Time', value: '8.4 days', icon: '⏱️', color: 'bg-green-500/10 border-green-500/20 text-green-400' },
                { label: 'Critical Segments', value: criticalRoads, icon: '🚨', color: 'bg-red-500/10 border-red-500/20 text-red-400' },
              ].map((s, i) => (
                <motion.div key={s.label} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
                  className={`rounded-2xl p-4 border ${s.color}`}>
                  <div className="text-2xl mb-1">{s.icon}</div>
                  <div className="text-2xl font-bold font-sora text-white">{s.value}</div>
                  <div className="text-xs font-semibold opacity-70 mt-1">{s.label}</div>
                </motion.div>
              ))}
            </div>

            <div className="grid lg:grid-cols-2 gap-4">
              {/* State Health Trend */}
              <div className="bg-card rounded-2xl border border-border/60 p-5 shadow-md">
                <h3 className="font-semibold text-sm mb-4 flex items-center gap-2 text-white"><Activity className="w-4 h-4 text-primary animate-pulse" />State Road Quality Curve</h3>
                <ResponsiveContainer width="100%" height={200}>
                  <LineChart data={stateHealthTrend}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                    <YAxis domain={[40, 90]} tick={{ fontSize: 11 }} />
                    <Tooltip contentStyle={{ borderRadius: '12px', border: '1px solid hsl(var(--border))', fontSize: '12px' }} />
                    <Line type="monotone" dataKey="score" stroke="#3b82f6" strokeWidth={2.5} dot={{ fill: '#3b82f6', r: 3 }} name="Quality Score" />
                  </LineChart>
                </ResponsiveContainer>
              </div>

              {/* Authority Performance Radar */}
              <div className="bg-card rounded-2xl border border-border/60 p-5 shadow-md">
                <h3 className="font-semibold text-sm mb-4 text-white">State Authority Performance</h3>
                <ResponsiveContainer width="100%" height={200}>
                  <RadarChart data={radarData}>
                    <PolarGrid stroke="hsl(var(--border))" />
                    <PolarAngleAxis dataKey="metric" tick={{ fontSize: 10, fill: '#94a3b8' }} />
                    <PolarRadiusAxis domain={[0, 100]} tick={{ fontSize: 9, fill: '#64748b' }} />
                    <Radar dataKey="value" stroke="#6366f1" fill="#6366f1" fillOpacity={0.2} strokeWidth={2} />
                  </RadarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'districts' && (
          <div className="space-y-3">
            <div className="text-xs text-slate-400 mb-2 font-medium">Ranked by calculated road health index score</div>
            {districtRankings.length === 0 ? (
              <div className="py-12 text-center text-xs text-slate-500">No district road logs registered.</div>
            ) : (
              districtRankings.map((d, i) => <DistrictRankCard key={d.district} district={d} rank={i + 1} index={i} />)
            )}
          </div>
        )}

        {activeTab === 'heatmap' && <RoadHeatmapPanel />}
        {activeTab === 'predictive' && <PredictiveInsights />}
      </div>
    </RoleGuard>
  );
}