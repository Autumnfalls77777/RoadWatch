import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { motion } from 'framer-motion';
import { Wrench, Users, Calendar, DollarSign, CheckCircle, Clock, AlertCircle, TrendingUp, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { SeverityBadge, StatusBadge } from '@/components/shared/HealthBadge';
import AuthorityPageHeader from '@/components/authority/AuthorityPageHeader';
import RoleGuard from '@/components/authority/RoleGuard';

function RepairCard({ repair, contractorsList, onApprove }) {
  const [selectedContractor, setSelectedContractor] = useState(repair.contractor || '');
  const statusColor = { 
    Pending: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20', 
    Active: 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20', 
    Completed: 'bg-green-500/10 text-green-400 border-green-500/20' 
  };

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
      className="bg-card rounded-2xl border border-border/60 p-4 space-y-3">
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="font-bold text-sm text-white">{repair.road}</div>
          <div className="text-xs text-slate-400 mt-1">{repair.issue}</div>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <SeverityBadge severity={repair.severity} />
          <span className={`text-xs px-2.5 py-0.5 rounded-full font-semibold border ${statusColor[repair.status] || statusColor.Pending}`}>{repair.status}</span>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-2 text-center text-xs">
        <div className="bg-secondary/30 rounded-xl p-2 border border-border/40">
          <div className="font-bold text-white">₹{(repair.budget / 100000).toFixed(1)}L</div>
          <div className="text-[10px] text-muted-foreground uppercase">Budget</div>
        </div>
        <div className="bg-secondary/30 rounded-xl p-2 border border-border/40">
          <div className="font-bold text-white">{repair.estimated_days}d</div>
          <div className="text-[10px] text-muted-foreground uppercase">Est. Days</div>
        </div>
        <div className="bg-secondary/30 rounded-xl p-2 border border-border/40">
          <div className="font-bold text-white truncate max-w-full">{repair.contractor ? 'Assigned' : '—'}</div>
          <div className="text-[10px] text-muted-foreground uppercase">Contractor</div>
        </div>
      </div>

      {repair.status === 'Pending' && (
        <div className="flex gap-2 pt-1">
          <Select value={selectedContractor} onValueChange={setSelectedContractor}>
            <SelectTrigger className="h-8 text-xs flex-1 bg-slate-950/40 border-slate-800 text-slate-300">
              <SelectValue placeholder="Assign contractor..." />
            </SelectTrigger>
            <SelectContent className="bg-slate-900 border border-slate-800 text-slate-200">
              {contractorsList.map(c => <SelectItem key={c.id} value={c.name} className="text-xs hover:bg-slate-800">{c.name}</SelectItem>)}
            </SelectContent>
          </Select>
          <Button size="sm" className="h-8 text-xs bg-green-600 hover:bg-green-700 text-white font-bold" onClick={() => onApprove(repair.id, selectedContractor)}>
            Approve Work
          </Button>
        </div>
      )}

      {repair.contractor && repair.status === 'Active' && (
        <div className="flex items-center gap-2 pt-1">
          <div className="flex-1 h-1.5 bg-secondary rounded-full overflow-hidden">
            <div className="h-full bg-indigo-500 rounded-full" style={{ width: '45%' }}></div>
          </div>
          <span className="text-[10px] text-muted-foreground">45% complete</span>
        </div>
      )}
    </motion.div>
  );
}

