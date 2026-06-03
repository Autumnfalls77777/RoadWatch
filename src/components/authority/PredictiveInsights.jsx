import { useState } from 'react';
import { motion } from 'framer-motion';
import { Brain, AlertTriangle, TrendingDown, Wrench, Droplets, Clock, Calendar, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { base44 } from '@/api/base44Client';

const predictionData = [
  {
    road: 'NH-48 Gurgaon Stretch',
    city: 'Delhi',
    risk: 89,
    riskLevel: 'Critical',
    factors: ['Road Age: 8 years', 'Heavy Monsoon Forecast', 'Existing 4 cracks', 'Traffic: Very High'],
    window: 'Within 2 weeks',
    recommendation: 'Emergency resurfacing before monsoon season',
    color: 'border-red-300 bg-red-50',
    badge: 'bg-red-100 text-red-700',
    icon: '🚨',
  },
  {
    road: 'Western Express Highway',
    city: 'Mumbai',
    risk: 76,
    riskLevel: 'High',
    factors: ['Road Age: 5 years', 'Monsoon Forecast', '34 complaints filed', 'Traffic: Very High'],
    window: 'Within 4 weeks',
    recommendation: 'Pothole patching and drainage clearing before monsoon',
    color: 'border-orange-300 bg-orange-50',
    badge: 'bg-orange-100 text-orange-700',
    icon: '⚠️',
  },
  {
    road: 'Ring Road Sector 12',
    city: 'Pune',
    risk: 82,
    riskLevel: 'Critical',
    factors: ['Structural crack detected', 'Heavy vehicle load', 'No repair in 3 years', 'Waterlogging history'],
    window: 'Immediate action',
    recommendation: 'Structural assessment and emergency repair approval',
    color: 'border-red-300 bg-red-50',
    badge: 'bg-red-100 text-red-700',
    icon: '🚨',
  },
  {
    road: 'Outer Ring Road Hyderabad',
    city: 'Hyderabad',
    risk: 54,
    riskLevel: 'Moderate',
    factors: ['Road Age: 3 years', 'Moderate traffic', 'Minor cracks visible', 'Average complaints'],
    window: '6-8 weeks',
    recommendation: 'Preventive crack sealing and surface treatment',
    color: 'border-yellow-300 bg-yellow-50',
    badge: 'bg-yellow-100 text-yellow-700',
    icon: '⚡',
  },
  {
    road: 'MG Road Bengaluru',
    city: 'Bengaluru',
    risk: 28,
    riskLevel: 'Low',
    factors: ['Road Age: 1 year', 'Recently repaired', 'Low complaints', 'Good drainage'],
    window: '6+ months',
    recommendation: 'Routine monitoring only',
    color: 'border-green-300 bg-green-50',
    badge: 'bg-green-100 text-green-700',
    icon: '✅',
  },
];

const riskColors = { Critical: '#ef4444', High: '#f97316', Moderate: '#eab308', Low: '#22c55e' };

function RiskMeter({ risk }) {
  const color = risk >= 75 ? '#ef4444' : risk >= 55 ? '#f97316' : risk >= 35 ? '#eab308' : '#22c55e';
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-2 bg-secondary rounded-full overflow-hidden">
        <div className="h-full rounded-full transition-all duration-700" style={{ width: `${risk}%`, background: color }}></div>
      </div>
      <span className="text-xs font-bold w-8 text-right" style={{ color }}>{risk}%</span>
    </div>
  );
}

