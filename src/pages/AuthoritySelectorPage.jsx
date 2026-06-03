import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Shield, ArrowRight, Trophy } from 'lucide-react';
import { mockAuthorityScorecards } from '@/api/base44Client';

const AUTHORITY_LEVELS = [
  {
    level: 1,
    role: 'Citizen',
    icon: '👤',
    description: 'Report issues, verify complaints, join forums, track repairs and earn reputation.',
    features: ['Report Issues', 'Upvote & Verify', 'Join Forums', 'Track Repairs', 'Gamification'],
    color: 'from-gray-400 to-gray-500',
    bg: 'bg-gray-50 border-gray-200 hover:border-gray-400',
    badge: 'bg-gray-100 text-gray-700',
    link: '/complaints',
    cta: 'View Complaints',
  },
  {
    level: 2,
    role: 'Junior Officer',
    icon: '🔍',
    description: 'First-level verification, duplicate detection, spam filtering and complaint escalation.',
    features: ['Verify Complaints', 'Detect Duplicates', 'Flag Spam', 'Escalate Issues'],
    color: 'from-blue-400 to-blue-600',
    bg: 'bg-blue-50 border-blue-200 hover:border-blue-400',
    badge: 'bg-blue-100 text-blue-700',
    link: '/authority/junior-officer',
    cta: 'Open Dashboard',
  },
  {
    level: 3,
    role: 'Road Inspector',
    icon: '🗺️',
    description: 'Field verification, site inspections, image uploads, severity assessment.',
    features: ['Field Inspections', 'Upload Evidence', 'Approve Severity', 'Reject False Reports'],
    color: 'from-teal-400 to-teal-600',
    bg: 'bg-teal-50 border-teal-200 hover:border-teal-400',
    badge: 'bg-teal-100 text-teal-700',
    link: '/authority/road-inspector',
    cta: 'Open Dashboard',
  },
  {
    level: 4,
    role: 'Executive Engineer',
    icon: '🔧',
    description: 'Approve and manage road repairs, assign contractors, monitor budgets.',
    features: ['Approve Repairs', 'Assign Contractors', 'Manage Budget', 'Schedule Repairs'],
    color: 'from-orange-400 to-orange-600',
    bg: 'bg-orange-50 border-orange-200 hover:border-orange-400',
    badge: 'bg-orange-100 text-orange-700',
    link: '/authority/executive-engineer',
    cta: 'Open Dashboard',
  },
  {
    level: 5,
    role: 'District Authority',
    icon: '🏛️',
    description: 'District-wide monitoring, contractor accountability, analytics, budget oversight.',
    features: ['District Analytics', 'Contractor Rankings', 'Road Heatmap', 'Budget Allocation'],
    color: 'from-indigo-400 to-indigo-600',
    bg: 'bg-indigo-50 border-indigo-200 hover:border-indigo-400',
    badge: 'bg-indigo-100 text-indigo-700',
    link: '/authority/district',
    cta: 'Open Dashboard',
  },
  {
    level: 6,
    role: 'State Authority',
    icon: '🌐',
    description: 'State-wide intelligence, district rankings, AI predictions, resource allocation.',
    features: ['State Heatmap', 'District Rankings', 'AI Predictions', 'Trend Analytics'],
    color: 'from-purple-400 to-purple-600',
    bg: 'bg-purple-50 border-purple-200 hover:border-purple-400',
    badge: 'bg-purple-100 text-purple-700',
    link: '/authority/state',
    cta: 'Open Dashboard',
  },
  {
    level: 7,
    role: 'Super Admin',
    icon: '⚙️',
    description: 'Full system control — users, AI config, audit logs, escalation rules.',
    features: ['User Management', 'AI Configuration', 'Audit Logs', 'System Health'],
    color: 'from-rose-400 to-rose-600',
    bg: 'bg-rose-50 border-rose-200 hover:border-rose-400',
    badge: 'bg-rose-100 text-rose-700',
    link: '/authority/super-admin',
    cta: 'Open Dashboard',
  },
];

