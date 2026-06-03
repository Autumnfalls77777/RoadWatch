import { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { motion } from 'framer-motion';
import { AlertTriangle, MapPin, School, Hospital, Activity, TrendingUp } from 'lucide-react';
import { RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip } from 'recharts';
import PageHeader from '@/components/shared/PageHeader';

const riskData = [
  {
    road: 'Western Express Highway',
    city: 'Mumbai',
    overall_risk: 91,
    riskLevel: 'Critical',
    factors: { potholes: 95, severity: 88, traffic: 100, road_type: 70, schools: 60, hospitals: 75, intersections: 85, accidents: 90 },
    details: { potholes: 34, accidents_ytd: 18, schools_nearby: 3, hospitals_nearby: 2 },
  },
  {
    road: 'Ring Road Sector 12',
    city: 'Pune',
    overall_risk: 87,
    riskLevel: 'Critical',
    factors: { potholes: 80, severity: 95, traffic: 75, road_type: 65, schools: 55, hospitals: 70, intersections: 90, accidents: 85 },
    details: { potholes: 24, accidents_ytd: 12, schools_nearby: 2, hospitals_nearby: 1 },
  },
  {
    road: 'NH-48 Gurgaon',
    city: 'Delhi',
    overall_risk: 74,
    riskLevel: 'High',
    factors: { potholes: 70, severity: 80, traffic: 90, road_type: 55, schools: 45, hospitals: 50, intersections: 75, accidents: 72 },
    details: { potholes: 18, accidents_ytd: 9, schools_nearby: 4, hospitals_nearby: 3 },
  },
  {
    road: 'Outer Ring Road',
    city: 'Bengaluru',
    overall_risk: 58,
    riskLevel: 'Moderate',
    factors: { potholes: 55, severity: 60, traffic: 80, road_type: 50, schools: 40, hospitals: 45, intersections: 55, accidents: 50 },
    details: { potholes: 22, accidents_ytd: 5, schools_nearby: 6, hospitals_nearby: 4 },
  },
  {
    road: 'MG Road',
    city: 'Bengaluru',
    overall_risk: 29,
    riskLevel: 'Low',
    factors: { potholes: 20, severity: 30, traffic: 55, road_type: 40, schools: 30, hospitals: 35, intersections: 25, accidents: 20 },
    details: { potholes: 8, accidents_ytd: 2, schools_nearby: 1, hospitals_nearby: 2 },
  },
];

const RISK_CONFIG = {
  Critical: { color: '#ef4444', bg: 'bg-red-50', border: 'border-red-200', text: 'text-red-800', badge: 'bg-red-100 text-red-700 border-red-300', icon: '🚨' },
  High: { color: '#f97316', bg: 'bg-orange-50', border: 'border-orange-200', text: 'text-orange-800', badge: 'bg-orange-100 text-orange-700 border-orange-300', icon: '⚠️' },
  Moderate: { color: '#eab308', bg: 'bg-yellow-50', border: 'border-yellow-200', text: 'text-yellow-800', badge: 'bg-yellow-100 text-yellow-700 border-yellow-300', icon: '⚡' },
  Low: { color: '#22c55e', bg: 'bg-green-50', border: 'border-green-200', text: 'text-green-800', badge: 'bg-green-100 text-green-700 border-green-300', icon: '✅' },
};

function RiskCard({ road, index }) {
  const [expanded, setExpanded] = useState(false);
  const cfg = RISK_CONFIG[road.riskLevel];
  const radarData = Object.entries(road.factors).map(([key, value]) => ({
    metric: key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
    value,
  }));

  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.07 }}
      className={`rounded-2xl border-2 p-5 ${cfg.bg} ${cfg.border}`}>
      <div className="flex items-start justify-between mb-3">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-lg">{cfg.icon}</span>
            <h3 className="font-bold text-base font-sora">{road.road}</h3>
          </div>
          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            <MapPin className="w-3 h-3" />
            {road.city}
          </div>
        </div>
        <div className="text-right">
          <div className="text-3xl font-bold font-sora" style={{ color: cfg.color }}>{road.overall_risk}</div>
          <div className="text-xs text-muted-foreground">Risk Score</div>
        </div>
      </div>

      <div className="h-2 bg-white/60 rounded-full overflow-hidden mb-3">
        <div className="h-full rounded-full transition-all duration-700" style={{ width: `${road.overall_risk}%`, background: cfg.color }}></div>
      </div>

      <div className="flex items-center gap-2 mb-3">
        <span className={`text-xs font-semibold px-2.5 py-1 rounded-full border ${cfg.badge}`}>{road.riskLevel} Risk</span>
        <div className="flex items-center gap-3 text-xs text-muted-foreground ml-auto">
          <span className="flex items-center gap-1"><AlertTriangle className="w-3 h-3" />{road.details.potholes} potholes</span>
          <span className="flex items-center gap-1"><Activity className="w-3 h-3" />{road.details.accidents_ytd} accidents YTD</span>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2 text-xs mb-3">
        <div className="flex items-center gap-1.5 bg-white/50 rounded-xl px-2.5 py-1.5">
          <School className="w-3 h-3 text-blue-500" />
          <span>{road.details.schools_nearby} schools nearby</span>
        </div>
        <div className="flex items-center gap-1.5 bg-white/50 rounded-xl px-2.5 py-1.5">
          <Hospital className="w-3 h-3 text-red-500" />
          <span>{road.details.hospitals_nearby} hospitals nearby</span>
        </div>
      </div>

      <button onClick={() => setExpanded(!expanded)} className="text-xs text-muted-foreground hover:text-foreground transition-colors">
        {expanded ? '▲ Hide risk breakdown' : '▼ Show risk breakdown'}
      </button>

      {expanded && (
        <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="mt-3">
          <ResponsiveContainer width="100%" height={180}>
            <RadarChart data={radarData.slice(0, 6)}>
              <PolarGrid />
              <PolarAngleAxis dataKey="metric" tick={{ fontSize: 9 }} />
              <PolarRadiusAxis domain={[0, 100]} tick={{ fontSize: 8 }} />
              <Radar dataKey="value" stroke={cfg.color} fill={cfg.color} fillOpacity={0.2} strokeWidth={2} />
            </RadarChart>
          </ResponsiveContainer>
        </motion.div>
      )}
    </motion.div>
  );
}

