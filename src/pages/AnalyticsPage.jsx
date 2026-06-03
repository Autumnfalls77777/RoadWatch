import { useState, useEffect } from 'react';
import { AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { TrendingUp, AlertTriangle, CheckCircle, Clock, BarChart2, Map, Award, Activity, DollarSign, Globe, Database, ArrowUpRight } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import PageHeader from '@/components/shared/PageHeader';
import StatCard from '@/components/shared/StatCard';
import GeoSelector from '@/components/shared/GeoSelector';
import { Badge } from '@/components/ui/badge';

const SEVERITY_COLORS = {
  'Critical': '#ef4444',
  'High': '#f97316',
  'Medium': '#eab308',
  'Low': '#3b82f6',
  'Unknown': '#64748b'
};

const DATA_SOURCES = [
  { id: 'osm', name: 'OpenStreetMap API', type: 'Base Geo-Data', role: 'Road segments layout and highway nodes tracking', trust: 'High' },
  { id: 'pmc', name: 'PMC Ward Asset Registry', type: 'Municipal Data', role: 'Official road registers, metadata, and administrative divisions', trust: 'Gold Standard' },
  { id: 'pwd', name: 'PWD Pune Division Audit', type: 'State PWD Records', role: 'Construction history, pavement thickness logs, material audit', trust: 'Official' },
  { id: 'citizen', name: 'Citizen Crowdsourcing', type: 'Community Inputs', role: 'Pothole reports, active comments, nearby verification votes', trust: 'Community Verified' },
  { id: 'ai', name: 'AI Computer Vision Model', type: 'AI Detection', role: 'Automatic distress scanning on citizen-uploaded photos/videos', trust: '91% Confidence' },
  { id: 'repairs', name: 'PMC Contractor Bills', type: 'Repair Records', role: 'Financial disbursements, invoice audit, and completion logs', trust: 'Audited' },
];

function ChartCard({ title, subtitle, badge, children }) {
  return (
    <div className="bg-card rounded-2xl border border-border/60 p-5 flex flex-col justify-between shadow-sm">
      <div className="mb-4 flex items-start justify-between">
        <div>
          <h3 className="font-semibold text-foreground text-sm sm:text-base leading-tight">{title}</h3>
          {subtitle && <p className="text-xs text-muted-foreground mt-0.5">{subtitle}</p>}
        </div>
        {badge && <Badge variant="outline" className="border-primary/20 text-primary font-bold text-[10px] bg-primary/5">{badge}</Badge>}
      </div>
      <div className="flex-1 w-full">{children}</div>
    </div>
  );
}

export default function AnalyticsPage() {
  const [complaints, setComplaints] = useState([]);
  const [roads, setRoads] = useState([]);
  const [analyticsData, setAnalyticsData] = useState(null);
  const [filters, setFilters] = useState({});
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('performance');

  useEffect(() => {
    setLoading(true);
    const params = new URLSearchParams(filters).toString();
    
    Promise.all([
      fetch(`http://localhost:8787/api/analytics?${params}`).then(r => {
        if (!r.ok) throw new Error('API down');
        return r.json();
      }),
      fetch(`http://localhost:8787/api/roads?${params}`).then(r => r.json()),
      fetch(`http://localhost:8787/api/complaints?${params}`).then(r => r.json()),
    ])
      .then(([analytics, roadsList, complaintsList]) => {
        setAnalyticsData(analytics);
        setRoads(roadsList);
        setComplaints(complaintsList);
      })
      .catch(async () => {
        // Fallback calculations for offline mode / mock client fallback
        const storeRoads = await base44.entities.Road.list();
        const storeComplaints = await base44.entities.Complaint.list();
        const storeContractors = await base44.entities.Contractor.list();
        const storeAuthorities = await base44.entities.Authority.list();
        
        const filteredRoads = storeRoads.filter(r => 
          (!filters.country || r.country === filters.country) &&
          (!filters.state || r.state === filters.state) &&
          (!filters.district || r.district === filters.district) &&
          (!filters.ward || r.ward === filters.ward)
        );
        const filteredComplaints = storeComplaints.filter(c => 
          (!filters.country || c.country === filters.country) &&
          (!filters.state || c.state === filters.state) &&
          (!filters.district || c.district === filters.district) &&
          (!filters.ward || c.ward === filters.ward)
        );
        
        setRoads(filteredRoads);
        setComplaints(filteredComplaints);
        
        const resolved = filteredComplaints.filter(c => ['Resolved', 'completed', 'Completed'].includes(c.status)).length;
        const allocated = filteredRoads.reduce((s, r) => s + Number(r.allocated_budget || 0), 0);
        const spent = filteredRoads.reduce((s, r) => s + Number(r.spent_budget || 0), 0);

        // Group complaints by severity
        const severityMap = filteredComplaints.reduce((acc, c) => {
          acc[c.severity] = (acc[c.severity] || 0) + 1;
          return acc;
        }, {});
        
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
            { name: 'Mar', value: Math.max(0, filteredComplaints.length - 8) },
            { name: 'Apr', value: Math.max(0, filteredComplaints.length - 3) },
            { name: 'May', value: filteredComplaints.length }
          ],
          severity: Object.entries(severityMap).map(([name, value]) => ({ name, value })),
          road_health_heatmap: filteredRoads.map(r => ({ id: r.id, name: r.name, score: r.health_score || 70 })),
          authority_rankings: storeAuthorities,
          contractor_rankings: storeContractors.map(c => ({
            name: c.name,
            avg_health_score: c.avg_health_score || 70,
            projects_completed: c.projects_completed || 5,
            allocated_budget: c.allocated_budget || 0,
            spent_budget: c.spent_budget || 0
          }))
        });
      })
      .finally(() => setLoading(false));
  }, [filters]);

  const totals = analyticsData?.totals || {
    complaints: 0,
    resolved: 0,
    resolution_rate: 0,
    roads: 0,
    budget_allocated: 0,
    budget_spent: 0,
    budget_remaining: 0,
    road_length_km: 0,
    footpath_coverage: 0,
    high_risk_wards: 0,
    wards: 0
  };

  const trends = analyticsData?.complaint_trends || [];
  const severityData = (analyticsData?.severity || []).map(item => ({
    name: item.name,
    value: item.value,
    color: SEVERITY_COLORS[item.name] || '#64748b'
  }));

  const roadHealthData = (analyticsData?.road_health_heatmap || []).slice(0, 8);
  const wardRankingData = (analyticsData?.ward_rankings || []).slice(0, 8).map(w => ({
    name: w.name || w.ward_name,
    score: w.health_score || 0,
    footpath: w.footpath_coverage_percent || 0,
  }));
  const complaintDensityData = (analyticsData?.complaint_density || []).slice(0, 8);
  const authorityData = (analyticsData?.authority_rankings || []).map(auth => ({
    name: auth.shortName || auth.name,
    time: auth.response_hours || 0,
    target: 12.0
  }));

  const contractorData = (analyticsData?.contractor_rankings || []).map(con => ({
    name: con.name,
    health: con.avg_health_score || con.health || 0,
    projects: con.projects_completed || con.projects || 0,
    budget: (con.allocated_budget || 0) / 10000000,
    spent: (con.spent_budget || 0) / 10000000
  }));

  const activeWards = [...new Set(roads.map(r => r.ward).filter(Boolean))];

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6 space-y-6">
      <PageHeader
        title="Global Road Watch Audit Center"
        subtitle="Real-time road condition indexing, authority response diagnostics, and municipal budgets auditing."
        badge="Analytics Dashboard"
      />

      {/* Cascading Geographic Selector */}
      <GeoSelector onChange={setFilters} />

      {/* Primary Tabs */}
      <div className="flex bg-secondary/40 p-1.5 rounded-2xl border border-border/60 max-w-md">
        {[
          { id: 'performance', label: 'Road Analytics' },
          { id: 'budget', label: 'Budget Transparency' },
          { id: 'sources', label: 'Data Twin Layers' }
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold transition-all ${
              activeTab === tab.id
                ? 'bg-card text-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === 'performance' && (
        <>
          {/* KPI Stat Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            <StatCard icon={AlertTriangle} label="Total Area Reports" value={totals.complaints.toLocaleString()} color="blue" />
            <StatCard icon={Activity} label="Total Road Length" value={`${Number(totals.road_length_km || 0).toFixed(1)} km`} color="green" />
            <StatCard icon={CheckCircle} label="Footpath Coverage" value={`${totals.footpath_coverage || 0}%`} color="purple" />
            <StatCard icon={Clock} label="High Risk Wards" value={(totals.high_risk_wards || 0).toString()} color="red" />
          </div>

          {/* Charts Grid 1 */}
          <div className="grid lg:grid-cols-2 gap-4">
            {/* Dynamic Trend Chart */}
            <ChartCard
              title="Complaint & Repair Dynamics"
              subtitle="Monthly incident volume against contractor resolution schedules"
              badge="Dynamics"
            >
              <ResponsiveContainer width="100%" height={220}>
                <AreaChart data={trends}>
                  <defs>
                    <linearGradient id="colorComplaints" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.15} />
                      <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip contentStyle={{ borderRadius: '12px', border: '1px solid hsl(var(--border))', fontSize: '12px' }} />
                  <Area type="monotone" dataKey="value" stroke="#3b82f6" fill="url(#colorComplaints)" strokeWidth={2.5} name="Citizen Reports" />
                </AreaChart>
              </ResponsiveContainer>
            </ChartCard>

            {/* Severity Distribution */}
            <ChartCard
              title="Severity Distribution (AI Model Engine)"
              subtitle="Current active road issues sorted by distress severity"
              badge="AI Scan"
            >
              <ResponsiveContainer width="100%" height={220}>
                <PieChart>
                  <Pie
                    data={severityData}
                    cx="50%"
                    cy="50%"
                    innerRadius={55}
                    outerRadius={80}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {severityData.map((entry, i) => (
                      <Cell key={i} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={{ borderRadius: '12px', border: '1px solid hsl(var(--border))', fontSize: '12px' }} />
                  <Legend formatter={(v) => <span style={{ fontSize: '11px', fontWeight: 600 }} className="text-slate-300">{v}</span>} />
                </PieChart>
              </ResponsiveContainer>
            </ChartCard>
          </div>

          {/* Charts Grid 2 */}
          <div className="grid lg:grid-cols-2 gap-4">
            {/* Road Health Rankings */}
            <ChartCard
              title="Road Quality Index Rankings"
              subtitle="Denormalized average road health index by selected area"
              badge="OSM Data"
            >
              {roadHealthData.length === 0 ? (
                <div className="h-[220px] flex items-center justify-center text-xs text-muted-foreground">No roads match the current filters.</div>
              ) : (
                <ResponsiveContainer width="100%" height={220}>
                  <BarChart data={roadHealthData} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis type="number" domain={[0, 100]} tick={{ fontSize: 11 }} />
                    <YAxis type="category" dataKey="name" tick={{ fontSize: 10, fontWeight: 600 }} width={110} />
                    <Tooltip contentStyle={{ borderRadius: '12px', border: '1px solid hsl(var(--border))', fontSize: '12px' }} />
                    <Bar dataKey="score" radius={[0, 6, 6, 0]} name="Quality Index">
                      {roadHealthData.map((w, i) => (
                        <Cell key={i} fill={(w.score || w.health_score) >= 75 ? '#22c55e' : (w.score || w.health_score) >= 55 ? '#eab308' : (w.score || w.health_score) >= 35 ? '#f97316' : '#ef4444'} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              )}
            </ChartCard>

            {/* Ward-wise Response Speeds */}
            <ChartCard
              title="Authority Response SLA Audits"
              subtitle="Average time to resolve critical reports against statutory targets"
              badge="SLA Audits"
            >
              {authorityData.length === 0 ? (
                <div className="h-[220px] flex items-center justify-center text-xs text-muted-foreground">No authority records match the current filters.</div>
              ) : (
                <ResponsiveContainer width="100%" height={220}>
                  <BarChart data={authorityData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis dataKey="name" tick={{ fontSize: 9, fontWeight: 600 }} />
                    <YAxis tick={{ fontSize: 11 }} unit="h" />
                    <Tooltip contentStyle={{ borderRadius: '12px', border: '1px solid hsl(var(--border))', fontSize: '12px' }} formatter={(v) => `${v} hours`} />
                    <Legend formatter={(v) => <span style={{ fontSize: '11px' }} className="text-slate-300">{v}</span>} />
                    <Bar dataKey="time" fill="#ef4444" radius={[6, 6, 0, 0]} name="Actual Turnaround" />
                    <Bar dataKey="target" fill="#64748b" radius={[6, 6, 0, 0]} name="SLA Target" opacity={0.6} />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </ChartCard>
          </div>

          {/* Top Contractor Scorecard */}
          <ChartCard
            title="Ward Health Rankings"
            subtitle="Automatically generated ward scores from uploaded city datasets"
            badge="Ward Profiles"
          >
            {wardRankingData.length === 0 ? (
              <div className="h-[220px] flex items-center justify-center text-xs text-muted-foreground">No ward records found.</div>
            ) : (
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={wardRankingData} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis type="number" domain={[0, 100]} tick={{ fontSize: 11 }} />
                  <YAxis type="category" dataKey="name" tick={{ fontSize: 10, fontWeight: 600 }} width={130} />
                  <Tooltip contentStyle={{ borderRadius: '12px', border: '1px solid hsl(var(--border))', fontSize: '12px' }} />
                  <Bar dataKey="score" radius={[0, 6, 6, 0]} name="Ward Health">
                    {wardRankingData.map((w, i) => (
                      <Cell key={i} fill={w.score >= 75 ? '#22c55e' : w.score >= 55 ? '#eab308' : w.score >= 35 ? '#f97316' : '#ef4444'} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )}
          </ChartCard>

          <ChartCard
            title="Complaint Density"
            subtitle="Complaints normalized against ward road length"
            badge="Real Data"
          >
            {complaintDensityData.length === 0 ? (
              <div className="h-[220px] flex items-center justify-center text-xs text-muted-foreground">No complaint density records found.</div>
            ) : (
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={complaintDensityData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="ward" tick={{ fontSize: 9, fontWeight: 600 }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip contentStyle={{ borderRadius: '12px', border: '1px solid hsl(var(--border))', fontSize: '12px' }} />
                  <Bar dataKey="per_km" fill="#3b82f6" radius={[6, 6, 0, 0]} name="Complaints per km" />
                </BarChart>
              </ResponsiveContainer>
            )}
          </ChartCard>

          <ChartCard
            title="Contractor Accountability Diagnostics"
            subtitle="Evaluating contractor quality parameters: average road health index vs projects built"
            badge="Performance"
          >
            {contractorData.length === 0 ? (
              <div className="h-[230px] flex items-center justify-center text-xs text-muted-foreground">No contractors match the current filters.</div>
            ) : (
              <ResponsiveContainer width="100%" height={230}>
                <BarChart data={contractorData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                  <YAxis domain={[0, 100]} tick={{ fontSize: 11 }} />
                  <Tooltip contentStyle={{ borderRadius: '12px', border: '1px solid hsl(var(--border))', fontSize: '12px' }} />
                  <Legend formatter={(v) => <span style={{ fontSize: '11px' }} className="text-slate-300">{v}</span>} />
                  <Bar dataKey="health" fill="#8b5cf6" radius={[4, 4, 0, 0]} name="Avg Quality Score" />
                  <Bar dataKey="projects" fill="#3b82f6" radius={[4, 4, 0, 0]} name="Projects Done" />
                </BarChart>
              </ResponsiveContainer>
            )}
          </ChartCard>
        </>
      )}

      {activeTab === 'budget' && (
        <div className="space-y-6">
          {/* Budget KPI cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-card border border-border/60 rounded-2xl p-5 shadow-sm space-y-2">
              <div className="flex justify-between items-center text-xs text-muted-foreground font-bold uppercase">
                <span>Total Budget Allocated</span>
                <DollarSign className="w-4 h-4 text-primary shrink-0" />
              </div>
              <div className="text-3xl font-black font-sora text-white">₹{(totals.budget_allocated / 10000000).toFixed(2)} <span className="text-xs text-muted-foreground font-semibold">Cr</span></div>
              <p className="text-[11px] text-muted-foreground">Active Area Special Infrastructure Allocations</p>
            </div>
            <div className="bg-card border border-border/60 rounded-2xl p-5 shadow-sm space-y-2">
              <div className="flex justify-between items-center text-xs text-muted-foreground font-bold uppercase">
                <span>Total Spent (Contracted)</span>
                <CheckCircle className="w-4 h-4 text-green-500 shrink-0" />
              </div>
              <div className="text-3xl font-black font-sora text-green-500">₹{(totals.budget_spent / 10000000).toFixed(2)} <span className="text-xs text-muted-foreground font-semibold">Cr</span></div>
              <p className="text-[11px] text-muted-foreground">Disbursed upon third-party AI inspection verify</p>
            </div>
            <div className="bg-card border border-border/60 rounded-2xl p-5 shadow-sm space-y-2">
              <div className="flex justify-between items-center text-xs text-muted-foreground font-bold uppercase">
                <span>Remaining Reserve</span>
                <Globe className="w-4 h-4 text-blue-500 shrink-0" />
              </div>
              <div className="text-3xl font-black font-sora text-blue-500">₹{(totals.budget_remaining / 10000000).toFixed(2)} <span className="text-xs text-muted-foreground font-semibold">Cr</span></div>
              <p className="text-[11px] text-muted-foreground">Uncommitted capital for weather contingencies</p>
            </div>
          </div>

          {/* Charts Row */}
          <div className="grid lg:grid-cols-2 gap-4">
            {/* Contractor Budget Utilization progress bars */}
            <ChartCard
              title="Contractor Budget Utilization Audits"
              subtitle="Checking allocated vs spent limits per assigned contractor (in ₹ Crore)"
              badge="Budget Spent"
            >
              {contractorData.length === 0 ? (
                <div className="h-[220px] flex items-center justify-center text-xs text-muted-foreground">No contractor budget details found.</div>
              ) : (
                <div className="space-y-4 pt-2">
                  {contractorData.map(c => {
                    const percent = c.budget > 0 ? Math.round((c.spent / c.budget) * 100) : 0;
                    return (
                      <div key={c.name} className="space-y-1">
                        <div className="flex justify-between items-center text-xs">
                          <span className="font-semibold text-foreground text-slate-300">{c.name}</span>
                          <span className="text-muted-foreground">
                            ₹{c.spent.toFixed(2)}Cr spent / ₹{c.budget.toFixed(2)}Cr ({percent}%)
                          </span>
                        </div>
                        <div className="h-2 bg-secondary rounded-full overflow-hidden">
                          <div
                            className="h-full rounded-full bg-primary"
                            style={{ width: `${percent}%` }}
                          ></div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </ChartCard>

            <ChartCard
              title="Geographical Capital Split"
              subtitle="Current road budget segments vs remaining assets"
              badge="Split"
            >
              <div className="space-y-4 pt-2 text-slate-300 text-xs">
                <div className="flex justify-between border-b border-border/40 pb-2">
                  <span>Total Active Roads Indexed</span>
                  <span className="font-bold text-white">{roads.length}</span>
                </div>
                <div className="flex justify-between border-b border-border/40 pb-2">
                  <span>Avg Budget per Road</span>
                  <span className="font-bold text-white">₹{(roads.reduce((s, r) => s + Number(r.allocated_budget || 0), 0) / (roads.length || 1) / 100000).toFixed(1)} Lakh</span>
                </div>
                <div className="flex justify-between border-b border-border/40 pb-2">
                  <span>Highest Project Cost</span>
                  <span className="font-bold text-emerald-400">₹{(Math.max(...roads.map(r => Number(r.allocated_budget || 0)), 0) / 10000000).toFixed(2)} Cr</span>
                </div>
              </div>
            </ChartCard>
          </div>

          {/* Road Budget Allocation and Spend Table */}
          <div className="bg-card border border-border/60 rounded-2xl p-5 space-y-4">
            <div>
              <h3 className="font-semibold text-white font-sora text-sm sm:text-base">Master Road Budget Ledger</h3>
              <p className="text-xs text-muted-foreground">Full financial transparency of pilot road constructions and repairs.</p>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead>
                  <tr className="border-b border-border text-muted-foreground font-bold">
                    <th className="py-2.5 px-2 text-slate-300">Road segment</th>
                    <th className="py-2.5 px-2 text-center text-slate-300">Allocated</th>
                    <th className="py-2.5 px-2 text-center text-slate-300">Spent</th>
                    <th className="py-2.5 px-2 text-center text-slate-300">Remaining</th>
                    <th className="py-2.5 px-2 text-center text-slate-300">Health</th>
                    <th className="py-2.5 px-2 text-center text-slate-300">Utilization</th>
                    <th className="py-2.5 px-2 text-slate-300">Funding Source</th>
                  </tr>
                </thead>
                <tbody>
                  {roads.map(r => {
                    const percent = r.allocated_budget > 0 ? Math.round((r.spent_budget / r.allocated_budget) * 100) : 0;
                    return (
                      <tr key={r.id} className="border-b border-border/40 hover:bg-secondary/20 transition-colors">
                        <td className="py-3 px-2 font-semibold text-white">{r.name || r.road_name}</td>
                        <td className="py-3 px-2 text-center text-slate-300">₹{(Number(r.allocated_budget || 0) / 100000).toFixed(1)} L</td>
                        <td className="py-3 px-2 text-center text-green-500 font-semibold">₹{(Number(r.spent_budget || 0) / 100000).toFixed(1)} L</td>
                        <td className="py-3 px-2 text-center text-blue-500">₹{(Number(r.budget_remaining || r.allocated_budget - r.spent_budget || 0) / 100000).toFixed(1)} L</td>
                        <td className="py-3 px-2 text-center">
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            r.health_score >= 80 ? 'bg-green-500/10 text-green-400 border border-green-500/20' :
                            r.health_score >= 60 ? 'bg-yellow-500/10 text-yellow-400 border border-yellow-500/20' :
                            r.health_score >= 40 ? 'bg-orange-500/10 text-orange-400 border border-orange-500/20' :
                            'bg-red-500/10 text-red-400 border border-red-500/20'
                          }`}>{r.health_score || r.current_health_score || 0}%</span>
                        </td>
                        <td className="py-3 px-2 text-center">
                          <div className="flex items-center gap-1.5 justify-center">
                            <div className="w-10 h-1.5 bg-secondary rounded-full overflow-hidden shrink-0">
                              <div className="h-full bg-primary rounded-full" style={{ width: `${percent}%` }}></div>
                            </div>
                            <span className="font-bold text-[10px] text-slate-300">{percent}%</span>
                          </div>
                        </td>
                        <td className="py-3 px-2 text-muted-foreground">{r.funding_source || 'PMC Capital Fund'}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'sources' && (
        <div className="space-y-6">
          {/* Information Integration Layer (Data Sources) */}
          <div className="bg-card border border-border/60 rounded-2xl p-5 space-y-4">
            <div className="flex items-center gap-2">
              <Database className="w-5 h-5 text-primary shrink-0" />
              <div>
                <h3 className="font-semibold text-white font-sora text-sm sm:text-base">Information Integration Layer</h3>
                <p className="text-xs text-muted-foreground">Combining heterogeneous data sources to feed the Road Watch Digital Twin.</p>
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-4 pt-2">
              {DATA_SOURCES.map(ds => (
                <div key={ds.id} className="bg-secondary/30 rounded-xl p-4 border border-border/40 space-y-2">
                  <div className="flex items-start justify-between">
                    <div>
                      <h4 className="font-bold text-sm text-white">{ds.name}</h4>
                      <div className="text-[10px] text-muted-foreground mt-0.5 font-semibold uppercase tracking-wider">{ds.type}</div>
                    </div>
                    <Badge variant="outline" className="border-primary/20 text-primary font-bold text-[9px] bg-primary/5">{ds.trust}</Badge>
                  </div>
                  <p className="text-xs text-slate-400">{ds.role}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Scalability Architecture Section */}
          <div className="bg-card border border-border/60 rounded-2xl p-5 space-y-4">
            <div className="flex items-center gap-2">
              <Globe className="w-5 h-5 text-indigo-500 shrink-0" />
              <div>
                <h3 className="font-semibold text-white font-sora text-sm sm:text-base">Scalability & Hierarchical Architecture</h3>
                <p className="text-xs text-muted-foreground">Engineered for localized PMC pilot while scaling to national and global hierarchies.</p>
              </div>
            </div>

            {/* Hierarchical Chain Visualization */}
            <div className="flex flex-col md:flex-row items-center justify-between gap-3 bg-secondary/30 rounded-xl p-5 border border-border/40 max-w-2xl mx-auto">
              {[
                { label: 'Country', val: filters.country || 'Global Scale' },
                { label: 'State', val: filters.state || 'All States' },
                { label: 'District', val: filters.district || 'All Districts' },
                { label: 'Ward', val: (filters.ward || 'All Wards').slice(0, 15) + (filters.ward?.length > 15 ? '...' : '') },
              ].map((step, idx) => (
                <div key={step.label} className="flex items-center gap-2 w-full md:w-auto">
                  <div className="bg-card rounded-lg p-2.5 border border-border/50 text-center flex-1 md:flex-none md:min-w-[100px]">
                    <div className="text-[9px] font-bold uppercase text-muted-foreground">{step.label}</div>
                    <div className="text-xs font-black text-white mt-0.5">{step.val}</div>
                  </div>
                  {idx < 3 && (
                    <div className="text-muted-foreground text-sm font-bold rotate-90 md:rotate-0 mx-auto md:mx-0 shrink-0">
                      →
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* Scalability Matrix */}
            <div className="grid md:grid-cols-3 gap-3 pt-2 text-center text-slate-300">
              <div className="bg-blue-500/5 border border-blue-500/20 rounded-xl p-4 space-y-1">
                <Badge className="bg-blue-600 text-white font-bold hover:bg-blue-600 text-[10px]">ACTIVE INDEX</Badge>
                <h4 className="font-bold text-sm text-blue-400 mt-1.5">Pune PMC</h4>
                <p className="text-[11px] text-slate-400">7 major municipal roads and budgets fully digitalized.</p>
              </div>
              <div className="bg-emerald-500/5 border border-emerald-500/20 rounded-xl p-4 space-y-1">
                <Badge className="bg-emerald-600 text-white font-bold hover:bg-emerald-600 text-[10px]">NATIONWIDE REACH</Badge>
                <h4 className="font-bold text-sm text-emerald-400 mt-1.5">India Coverage</h4>
                <p className="text-[11px] text-slate-400">Configured schemas for standard NH/SH/MDR networks across states.</p>
              </div>
              <div className="bg-purple-500/5 border border-purple-500/20 rounded-xl p-4 space-y-1">
                <Badge className="bg-purple-600 text-white font-bold hover:bg-purple-600 text-[10px]">FUTURE ROADMAP</Badge>
                <h4 className="font-bold text-sm text-purple-400 mt-1.5">Global Ready</h4>
                <p className="text-[11px] text-slate-400">Geo-coordinates structure scales to standard EPSG:4326 projections worldwide.</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