export default function AuthoritySelectorPage() {
  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6">
      {/* Header */}
      <div className="text-center mb-10">
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-medium mb-4">
          <Shield className="w-4 h-4" />
          Authority System — RoadWatch
        </div>
        <h1 className="text-3xl sm:text-4xl font-bold font-sora mb-3">
          Role-Based <span className="gradient-text">Government Workflow</span>
        </h1>
        <p className="text-muted-foreground max-w-xl mx-auto text-sm leading-relaxed">
          A complete 7-tier authority hierarchy mirroring India's real government road management workflow. Each role has dedicated dashboards, permissions, and workflows.
        </p>
      </div>

      {/* Hierarchy Visual */}
      <div className="relative mb-8 hidden md:block">
        <div className="flex items-center justify-center gap-0 overflow-x-auto pb-2">
          {AUTHORITY_LEVELS.map((level, i) => (
            <div key={level.level} className="flex items-center">
              <div className="flex flex-col items-center gap-1 px-2">
                <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${level.color} flex items-center justify-center text-base shadow-sm`}>
                  {level.icon}
                </div>
                <div className="text-xs font-medium text-center leading-tight max-w-[60px]">{level.role.split(' ').join('\n')}</div>
                <div className="text-xs text-muted-foreground font-medium">L{level.level}</div>
              </div>
              {i < AUTHORITY_LEVELS.length - 1 && (
                <ArrowRight className="w-4 h-4 text-muted-foreground/40 flex-shrink-0" />
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Cards Grid */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {AUTHORITY_LEVELS.map((level, i) => (
          <motion.div
            key={level.level}
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.07 }}
          >
            <Link to={level.link}>
              <div className={`rounded-2xl border-2 p-5 card-hover transition-all cursor-pointer h-full ${level.bg}`}>
                <div className="flex items-start justify-between mb-3">
                  <div className={`w-11 h-11 rounded-xl bg-gradient-to-br ${level.color} flex items-center justify-center text-xl shadow-sm`}>
                    {level.icon}
                  </div>
                  <span className={`text-xs font-bold px-2 py-1 rounded-full ${level.badge}`}>L{level.level}</span>
                </div>

                <h3 className="font-bold text-base mb-1 font-sora">{level.role}</h3>
                <p className="text-xs text-muted-foreground mb-3 leading-relaxed">{level.description}</p>

                <div className="space-y-1 mb-4">
                  {level.features.map(f => (
                    <div key={f} className="flex items-center gap-1.5 text-xs text-foreground">
                      <div className="w-1 h-1 rounded-full bg-current opacity-40"></div>
                      {f}
                    </div>
                  ))}
                </div>

                <div className={`flex items-center gap-1.5 text-xs font-semibold bg-gradient-to-r ${level.color} bg-clip-text text-transparent`}>
                  {level.cta} <ArrowRight className="w-3 h-3" />
                </div>
              </div>
            </Link>
          </motion.div>
        ))}
      </div>

      {/* Info */}
      <div className="mt-8 bg-card border border-border/60 rounded-2xl p-5">
        <div className="flex items-center gap-2 mb-4">
          <Trophy className="w-5 h-5 text-primary" />
          <h2 className="font-bold text-lg font-sora">Authority Performance Rankings</h2>
        </div>
        <div className="grid md:grid-cols-2 gap-3">
          {[...mockAuthorityScorecards].sort((a, b) => b.accountability_score - a.accountability_score).map((a, i) => (
            <div key={a.id} className="rounded-xl border border-border/50 bg-secondary/30 p-4">
              <div className="flex items-start justify-between gap-3 mb-3">
                <div>
                  <div className="text-xs text-muted-foreground font-bold">#{i + 1} · {a.jurisdiction}</div>
                  <div className="font-semibold text-sm">{a.name}</div>
                </div>
                <div className="text-right">
                  <div className="text-xl font-black font-sora">{a.accountability_score}</div>
                  <div className="text-[10px] text-muted-foreground">Score</div>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <span>Avg Response <strong>{a.average_response_time}</strong></span>
                <span>Resolution <strong>{a.resolution_rate}%</strong></span>
                <span>Open <strong>{a.open_complaints}</strong></span>
                <span>Escalated <strong>{a.escalated_complaints}</strong></span>
                <span className="col-span-2">Citizen Satisfaction <strong>{a.citizen_satisfaction}%</strong></span>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="mt-8 bg-accent/50 border border-accent rounded-2xl p-5 text-center">
        <div className="text-sm text-muted-foreground">
          <span className="font-semibold text-foreground">Demo Mode:</span> All authority dashboards are accessible for presentation. In production, role access is enforced via JWT-based auth and server-side permissions.
        </div>
      </div>
    </div>
  );
}
