import { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { motion } from 'framer-motion';
import { Users, Shield, Settings, Database, Activity, Brain, Bell, AlertTriangle, CheckCircle, TrendingUp, Server, Eye } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Button } from '@/components/ui/button';
import AuthorityPageHeader from '@/components/authority/AuthorityPageHeader';
import RoleGuard from '@/components/authority/RoleGuard';
import UserRoleManager from '@/components/authority/UserRoleManager';

const userGrowth = [
  { month: 'Mar', users: 1890, reports: 42 },
  { month: 'Apr', users: 2200, reports: 57 },
  { month: 'May', users: 2780, reports: 78 },
];

const auditLogs = [
  { action: 'Complaint #cmp_9f82d escalated', user: 'field_officer@pune.gov', time: '2 min ago', type: 'escalation' },
  { action: 'Road health score updated — FC Road', user: 'system_ai', time: '5 min ago', type: 'system' },
  { action: 'New contractor profile added — PMC Infra Ltd', user: 'admin@roadwatch.gov', time: '12 min ago', type: 'admin' },
  { action: 'User demo@roadwatch.in verified', user: 'system', time: '18 min ago', type: 'system' },
  { action: 'AI flagged duplicate reports on Karve Road', user: 'ai_engine', time: '24 min ago', type: 'ai' },
  { action: 'Budget ₹18L approved for JM Road repair', user: 'engineer@pune.gov', time: '31 min ago', type: 'approval' },
];

const aiStats = [
  { label: 'AI Accuracy', value: '94.2%', icon: '🎯', change: '+1.3%', color: 'text-green-400' },
  { label: 'Duplicate Detection', value: '98.7%', icon: '🔍', change: '+0.4%', color: 'text-green-400' },
  { label: 'Fake Report Flag Rate', value: '2.3%', icon: '🚩', change: '-0.8%', color: 'text-green-400' },
  { label: 'Avg AI Confidence', value: '89.0%', icon: '🤖', change: '+2.1%', color: 'text-green-400' },
];

const typeColors = {
  escalation: 'bg-yellow-500/10 text-yellow-400 border border-yellow-500/20',
  system: 'bg-blue-500/10 text-blue-400 border border-blue-500/20',
  admin: 'bg-purple-500/10 text-purple-400 border border-purple-500/20',
  ai: 'bg-pink-500/10 text-pink-400 border border-pink-500/20',
  approval: 'bg-green-500/10 text-green-400 border border-green-500/20',
};

