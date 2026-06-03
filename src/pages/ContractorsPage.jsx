import { useState, useEffect } from 'react';
import { Award, Search, ShieldAlert, ShieldCheck } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { motion } from 'framer-motion';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import PageHeader from '@/components/shared/PageHeader';
import { SkeletonList } from '@/components/shared/SkeletonCard';
import EmptyState from '@/components/shared/EmptyState';

function getAccountabilityScore(contractor) {
  const roadCondition = contractor.avg_health_score || 0;
  const complaintScore = Math.max(0, 100 - (contractor.complaint_count || 0) * 2);
  const resolution = contractor.resolution_rate || 0;
  const citizenFeedback = Math.round(((contractor.citizen_rating || 0) / 5) * 100);
  const completion = contractor.repair_completion_rate || contractor.reliability_score || 0;
  return Math.round(
    roadCondition * 0.28 +
    complaintScore * 0.18 +
    resolution * 0.22 +
    citizenFeedback * 0.14 +
    completion * 0.18
  );
}

function getScoreLabel(score) {
  if (score >= 85) return { label: 'Excellent', className: 'bg-green-500/10 text-green-400 border-green-500/20' };
  if (score >= 70) return { label: 'Good', className: 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20' };
  if (score >= 50) return { label: 'Average', className: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20' };
  return { label: 'Poor', className: 'bg-red-500/10 text-red-400 border-red-500/20' };
}

function ScoreBar({ label, score, color = 'bg-primary' }) {
  return (
    <div>
      <div className="flex items-center justify-between text-xs mb-1">
        <span className="text-muted-foreground">{label}</span>
        <span className="font-semibold">{score || 0}</span>
      </div>
      <div className="h-1.5 bg-secondary rounded-full overflow-hidden">
        <div className={`h-full rounded-full ${color}`} style={{ width: `${score || 0}%` }} />
      </div>
    </div>
  );
}

function RankBadge({ rank }) {
  const colors = {
    1: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20',
    2: 'bg-slate-500/10 text-slate-300 border-slate-500/20',
    3: 'bg-orange-500/10 text-orange-400 border-orange-500/20',
  };
  return (
    <div className={`px-2.5 py-1 rounded-full border text-xs font-bold ${colors[rank] || 'bg-secondary text-slate-300 border-border'}`}>
      #{rank}
    </div>
  );
}

function ContractorCard({ contractor, rank, index }) {
  const score = contractor.accountability_score ?? getAccountabilityScore(contractor);
  const status = getScoreLabel(score);

  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.04 }}>
      <div className="bg-card rounded-2xl border border-border/60 p-5 card-hover">
        <div className="flex items-start justify-between gap-3 mb-4">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center text-lg font-bold text-primary shrink-0">
              {contractor.name?.[0]?.toUpperCase() || 'C'}
            </div>
            <div className="min-w-0">
              <h3 className="font-semibold text-foreground truncate">{contractor.name}</h3>
              <div className="text-xs text-muted-foreground truncate">{contractor.company_type} · {contractor.state || 'India'}</div>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <RankBadge rank={rank} />
            <span className={`px-2 py-0.5 rounded-full border text-[10px] font-bold ${status.className}`}>{status.label}</span>
            <div className="text-right">
              <div className="text-xl font-bold font-sora text-foreground">{score}</div>
              <div className="text-xs text-muted-foreground">Public Score</div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-4 gap-2 mb-4 text-center">
          {[
            ['Done', contractor.projects_completed || 0],
            ['Active', contractor.projects_active || 0],
            ['Complaints', contractor.complaint_count || 0],
            ['Health', contractor.avg_health_score || 0],
          ].map(([label, value]) => (
            <div key={label} className="bg-secondary/50 rounded-xl p-2.5">
              <div className="text-lg font-bold font-sora">{value}</div>
              <div className="text-xs text-muted-foreground">{label}</div>
            </div>
          ))}
        </div>

        {contractor.allocated_budget > 0 && (
          <div className="bg-secondary/30 rounded-xl p-3 mb-4 text-xs space-y-1.5 border border-border/40">
            <div className="flex justify-between items-center text-[10px] text-muted-foreground font-bold uppercase">
              <span>Budget Managed</span>
              <span className="text-foreground font-extrabold">₹{(contractor.allocated_budget / 10000000).toFixed(2)} Cr</span>
            </div>
            <div className="h-1.5 bg-secondary rounded-full overflow-hidden">
              <div className="h-full bg-green-500 rounded-full" style={{ width: `${(contractor.spent_budget / contractor.allocated_budget) * 100}%` }} />
            </div>
          </div>
        )}

        <div className="space-y-2">
          <ScoreBar label="Road Condition Score" score={contractor.avg_health_score} color="bg-blue-500" />
          <ScoreBar label="Resolution Performance" score={contractor.resolution_rate} color="bg-green-500" />
          <ScoreBar label="Repair Completion Rate" score={contractor.repair_completion_rate} color="bg-purple-500" />
          <div className="grid grid-cols-3 gap-2 pt-2 text-[10px] text-muted-foreground">
            <span>Citizen <strong className="text-foreground">{contractor.citizen_rating}/5</strong></span>
            <span>Reliability <strong className="text-foreground">{contractor.reliability_score}</strong></span>
            <span>Resolved <strong className="text-foreground">{contractor.resolution_rate}%</strong></span>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

function ContractorSection({ title, icon: Icon, contractors, tone }) {
  if (contractors.length === 0) return null;
  return (
    <section className="space-y-3">
      <div className="flex items-center gap-2">
        <Icon className={`w-4 h-4 ${tone}`} />
        <h2 className="font-bold text-sm">{title}</h2>
      </div>
      <div className="grid sm:grid-cols-2 gap-4">
        {contractors.map((c, i) => <ContractorCard key={c.id} contractor={c} rank={i + 1} index={i} />)}
      </div>
    </section>
  );
}

export default function ContractorsPage() {
  const [contractors, setContractors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState('accountability_score');

  useEffect(() => {
    base44.entities.Contractor.list('-created_date', 50)
      .then(setContractors)
      .catch(() => setContractors([]))
      .finally(() => setLoading(false));
  }, []);

  const filtered = contractors
    .filter(c => !search || c.name?.toLowerCase().includes(search.toLowerCase()) || c.state?.toLowerCase().includes(search.toLowerCase()))
    .map(c => ({ ...c, accountability_score: getAccountabilityScore(c) }))
    .sort((a, b) => (b[sortBy] || 0) - (a[sortBy] || 0));

  const top = filtered.filter(c => c.accountability_score >= 80);
  const average = filtered.filter(c => c.accountability_score >= 50 && c.accountability_score < 80);
  const highRisk = filtered.filter(c => c.accountability_score < 50);

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6">
      <PageHeader title="Contractor Rankings" subtitle="Public accountability scorecards for all road contractors" badge="Transparency" />

      <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 mb-6">
        <div className="flex items-start gap-3">
          <Award className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
          <div>
            <div className="font-semibold text-sm text-amber-800 mb-0.5">Public Accountability Score Engine</div>
            <p className="text-xs text-amber-700">Formula: Road Condition Score, Complaint Volume, Resolution Performance, Citizen Feedback, and Repair Completion Rate. Final score is 0-100.</p>
          </div>
        </div>
      </div>

      <div className="flex gap-3 mb-6 flex-wrap">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input placeholder="Search contractor..." value={search} onChange={e => setSearch(e.target.value)} className="pl-10 bg-card" />
        </div>
        <Select value={sortBy} onValueChange={setSortBy}>
          <SelectTrigger className="w-48 bg-card">
            <SelectValue placeholder="Sort by" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="accountability_score">Public Score</SelectItem>
            <SelectItem value="resolution_rate">Resolution Rate</SelectItem>
            <SelectItem value="repair_completion_rate">Repair Completion</SelectItem>
            <SelectItem value="reliability_score">Reliability</SelectItem>
            <SelectItem value="citizen_rating">Citizen Rating</SelectItem>
            <SelectItem value="avg_health_score">Road Health</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {loading ? <SkeletonList count={4} /> : filtered.length === 0 ? (
        <EmptyState icon={Award} title="No contractors found" description="No contractor data available yet." />
      ) : (
        <div className="space-y-8">
          <ContractorSection title="Top Performing Contractors" icon={Award} contractors={top} tone="text-green-600" />
          <ContractorSection title="Average Contractors" icon={ShieldCheck} contractors={average} tone="text-yellow-600" />
          <ContractorSection title="High Risk Contractors" icon={ShieldAlert} contractors={highRisk} tone="text-red-600" />
        </div>
      )}
    </div>
  );
}