export default function PredictiveInsights() {
  const [loading, setLoading] = useState(false);
  const [aiReport, setAiReport] = useState(null);

  const generateReport = async () => {
    setLoading(true);
    const result = await base44.integrations.Core.InvokeLLM({
      prompt: `You are a road infrastructure AI analyst for India's RoadWatch platform.

Generate a realistic predictive maintenance report for Indian roads considering:
- Monsoon season forecast (heavy rainfall expected in Maharashtra, Karnataka, Delhi-NCR)
- Road age data: multiple roads 5-10 years old
- Traffic density: high in metro areas
- Existing complaint data: 425+ complaints in Mumbai, 612 in Delhi

Output a structured insight report with:
1. Top 3 roads most likely to deteriorate in next 30 days
2. Estimated repair cost savings if preventive maintenance done now vs emergency repairs
3. Recommended maintenance priority order
4. Risk score for each region (Maharashtra, Karnataka, Delhi-NCR)

Keep it concise, data-driven, and suitable for government authority review.`,
      response_json_schema: {
        type: 'object',
        properties: {
          top_risk_roads: { type: 'array', items: { type: 'object', properties: { road: { type: 'string' }, risk: { type: 'string' }, reason: { type: 'string' } } } },
          savings_insight: { type: 'string' },
          priority_order: { type: 'array', items: { type: 'string' } },
          region_risks: { type: 'object' },
          summary: { type: 'string' },
        }
      }
    });
    setAiReport(result);
    setLoading(false);
  };

  return (
    <div className="space-y-4">
      {/* Header card */}
      <div className="bg-gradient-to-br from-purple-50 to-blue-50 border border-purple-200 rounded-2xl p-5">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Brain className="w-5 h-5 text-purple-600" />
            <h3 className="font-semibold text-purple-900">AI Predictive Road Failure Engine</h3>
          </div>
          <Button onClick={generateReport} disabled={loading} size="sm" className="h-8 text-xs bg-purple-600 hover:bg-purple-700 text-white">
            {loading ? (
              <><div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin mr-1" />Analyzing...</>
            ) : (
              <><Brain className="w-3 h-3 mr-1" />Generate AI Report</>
            )}
          </Button>
        </div>
        <p className="text-xs text-purple-700">
          Analyzes road age, rainfall forecasts, complaint patterns, traffic density, and historical data to predict infrastructure failures before they occur.
        </p>
      </div>

      {/* AI Report */}
      {aiReport && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
          className="bg-card rounded-2xl border border-purple-200 p-5">
          <h3 className="font-semibold text-sm mb-3 flex items-center gap-2 text-purple-900">
            <Brain className="w-4 h-4" />AI Analysis Report
          </h3>
          {aiReport.summary && <p className="text-sm text-foreground mb-3 leading-relaxed">{aiReport.summary}</p>}
          {aiReport.savings_insight && (
            <div className="bg-green-50 border border-green-200 rounded-xl p-3 mb-3 text-xs text-green-800">
              💰 <strong>Cost Savings Insight:</strong> {aiReport.savings_insight}
            </div>
          )}
          {aiReport.top_risk_roads?.length > 0 && (
            <div className="mb-3">
              <div className="text-xs font-semibold text-muted-foreground mb-2">TOP RISK ROADS</div>
              {aiReport.top_risk_roads.map((r, i) => (
                <div key={i} className="flex items-start gap-2 mb-2 text-xs">
                  <span className="text-lg">{i === 0 ? '🔴' : i === 1 ? '🟠' : '🟡'}</span>
                  <div><span className="font-medium">{r.road}</span><span className="text-muted-foreground"> — {r.risk}</span><div className="text-muted-foreground mt-0.5">{r.reason}</div></div>
                </div>
              ))}
            </div>
          )}
          {aiReport.priority_order?.length > 0 && (
            <div>
              <div className="text-xs font-semibold text-muted-foreground mb-2">PRIORITY ORDER</div>
              {aiReport.priority_order.map((p, i) => (
                <div key={i} className="flex items-center gap-2 text-xs py-1">
                  <span className="w-5 h-5 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold">{i + 1}</span>
                  <span>{p}</span>
                </div>
              ))}
            </div>
          )}
        </motion.div>
      )}

      {/* Prediction Cards */}
      <div className="grid sm:grid-cols-2 gap-3">
        {predictionData.map((pred, i) => (
          <motion.div key={i} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.06 }}
            className={`rounded-2xl border p-4 ${pred.color}`}>
            <div className="flex items-start justify-between mb-3">
              <div>
                <div className="flex items-center gap-2 mb-0.5">
                  <span className="text-base">{pred.icon}</span>
                  <span className="font-semibold text-sm">{pred.road}</span>
                </div>
                <div className="text-xs text-muted-foreground">{pred.city}</div>
              </div>
              <span className={`text-xs font-semibold px-2.5 py-1 rounded-full border ${pred.badge}`}>{pred.riskLevel}</span>
            </div>

            <div className="mb-3">
              <div className="text-xs text-muted-foreground mb-1">Failure Risk</div>
              <RiskMeter risk={pred.risk} />
            </div>

            <div className="flex flex-wrap gap-1 mb-3">
              {pred.factors.map(f => (
                <span key={f} className="text-xs px-2 py-0.5 bg-white/60 rounded-full border border-current/10 text-foreground">{f}</span>
              ))}
            </div>

            <div className="bg-white/50 rounded-xl p-2.5">
              <div className="flex items-center gap-1 mb-1">
                <Calendar className="w-3 h-3 text-muted-foreground" />
                <span className="text-xs font-medium">{pred.window}</span>
              </div>
              <div className="flex items-start gap-1">
                <Wrench className="w-3 h-3 text-muted-foreground mt-0.5 flex-shrink-0" />
                <span className="text-xs text-muted-foreground">{pred.recommendation}</span>
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}