export default function ExecutiveEngineerDashboard() {
  const [repairs, setRepairs] = useState([]);
  const [contractorsList, setContractorsList] = useState([]);
  const [complaints, setComplaints] = useState([]);
  const [tab, setTab] = useState('all');
  const [loading, setLoading] = useState(true);

  const loadData = async () => {
    try {
      const [events, conList, criticalComplaints] = await Promise.all([
        base44.entities.RoadTimeline.list('-event_date', 100),
        base44.entities.Contractor.list('-created_date', 100),
        base44.entities.Complaint.filter({ severity: 'Critical' }, '-created_date', 20)
      ]);

      const mapped = events.map(e => ({
        id: e.id,
        road: e.road_name || 'Pune Road',
        issue: e.description || e.repair_type || 'Routine patching',
        severity: e.severity || 'High',
        status: e.status || (e.event_type === 'Repair Completed' ? 'Completed' : 'Pending'),
        contractor: e.contractor || null,
        budget: e.repair_cost || 450000,
        estimated_days: e.estimated_days || 8
      }));

      setRepairs(mapped);
      setContractorsList(conList);
      setComplaints(criticalComplaints);
    } catch (err) {
      console.error('Failed to load dashboard statistics:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleApprove = async (id, contractorName) => {
    const repair = repairs.find(r => r.id === id);
    if (!repair) return;

    const con = contractorsList.find(c => c.name === contractorName);
    
    // Update repair status in backend
    await base44.entities.RoadTimeline.update(id, {
      status: 'Active',
      contractor: contractorName,
      contractor_id: con?.id || null
    });
    
    loadData();
  };

  const pending = repairs.filter(r => r.status === 'Pending');
  const active = repairs.filter(r => r.status === 'Active');
  const completed = repairs.filter(r => r.status === 'Completed');
  const totalBudget = repairs.reduce((sum, r) => sum + Number(r.budget || 0), 0);

  const filtered = tab === 'all' 
    ? repairs 
    : repairs.filter(r => r.status === (tab === 'pending' ? 'Pending' : tab === 'active' ? 'Active' : 'Completed'));

  if (loading) {
    return <div className="max-w-5xl mx-auto px-4 py-8 text-center text-slate-400">Loading pipeline parameters...</div>;
  }

  return (
    <RoleGuard allowedRoles={['executive_engineer', 'district_authority', 'state_authority', 'super_admin']}>
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6 text-slate-300">
        <AuthorityPageHeader role="Executive Engineer" title="Repair Management" subtitle="Approve repairs, assign contractors, manage budget allocations" level={4} />

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
          {[
            { label: 'Repairs Pending', value: pending.length, icon: '⏳', color: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20' },
            { label: 'Active Repairs', value: active.length, icon: '🔧', color: 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20' },
            { label: 'Completed Repairs', value: completed.length, icon: '✅', color: 'bg-green-500/10 text-green-400 border-green-500/20' },
            { label: 'Active Relaying Budget', value: `₹${(totalBudget / 100000).toFixed(0)}L`, icon: '💰', color: 'bg-purple-500/10 text-purple-400 border-purple-500/20' },
          ].map((s, i) => (
            <motion.div key={s.label} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
              className={`rounded-2xl p-4 border ${s.color}`}>
              <div className="text-2xl mb-1">{s.icon}</div>
              <div className="text-2xl font-bold font-sora text-white">{s.value}</div>
              <div className="text-xs font-semibold opacity-70 mt-1">{s.label}</div>
            </motion.div>
          ))}
        </div>

        <div className="grid lg:grid-cols-3 gap-4">
          <div className="lg:col-span-2">
            <div className="flex items-center gap-2 mb-4 bg-secondary/30 rounded-2xl p-1 border border-border/40">
              {[['all', 'All Repairs'], ['pending', '⏳ Pending'], ['active', '🔧 Active'], ['completed', '✅ Completed']].map(([key, label]) => (
                <button key={key} onClick={() => setTab(key)}
                  className={`flex-1 py-1.5 px-2 rounded-xl text-xs font-semibold transition-all ${tab === key ? 'bg-card text-white shadow-sm' : 'text-slate-400 hover:text-white'}`}>
                  {label}
                </button>
              ))}
            </div>
            <div className="space-y-3">
              {filtered.map((r, i) => <RepairCard key={r.id} repair={r} contractorsList={contractorsList} onApprove={handleApprove} />)}
            </div>
          </div>

          <div className="space-y-4">
            {/* Critical alerts */}
            <div className="bg-red-500/5 border border-red-500/20 rounded-2xl p-4">
              <div className="flex items-center gap-2 mb-3">
                <AlertCircle className="w-4 h-4 text-red-400" />
                <h3 className="font-bold text-sm text-red-400">Critical Road Alerts</h3>
              </div>
              {complaints.length === 0 ? (
                <p className="text-xs text-red-400">No critical alerts pending.</p>
              ) : complaints.slice(0, 4).map(c => (
                <Link key={c.id} to={`/complaints/${c.id}`}>
                  <div className="py-2 border-b border-red-500/10 last:border-0 text-xs">
                    <div className="font-bold text-white truncate">{c.title}</div>
                    <div className="text-slate-400 mt-0.5">{c.district || c.location_text || '—'}</div>
                  </div>
                </Link>
              ))}
            </div>

            {/* Resource allocation */}
            <div className="bg-card rounded-2xl border border-border/60 p-4 shadow-md">
              <h3 className="font-bold text-sm mb-3 flex items-center gap-2 text-white"><Users className="w-4 h-4 text-primary animate-pulse" />Contractor Workload</h3>
              {contractorsList.slice(0, 5).map(c => {
                const count = repairs.filter(r => r.contractor === c.name && r.status === 'Active').length;
                return (
                  <div key={c.id} className="flex items-center gap-2 py-1.5 text-xs text-slate-300">
                    <div className="w-6 h-6 rounded-lg bg-primary/10 flex items-center justify-center text-primary font-bold">{c.name?.[0]}</div>
                    <span className="flex-1 truncate text-slate-300">{c.name}</span>
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${count > 0 ? 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/20' : 'bg-secondary text-slate-500'}`}>{count} active</span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </RoleGuard>
  );
}