export default function SuperAdminDashboard() {
  const [complaints, setComplaints] = useState([]);
  const [contractors, setContractors] = useState([]);
  const [usersCount, setUsersCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState('overview');

  useEffect(() => {
    Promise.all([
      base44.entities.Complaint.list('-created_date', 500),
      base44.entities.Contractor.list('-created_date', 50),
      base44.entities.UserProfile.list()
    ]).then(([c, ct, u]) => {
      setComplaints(c);
      setContractors(ct);
      setUsersCount(u.length || 12);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  const resolved = complaints.filter(c => ['Resolved', 'completed', 'Completed'].includes(c.status)).length;
  const aiVerified = complaints.filter(c => c.ai_verification_status === 'AI Verified').length;

  const tabs = [
    { id: 'overview', label: '📊 System Overview' },
    { id: 'users', label: '👥 User Permissions' },
    { id: 'ai', label: '🤖 Neural System' },
    { id: 'audit', label: '📋 Platform Audits' },
    { id: 'config', label: '⚙️ Configuration' },
  ];

  if (loading) {
    return <div className="max-w-6xl mx-auto px-4 py-8 text-center text-slate-400">Loading system parameters...</div>;
  }

  return (
    <RoleGuard allowedRoles={['super_admin']}>
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6 text-slate-300">
        <AuthorityPageHeader role="Super Admin" title="System Control Panel" subtitle="Platform analytics, user management, AI configuration, and audit logs" level={7} />

        {/* Tab Nav */}
        <div className="flex items-center gap-2 mb-6 bg-secondary/30 rounded-2xl p-1 border border-border/40 overflow-x-auto scrollbar-hide">
          {tabs.map(t => (
            <button key={t.id} onClick={() => setTab(t.id)}
              className={`flex-shrink-0 py-1.5 px-4 rounded-xl text-xs font-semibold transition-all whitespace-nowrap ${tab === t.id ? 'bg-card text-white shadow-sm' : 'text-slate-400 hover:text-white'}`}>
              {t.label}
            </button>
          ))}
        </div>

        {tab === 'overview' && (
          <div className="space-y-4">
            {/* Platform Stats */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {[
                { label: 'Platform Users', value: usersCount, icon: Users, color: 'bg-blue-500/10 border-blue-500/20 text-blue-400' },
                { label: 'Active Reports', value: complaints.length, icon: AlertTriangle, color: 'bg-orange-500/10 border-orange-500/20 text-orange-400' },
                { label: 'AI Verified', value: aiVerified, icon: Brain, color: 'bg-purple-500/10 border-purple-500/20 text-purple-400' },
                { label: 'Resolved Tickets', value: resolved, icon: CheckCircle, color: 'bg-green-500/10 border-green-500/20 text-green-400' },
              ].map((s, i) => (
                <motion.div key={s.label} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
                  className={`rounded-2xl p-4 border ${s.color}`}>
                  <div className="flex items-center justify-between mb-2">
                    <s.icon className="w-5 h-5 shrink-0" />
                  </div>
                  <div className="text-2xl font-bold font-sora text-white">{s.value}</div>
                  <div className="text-xs font-semibold opacity-70 mt-1">{s.label}</div>
                </motion.div>
              ))}
            </div>

            {/* Charts */}
            <div className="grid lg:grid-cols-2 gap-4">
              <div className="bg-card rounded-2xl border border-border/60 p-5 shadow-md">
                <h3 className="font-semibold text-sm mb-4 text-white">Platform Growth & Activity</h3>
                <ResponsiveContainer width="100%" height={200}>
                  <AreaChart data={userGrowth}>
                    <defs>
                      <linearGradient id="gUsers" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#6366f1" stopOpacity={0.2} />
                        <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                    <YAxis tick={{ fontSize: 11 }} />
                    <Tooltip contentStyle={{ borderRadius: '12px', border: '1px solid hsl(var(--border))', fontSize: '12px' }} />
                    <Area type="monotone" dataKey="users" stroke="#6366f1" fill="url(#gUsers)" strokeWidth={2} name="Active Users" />
                    <Area type="monotone" dataKey="reports" stroke="#f97316" fill="transparent" strokeWidth={2} strokeDasharray="4 2" name="New Reports" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>

              {/* Server Health */}
              <div className="bg-card rounded-2xl border border-border/60 p-5 shadow-md">
                <h3 className="font-semibold text-sm mb-4 flex items-center gap-2 text-white"><Server className="w-4 h-4 text-primary animate-pulse" />Node System Health</h3>
                <div className="space-y-3">
                  {[
                    { name: 'API Latency Time', value: 98, label: '114ms avg', good: true },
                    { name: 'JSON Store Health', value: 99, label: '100% uptime', good: true },
                    { name: 'AI Service Load', value: 34, label: '34% capacity', good: true },
                    { name: 'Disk Storage Usage', value: 12, label: '12% used', good: true },
                    { name: 'Platform Error Rate', value: 1, label: '0.01% errors', good: true },
                  ].map(m => (
                    <div key={m.name}>
                      <div className="flex justify-between text-xs mb-1">
                        <span className="text-slate-400 font-semibold">{m.name}</span>
                        <span className={`font-bold ${m.good ? 'text-green-400' : 'text-red-400'}`}>{m.label}</span>
                      </div>
                      <div className="h-1.5 bg-secondary rounded-full overflow-hidden">
                        <div className={`h-full rounded-full ${m.good ? 'bg-green-500' : 'bg-red-500'}`} style={{ width: `${m.value}%` }}></div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {tab === 'users' && (
          <UserRoleManager />
        )}

        {tab === 'ai' && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {aiStats.map((s, i) => (
                <motion.div key={s.label} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
                  className="bg-card rounded-2xl border border-border/60 p-4 text-center shadow-md">
                  <div className="text-3xl mb-2">{s.icon}</div>
                  <div className="text-2xl font-bold font-sora text-white">{s.value}</div>
                  <div className="text-xs text-slate-400 font-semibold mt-1">{s.label}</div>
                  <div className={`text-xs font-semibold mt-1.5 ${s.color}`}>{s.change} this month</div>
                </motion.div>
              ))}
            </div>

            <div className="bg-indigo-950/20 border border-indigo-500/20 rounded-2xl p-5 shadow-xl backdrop-blur-md">
              <h3 className="font-semibold text-sm mb-4 text-white flex items-center gap-2"><Brain className="w-4 h-4 text-indigo-400 animate-pulse" />Neural Core Engine Configuration</h3>
              <div className="grid sm:grid-cols-2 gap-3 text-slate-300">
                {[
                  { label: 'Duplicate Detection Limit', value: '85%', icon: '🔍' },
                  { label: 'Computer Vision Sensitivity', value: 'High', icon: '🚩' },
                  { label: 'Auto-Escalation Vote Limit', value: '30 upvotes', icon: 'Item' },
                  { label: 'Predictive Distress Warning', value: '7 days', icon: '⚠️' },
                  { label: 'Neural Conf. Cutoff Limit', value: '60%', icon: '🎯' },
                  { label: 'Discussions Threshold Trigger', value: '30 verified claims', icon: '💬' },
                ].map(cfg => (
                  <div key={cfg.label} className="bg-slate-900/60 rounded-xl p-3.5 flex items-center justify-between border border-border/40">
                    <div className="flex items-center gap-3">
                      <span className="text-lg">{cfg.icon}</span>
                      <div className="min-w-0">
                        <div className="text-xs text-slate-400 font-medium">{cfg.label}</div>
                        <div className="text-sm font-bold text-white mt-0.5">{cfg.value}</div>
                      </div>
                    </div>
                    <Button size="sm" variant="outline" className="h-7 text-xs bg-slate-950 hover:bg-slate-800 text-slate-300">Edit</Button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {tab === 'audit' && (
          <div className="bg-card rounded-2xl border border-border/60 p-5 shadow-md">
            <h3 className="font-semibold text-sm mb-4 flex items-center gap-2 text-white"><Eye className="w-4 h-4 text-primary animate-pulse" />Audit System Logs</h3>
            <div className="space-y-2">
              {auditLogs.map((log, i) => (
                <motion.div key={i} initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.04 }}
                  className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-3 bg-secondary/15 border border-border/40 rounded-xl text-xs">
                  <div className="flex items-center gap-3">
                    <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase shrink-0 ${typeColors[log.type]}`}>{log.type}</span>
                    <span className="font-medium text-white">{log.action}</span>
                  </div>
                  <div className="flex items-center gap-3 text-slate-400 font-semibold self-start sm:self-auto pl-[5.5rem] sm:pl-0">
                    <span>{log.user}</span>
                    <span className="text-slate-500 font-normal">{log.time}</span>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        )}

        {tab === 'config' && (
          <div className="grid sm:grid-cols-2 gap-4">
            {[
              { title: '👥 User Directories', desc: 'Manage access levels, officer credentials, and state scopes', icon: Users, items: ['Configure Access Levels', 'Officer Scope Control', 'State Registrars'] },
              { title: '🏗️ Contractors Auditing', desc: 'Add, rank, score, or suspend contractor registries', icon: Shield, items: ['Register Contractor', 'Audits Scoring Ledger', 'Access Suspension Panel'] },
              { title: '🔔 Messaging & Dispatch', desc: 'Configure dispatch protocols and auto-alerts thresholds', icon: Bell, items: ['Alert Messages Dispatch', 'Escalations Threshold', 'System Notifications Config'] },
              { title: '⚙️ Platform Constants', desc: 'System-wide constraints and performance logs', icon: Settings, items: ['API Quota Control', 'Storage Cleanup Config', 'Backup Protocols'] },
            ].map((section, i) => (
              <motion.div key={section.title} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
                className="bg-card rounded-2xl border border-border/60 p-5 shadow-md flex flex-col justify-between">
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <section.icon className="w-4 h-4 text-primary shrink-0" />
                    <h3 className="font-bold text-sm text-white">{section.title}</h3>
                  </div>
                  <p className="text-xs text-slate-400 mb-4">{section.desc}</p>
                </div>
                <div className="space-y-2">
                  {section.items.map(item => (
                    <button key={item} className="w-full text-left text-xs px-3.5 py-2.5 bg-secondary/20 hover:bg-secondary/40 border border-border/30 rounded-xl transition-all font-semibold text-white">
                      → {item}
                    </button>
                  ))}
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </RoleGuard>
  );
}