import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { motion } from 'framer-motion';
import { CheckCircle, AlertCircle, Copy, Flag, MapPin, Clock, ChevronRight, Eye, ArrowUp, Filter } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { StatusBadge, SeverityBadge } from '@/components/shared/HealthBadge';
import AuthorityPageHeader from '@/components/authority/AuthorityPageHeader';
import RoleGuard from '@/components/authority/RoleGuard';
import { formatDistanceToNow } from 'date-fns';

function VerificationCard({ complaint, onAction, index }) {
  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.05 }}
      className="bg-card rounded-2xl border border-border/60 p-4 card-hover">
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex-1 min-w-0">
          <h4 className="font-semibold text-sm truncate">{complaint.title}</h4>
          <div className="flex items-center gap-1 mt-1 text-xs text-muted-foreground">
            <MapPin className="w-3 h-3" />
            <span>{complaint.location_text || complaint.district || 'Unknown'}</span>
          </div>
        </div>
        <div className="flex items-center gap-1.5 flex-shrink-0">
          <SeverityBadge severity={complaint.severity} />
        </div>
      </div>

      {complaint.ai_confidence && (
        <div className="bg-purple-50 rounded-xl p-2.5 mb-3 flex items-center gap-2">
          <div className="w-6 h-6 rounded-lg bg-purple-100 flex items-center justify-center text-xs">🤖</div>
          <div className="text-xs">
            <span className="font-medium text-purple-800">AI Confidence: {complaint.ai_confidence}%</span>
            {complaint.ai_defect_type && <span className="text-purple-600 ml-1">· {complaint.ai_defect_type}</span>}
          </div>
        </div>
      )}

      <div className="flex items-center gap-2 text-xs text-muted-foreground mb-3">
        <Clock className="w-3 h-3" />
        <span>{complaint.created_date ? formatDistanceToNow(new Date(complaint.created_date), { addSuffix: true }) : '—'}</span>
        <span className="ml-auto flex items-center gap-1">
          <ArrowUp className="w-3 h-3" />
          {complaint.upvotes || 0} upvotes
        </span>
      </div>

      <div className="flex gap-2">
        <Button size="sm" className="flex-1 h-8 text-xs bg-green-600 hover:bg-green-700 text-white" onClick={() => onAction(complaint, 'verify')}>
          <CheckCircle className="w-3 h-3 mr-1" /> Verify
        </Button>
        <Button size="sm" variant="outline" className="flex-1 h-8 text-xs" onClick={() => onAction(complaint, 'escalate')}>
          <ArrowUp className="w-3 h-3 mr-1" /> Escalate
        </Button>
        <Button size="sm" variant="outline" className="h-8 w-8 p-0 text-xs text-red-600 border-red-200" onClick={() => onAction(complaint, 'flag')}>
          <Flag className="w-3 h-3" />
        </Button>
        <Link to={`/complaints/${complaint.id}`}>
          <Button size="sm" variant="outline" className="h-8 w-8 p-0 text-xs">
            <Eye className="w-3 h-3" />
          </Button>
        </Link>
      </div>
    </motion.div>
  );
}