export default function AccidentRiskPage() {
  const criticalCount = riskData.filter(r => r.riskLevel === 'Critical').length;
  const highCount = riskData.filter(r => r.riskLevel === 'High').length;

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6">
      <PageHeader
        title="Accident Risk Engine"
        subtitle="AI-calculated accident risk scores for every road based on 8 safety factors"
        badge="Safety Intelligence"
      />

      {/* Summary */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
        {[
          { label: 'Critical Risk Roads', value: criticalCount, icon: '🚨', color: 'bg-red-50 border-red-200 text-red-800' },
          { label: 'High Risk Roads', value: highCount, icon: '⚠️', color: 'bg-orange-50 border-orange-200 text-orange-800' },
          { label: 'Roads Analysed', value: riskData.length, icon: '🔍', color: 'bg-blue-50 border-blue-200 text-blue-800' },
          { label: 'Risk Factors Used', value: 8, icon: '📊', color: 'bg-purple-50 border-purple-200 text-purple-800' },
        ].map((s, i) => (
          <motion.div key={s.label} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
            className={`rounded-2xl p-4 border ${s.color}`}>
            <div className="text-2xl mb-1">{s.icon}</div>
            <div className="text-2xl font-bold font-sora">{s.value}</div>
            <div className="text-xs font-medium opacity-70">{s.label}</div>
          </motion.div>
        ))}
      </div>

      {/* Risk Factors Legend */}
      <div className="bg-card rounded-2xl border border-border/60 p-4 mb-6">
        <h3 className="font-semibold text-sm mb-3">Risk Factor Breakdown</h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
          {['Pothole Count', 'Pothole Severity', 'Traffic Density', 'Road Type', 'Nearby Schools', 'Nearby Hospitals', 'Intersections', 'Accident History'].map(f => (
            <div key={f} className="flex items-center gap-1.5 bg-secondary/50 rounded-xl px-2.5 py-1.5">
              <div className="w-1.5 h-1.5 rounded-full bg-primary flex-shrink-0"></div>
              <span>{f}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="space-y-4">
        {riskData.sort((a, b) => b.overall_risk - a.overall_risk).map((r, i) => (
          <RiskCard key={r.road} road={r} index={i} />
        ))}
      </div>
    </div>
  );
}