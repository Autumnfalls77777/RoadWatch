import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { motion } from 'framer-motion';
import { TrendingUp, Award, Clock, Activity, AlertCircle, CheckCircle } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import AuthorityPageHeader from '@/components/authority/AuthorityPageHeader';
import RoleGuard from '@/components/authority/RoleGuard';

const PIE_COLORS = ['#22c55e', '#eab308', '#f97316', '#ef4444'];

function MetricCard({ label, value, sub, icon, color, trend, delay }) {
  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay }}
      className={`rounded-2xl p-4 border ${color} relative overflow-hidden`}>
      <div className="flex items-start justify-between mb-2">
        <span className="text-2xl">{icon}</span>
        {trend && (
          <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${trend > 0 ? 'bg-green-500/10 text-green-400' : 'bg-red-500/10 text-red-400'}`}>
            {trend > 0 ? '↑' : '↓'} {Math.abs(trend)}%
          </span>
        )}
      </div>
      <div className="text-2xl font-bold font-sora text-white">{value}</div>
      <div className="text-xs font-semibold opacity-70 mt-1">{label}</div>
      {sub && <div className="text-[10px] opacity-50 mt-0.5">{sub}</div>}
    </motion.div>
  );
}

export default function DistrictAuthorityDashboard() {
  const [complaints, setComplaints] = useState([]);
  const [roads, setRoads] = useState([]);
  const [analyticsData, setAnalyticsData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [district, setDistrict] = useState('Pune');

  const loadData = async () => {
    setLoading(true);
    
    Promise.all([
      fetch(`http://localhost:8787/api/analytics?district=${district}`).then(r => {
        if (!r.ok) throw new Error('API down');
        return r.json();
      }),
      fetch(`http://localhost:8787/api/roads?district=${district}`).then(r => r.json()),
      fetch(`http://localhost:8787/api/complaints?district=${district}`).then(r => r.json())
    ])
      .then(([analytics, roadsList, complaintsList]) => {
        setAnalyticsData(analytics);
        setRoads(roadsList);
        setComplaints(complaintsList);
      })
      .catch(async () => {
        // Fallback computations
        const storeRoads = await base44.entities.Road.list();
        const storeComplaints = await base44.entities.Complaint.list();
        const storeContractors = await base44.entities.Contractor.list();
        
        const filteredRoads = storeRoads.filter(r => r.district === district);
        const filteredComplaints = storeComplaints.filter(c => c.district === district);
        
        setRoads(filteredRoads);
        setComplaints(filteredComplaints);
        
        const resolved = filteredComplaints.filter(c => ['Resolved', 'completed', 'Completed'].includes(c.status)).length;
        const allocated = filteredRoads.reduce((s, r) => s + Number(r.allocated_budget || 0), 0);
        const spent = filteredRoads.reduce((s, r) => s + Number(r.spent_budget || 0), 0);

        setAnalyticsData({
          totals: {
            complaints: filteredComplaints.length,
            resolved,
            resolution_rate: filteredComplaints.length ? Math.round((resolved / filteredComplaints.length) * 100) : 0,
            roads: filteredRoads.length,
            budget_allocated: allocated,
            budget_spent: spent,
            budget_remaining: allocated - spent,
          },
          complaint_trends: [
            { name: 'Mar', value: Math.max(0, filteredComplaints.length - 2) },
            { name: 'Apr', value: Math.max(0, filteredComplaints.length - 1) },
            { name: 'May', value: filteredComplaints.length }
          ],
          road_health_distribution: {
            Excellent: filteredRoads.filter(r => r.health_score >= 80).length,
            Good: filteredRoads.filter(r => r.health_score >= 60 && r.health_score < 80).length,
            Moderate: filteredRoads.filter(r => r.health_score >= 40 && r.health_score < 60).length,
            Critical: filteredRoads.filter(r => r.health_score < 40).length,
          },
          contractor_rankings: storeContractors
        });
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadData();
  }, [district]);

  const totals = analyticsData?.totals || {
    complaints: 0,
    resolved: 0,
    resolution_rate: 0,
    roads: 0,
    budget_allocated: 0,
    budget_spent: 0,
    budget_remaining: 0
  };

  const resolutionRate = totals.resolution_rate;
  const avgScore = roads.length > 0 ? Math.round(roads.reduce((s, r) => s + (r.health_score || 0), 0) / roads.length) : 75;
  const criticalCount = complaints.filter(c => c.severity === 'Critical').length;
  const budgetUtilization = totals.budget_allocated > 0 ? Math.round((totals.budget_spent / totals.budget_allocated) * 100) : 0;

  const monthlyTrend = (analyticsData?.complaint_trends || []).map(t => ({
    month: t.name,
    complaints: t.value,
    resolved: Math.round(t.value * (resolutionRate / 100))
  }));

  const pieData = [
    { name: 'Excellent', value: analyticsData?.road_health_distribution?.Excellent || 0 },
    { name: 'Good', value: analyticsData?.road_health_distribution?.Good || 0 },
    { name: 'Moderate', value: analyticsData?.road_health_distribution?.Moderate || 0 },
    { name: 'Critical', value: analyticsData?.road_health_distribution?.Critical || 0 },
  ];

  const sortedRoads = [...roads].sort((a, b) => (a.health_score || 0) - (b.health_score || 0));
  const worstRoads = sortedRoads.slice(0, 3);
  const bestRoads = [...roads].sort((a, b) => (b.health_score || 0) - (a.health_score || 0)).slice(0, 3);

  const contractorPerf = (analyticsData?.contractor_rankings || []).map(con => ({
    name: con.name,
    score: con.avg_health_score || con.reliability_score || 70,
    complaints: con.complaint_count || 0,
    trend: (con.avg_health_score || con.reliability_score) >= 70 ? 'up' : 'stable'
  })).slice(0, 4);

  return (
    <RoleGuard allowedRoles={['district_authority', 'state_authority', 'super_admin']}>
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6 text-slate-300">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <AuthorityPageHeader role="District Authority" title="District Overview" subtitle="Monitor roads, complaints, budgets and contractor accountability" level={5} />
          <Select value={district} onValueChange={setDistrict}>
            <SelectTrigger className="w-40 h-10 text-xs bg-slate-950/40 border-slate-800 text-slate-300 rounded-xl">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-slate-900 border border-slate-800 text-slate-200">
              {['Pune', 'Mumbai', 'Chennai', 'Bengaluru', 'Delhi', 'Los Angeles', 'London', 'Dubai'].map(d => (
                <SelectItem key={d} value={d} className="text-xs hover:bg-slate-800">{d}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* KPI Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 mb-6">
          <MetricCard label="District Health" value={`${avgScore}/100`} icon="🛣️" color="bg-green-500/10 border-green-500/20 text-green-400" delay={0} />
          <MetricCard label="Total Reports" value={totals.complaints} icon="📋" color="bg-blue-500/10 border-blue-500/20 text-blue-400" delay={0.04} />
          <MetricCard label="Resolution Rate" value={`${resolutionRate}%`} icon="✅" color="bg-emerald-500/10 border-emerald-500/20 text-emerald-400" delay={0.08} />
          <MetricCard label="Critical Issues" value={criticalCount} icon="🚨" color="bg-red-500/10 border-red-500/20 text-red-400" delay={0.12} />
          <MetricCard label="Avg SLA Time" value="7.8 days" icon="⏱️" color="bg-yellow-500/10 border-yellow-500/20 text-yellow-400" delay={0.16} />
          <MetricCard label="Budget Used" value={`${budgetUtilization}%`} icon="💰" color="bg-purple-500/10 border-purple-500/20 text-purple-400" delay={0.2} />
        </div>

        {/* Charts Row */}
        <div className="grid lg:grid-cols-5 gap-4 mb-4">
          <div className="lg:col-span-3 bg-card rounded-2xl border border-border/60 p-5">
            <h3 className="font-semibold text-sm mb-4 text-white">Incident Timeline — {district}</h3>
            {monthlyTrend.length === 0 ? (
              <div className="h-[200px] flex items-center justify-center text-xs text-muted-foreground">No timeline metrics available for this district.</div>
            ) : (
              <ResponsiveContainer width="100%" height={200}>
                <AreaChart data={monthlyTrend}>
                  <defs>
                    <linearGradient id="gComp" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.15} />
                      <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="gRes" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#22c55e" stopOpacity={0.15} />
                      <stop offset="95%" stopColor="#22c55e" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip contentStyle={{ borderRadius: '12px', border: '1px solid hsl(var(--border))', fontSize: '12px' }} />
                  <Area type="monotone" dataKey="complaints" stroke="#3b82f6" fill="url(#gComp)" strokeWidth={2} name="Complaints" />
                  <Area type="monotone" dataKey="resolved" stroke="#22c55e" fill="url(#gRes)" strokeWidth={2} name="Resolved" />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </div>

          <div className="lg:col-span-2 bg-card rounded-2xl border border-border/60 p-5">
            <h3 className="font-semibold text-sm mb-4 text-white">Road Quality Spread</h3>
            {pieData.every(d => d.value === 0) ? (
              <div className="h-[200px] flex items-center justify-center text-xs text-muted-foreground">No road profiles mapped.</div>
            ) : (
              <>
                <ResponsiveContainer width="100%" height={200}>
                  <PieChart>
                    <Pie data={pieData} cx="50%" cy="50%" innerRadius={50} outerRadius={85} paddingAngle={3} dataKey="value">
                      {pieData.map((entry, index) => (
                        <Cell key={index} fill={PIE_COLORS[index]} />
                      ))}
                    </Pie>
                    <Tooltip contentStyle={{ borderRadius: '12px', border: '1px solid hsl(var(--border))', fontSize: '12px' }} />
                  </PieChart>
                </ResponsiveContainer>
                <div className="flex flex-wrap gap-2 justify-center text-xs mt-2">
                  {[['#22c55e', 'Excellent'], ['#eab308', 'Good'], ['#f97316', 'Poor'], ['#ef4444', 'Critical']].map(([c, l]) => (
                    <div key={l} className="flex items-center gap-1">
                      <div className="w-2 h-2 rounded-full" style={{ background: c }}></div>
                      <span className="text-slate-400 text-[11px]">{l}</span>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>

        {/* Worst/Best Roads + Contractors */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {/* Worst Roads */}
          <div className="bg-red-500/5 border border-red-500/20 rounded-2xl p-4">
            <h3 className="font-semibold text-sm text-red-400 mb-3 flex items-center gap-2">🚨 Distress Segments</h3>
            {worstRoads.length === 0 ? (
              <div className="py-8 text-center text-xs text-slate-500">No distress segments.</div>
            ) : worstRoads.map(r => (
              <div key={r.id} className="flex items-center gap-2.5 py-2 border-b border-red-500/10 last:border-0 text-xs">
                <div className="w-8 h-8 rounded-xl bg-red-500/15 flex items-center justify-center font-bold text-red-400 shrink-0">{r.health_score}%</div>
                <div className="flex-1 min-w-0">
                  <div className="font-bold text-white truncate">{r.name || r.road_name}</div>
                  <div className="text-slate-400 mt-0.5">{r.total_complaints || 0} claims filed</div>
                </div>
              </div>
            ))}
          </div>

          {/* Best Roads */}
          <div className="bg-green-500/5 border border-green-500/20 rounded-2xl p-4">
            <h3 className="font-semibold text-sm text-green-400 mb-3 flex items-center gap-2">🏆 High Quality Segments</h3>
            {bestRoads.length === 0 ? (
              <div className="py-8 text-center text-xs text-slate-500">No high quality segments.</div>
            ) : bestRoads.map(r => (
              <div key={r.id} className="flex items-center gap-2.5 py-2 border-b border-green-500/10 last:border-0 text-xs">
                <div className="w-8 h-8 rounded-xl bg-green-500/15 flex items-center justify-center font-bold text-green-400 shrink-0">{r.health_score}%</div>
                <div className="flex-1 min-w-0">
                  <div className="font-bold text-white truncate">{r.name || r.road_name}</div>
                  <div className="text-slate-400 mt-0.5">{r.total_complaints || 0} claims filed</div>
                </div>
              </div>
            ))}
          </div>

          {/* Contractor Performance */}
          <div className="bg-card border border-border/60 rounded-2xl p-4 shadow-md">
            <h3 className="font-semibold text-sm mb-3 flex items-center gap-2 text-white">
              <Award className="w-4 h-4 text-primary animate-pulse" /> Contractor Accountability
            </h3>
            {contractorPerf.length === 0 ? (
              <div className="py-8 text-center text-xs text-slate-500">No active contractor records.</div>
            ) : contractorPerf.map(c => (
              <div key={c.name} className="flex items-center gap-2.5 py-2 border-b border-border/40 last:border-0 text-xs text-slate-300">
                <div className={`w-8 h-8 rounded-xl flex items-center justify-center font-bold text-white text-xs ${c.score >= 75 ? 'bg-green-600' : c.score >= 55 ? 'bg-yellow-600' : 'bg-red-600'}`}>{c.score}</div>
                <div className="flex-1 min-w-0">
                  <div className="font-bold truncate text-white">{c.name}</div>
                  <div className="text-slate-400 mt-0.5">{c.complaints} active cases</div>
                </div>
                <span>{c.trend === 'up' ? '📈' : '➡️'}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </RoleGuard>
  );
}