export default function JuniorOfficerDashboard() {
  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('Submitted');
  const [actionLog, setActionLog] = useState([]);

  useEffect(() => {
    base44.entities.Complaint.list('-created_date', 100)
      .then(setComplaints)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const handleAction = async (complaint, action) => {
    const statusMap = { verify: 'AI Verified', escalate: 'Under Review', flag: 'Rejected' };
    await base44.entities.Complaint.update(complaint.id, { status: statusMap[action] });
    setComplaints(prev => prev.map(c => c.id === complaint.id ? { ...c, status: statusMap[action] } : c));
    setActionLog(prev => [{ id: complaint.id, title: complaint.title, action, time: new Date() }, ...prev.slice(0, 4)]);
  };

  const submitted = complaints.filter(c => c.status === 'Submitted');
  const aiVerified = complaints.filter(c => c.status === 'AI Verified');
  const underReview = complaints.filter(c => c.status === 'Under Review');
  const duplicates = complaints.filter(c => c.is_duplicate);

  const filtered = filter === 'Submitted' ? submitted : filter === 'AI Verified' ? aiVerified : filter === 'Under Review' ? underReview : complaints;

  const stats = [
    { label: 'New Reports', value: submitted.length, color: 'bg-blue-50 text-blue-700', icon: '📥' },
    { label: 'Pending Verification', value: aiVerified.length, color: 'bg-purple-50 text-purple-700', icon: '🔍' },
    { label: 'Under Review', value: underReview.length, color: 'bg-yellow-50 text-yellow-700', icon: '⏳' },
    { label: 'Duplicates', value: duplicates.length, color: 'bg-orange-50 text-orange-700', icon: '🔄' },
  ];

  return (
    <RoleGuard allowedRoles={['junior_officer', 'road_inspector', 'executive_engineer', 'district_authority', 'state_authority', 'super_admin']}>
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6">
        <AuthorityPageHeader
          role="Junior Officer"
          title="Verification Queue"
          subtitle="Review, verify, and escalate incoming citizen complaints"
          level={2}
        />

        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
          {stats.map((s, i) => (
            <motion.div key={s.label} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
              className={`rounded-2xl p-4 ${s.color} border border-current/10`}>
              <div className="text-2xl mb-1">{s.icon}</div>
              <div className="text-2xl font-bold font-sora">{s.value}</div>
              <div className="text-xs font-medium opacity-70">{s.label}</div>
            </motion.div>
          ))}
        </div>

        <div className="grid lg:grid-cols-3 gap-4">
          <div className="lg:col-span-2">
            {/* Filter tabs */}
            <div className="flex items-center gap-2 mb-4 bg-secondary/50 rounded-2xl p-1.5">
              {['Submitted', 'AI Verified', 'Under Review', 'All'].map(f => (
                <button key={f} onClick={() => setFilter(f)}
                  className={`flex-1 py-1.5 px-3 rounded-xl text-xs font-medium transition-all ${filter === f ? 'bg-white text-foreground shadow-sm' : 'text-muted-foreground'}`}>
                  {f}
                </button>
              ))}
            </div>

            {loading ? (
              <div className="space-y-3">{[...Array(4)].map((_, i) => <div key={i} className="h-40 bg-muted rounded-2xl animate-pulse" />)}</div>
            ) : filtered.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <CheckCircle className="w-10 h-10 mx-auto mb-3 opacity-30" />
                <p className="font-medium">All clear — no complaints in this queue</p>
              </div>
            ) : (
              <div className="space-y-3">
                {filtered.map((c, i) => (
                  <VerificationCard key={c.id} complaint={c} onAction={handleAction} index={i} />
                ))}
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-4">
            {/* Action Log */}
            <div className="bg-card rounded-2xl border border-border/60 p-4">
              <h3 className="font-semibold text-sm mb-3 flex items-center gap-2">
                <Clock className="w-4 h-4 text-primary" /> Recent Actions
              </h3>
              {actionLog.length === 0 ? (
                <p className="text-xs text-muted-foreground">No actions yet this session.</p>
              ) : actionLog.map((log, i) => (
                <div key={i} className="flex items-center gap-2 py-2 border-b border-border/40 last:border-0 text-xs">
                  <span className={`w-2 h-2 rounded-full flex-shrink-0 ${log.action === 'verify' ? 'bg-green-500' : log.action === 'escalate' ? 'bg-yellow-500' : 'bg-red-500'}`}></span>
                  <span className="flex-1 truncate text-foreground">{log.title}</span>
                  <span className="text-muted-foreground capitalize">{log.action}d</span>
                </div>
              ))}
            </div>

            {/* Performance */}
            <div className="bg-card rounded-2xl border border-border/60 p-4">
              <h3 className="font-semibold text-sm mb-3">My Performance</h3>
              <div className="space-y-3">
                {[
                  { label: 'Verified Today', value: actionLog.filter(a => a.action === 'verify').length, max: 20, color: 'bg-green-500' },
                  { label: 'Escalated', value: actionLog.filter(a => a.action === 'escalate').length, max: 10, color: 'bg-yellow-500' },
                  { label: 'Flagged', value: actionLog.filter(a => a.action === 'flag').length, max: 10, color: 'bg-red-500' },
                ].map(m => (
                  <div key={m.label}>
                    <div className="flex justify-between text-xs mb-1">
                      <span className="text-muted-foreground">{m.label}</span>
                      <span className="font-medium">{m.value}</span>
                    </div>
                    <div className="h-1.5 bg-secondary rounded-full overflow-hidden">
                      <div className={`h-full ${m.color} rounded-full transition-all duration-500`} style={{ width: `${Math.min((m.value / m.max) * 100, 100)}%` }}></div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </RoleGuard>
  );
}