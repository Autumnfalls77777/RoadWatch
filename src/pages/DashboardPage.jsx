import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { AlertCircle, CheckCircle, Clock, TrendingUp, Users, MapPin, Zap, Bell, ChevronRight, Activity, BarChart2 } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { motion } from 'framer-motion';
import { SeverityBadge, StatusBadge } from '@/components/shared/HealthBadge';
import StatCard from '@/components/shared/StatCard';
import PageHeader from '@/components/shared/PageHeader';
import { SkeletonList } from '@/components/shared/SkeletonCard';
import { formatDistanceToNow } from 'date-fns';

function QuickAction({ icon: Icon, label, to, color }) {
  return (
    <Link to={to}>
      <div className={`flex flex-col items-center gap-2 p-4 bg-card rounded-2xl border border-border/60 card-hover text-center`}>
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${color}`}>
          <Icon className="w-5 h-5" />
        </div>
        <span className="text-xs font-medium text-foreground">{label}</span>
      </div>
    </Link>
  );
}

function ComplaintRow({ complaint }) {
  const timeAgo = complaint.created_date ? formatDistanceToNow(new Date(complaint.created_date), { addSuffix: true }) : '';
  return (
    <Link to={`/complaints/${complaint.id}`}>
      <div className="flex items-center gap-3 py-3 border-b border-border/40 last:border-0 hover:bg-secondary/30 -mx-3 px-3 rounded-xl transition-colors">
        <div className="flex-1 min-w-0">
          <div className="font-medium text-sm truncate">{complaint.title}</div>
          <div className="text-xs text-muted-foreground mt-0.5 flex items-center gap-1">
            <MapPin className="w-3 h-3" />
            {complaint.location_text || complaint.district || 'Unknown location'}
          </div>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <SeverityBadge severity={complaint.severity} />
          <StatusBadge status={complaint.status} />
        </div>
        <ChevronRight className="w-4 h-4 text-muted-foreground flex-shrink-0" />
      </div>
    </Link>
  );
}

export default function DashboardPage() {
  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    base44.entities.Complaint.list('-created_date', 100)
      .then(setComplaints)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const resolved = complaints.filter(c => c.status === 'Resolved').length;
  const critical = complaints.filter(c => c.severity === 'Critical').length;
  const inProgress = complaints.filter(c => c.status === 'In Progress').length;
  const resolutionRate = complaints.length > 0 ? Math.round((resolved / complaints.length) * 100) : 0;

  const recentComplaints = complaints.slice(0, 8);
  const criticalComplaints = complaints.filter(c => c.severity === 'Critical').slice(0, 5);

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6">
      <PageHeader
        title="Dashboard"
        subtitle="Road health monitoring and complaint management"
        badge="Authority View"
        actions={
          <div className="flex gap-2">
            <Link to="/analytics">
              <Button variant="outline" size="sm" className="gap-2">
                <BarChart2 className="w-4 h-4" />
                Analytics
              </Button>
            </Link>
            <Link to="/notifications">
              <Button variant="outline" size="sm" className="relative">
                <Bell className="w-4 h-4" />
                <span className="absolute -top-1 -right-1 w-2 h-2 bg-red-500 rounded-full"></span>
              </Button>
            </Link>
          </div>
        }
      />

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
        <StatCard icon={AlertCircle} label="Total Reports" value={complaints.length.toString()} color="blue" change={12} delay={0} />
        <StatCard icon={CheckCircle} label="Resolved" value={resolved.toString()} color="green" change={8} delay={0.05} />
        <StatCard icon={Activity} label="Critical" value={critical.toString()} color="red" change={-3} delay={0.1} />
        <StatCard icon={TrendingUp} label="Resolution Rate" value={`${resolutionRate}%`} color="purple" change={5} delay={0.15} />
      </div>

      {/* Quick Actions */}
      <div className="mb-6">
        <h2 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide mb-3">Quick Actions</h2>
        <div className="grid grid-cols-4 sm:grid-cols-6 gap-3">
          <QuickAction icon={AlertCircle} label="Complaints" to="/complaints" color="bg-blue-50 text-blue-600" />
          <QuickAction icon={MapPin} label="Live Map" to="/map" color="bg-green-50 text-green-600" />
          <QuickAction icon={Zap} label="AI Assistant" to="/ai-assistant" color="bg-purple-50 text-purple-600" />
          <QuickAction icon={BarChart2} label="Analytics" to="/analytics" color="bg-orange-50 text-orange-600" />
          <QuickAction icon={Users} label="Forums" to="/forums" color="bg-pink-50 text-pink-600" />
          <QuickAction icon={Bell} label="Alerts" to="/notifications" color="bg-red-50 text-red-600" />
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-4">
        {/* Recent Complaints */}
        <div className="lg:col-span-2 bg-card rounded-2xl border border-border/60 p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold">Recent Complaints</h2>
            <Link to="/complaints" className="text-sm text-primary hover:underline">View all</Link>
          </div>
          {loading ? <SkeletonList count={5} /> : (
            <div>
              {recentComplaints.map(c => <ComplaintRow key={c.id} complaint={c} />)}
              {recentComplaints.length === 0 && (
                <div className="text-center py-8 text-muted-foreground text-sm">No complaints filed yet.</div>
              )}
            </div>
          )}
        </div>

        {/* Critical Issues Sidebar */}
        <div className="space-y-4">
          {/* Critical */}
          <div className="bg-card rounded-2xl border border-red-100 p-5">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 rounded-xl bg-red-50 flex items-center justify-center">
                <AlertCircle className="w-4 h-4 text-red-600" />
              </div>
              <h3 className="font-semibold text-sm">Critical Issues</h3>
            </div>
            <div className="space-y-3">
              {criticalComplaints.length === 0 ? (
                <p className="text-xs text-muted-foreground">No critical issues currently.</p>
              ) : criticalComplaints.map(c => (
                <Link key={c.id} to={`/complaints/${c.id}`}>
                  <div className="p-3 bg-red-50/50 rounded-xl border border-red-100 hover:bg-red-50 transition-colors">
                    <div className="font-medium text-xs line-clamp-2 mb-1">{c.title}</div>
                    <div className="text-xs text-muted-foreground">{c.location_text || c.district || '—'}</div>
                  </div>
                </Link>
              ))}
            </div>
          </div>

          {/* Status Summary */}
          <div className="bg-card rounded-2xl border border-border/60 p-5">
            <h3 className="font-semibold text-sm mb-4">Status Overview</h3>
            <div className="space-y-3">
              {[
                { label: 'Submitted', count: complaints.filter(c => c.status === 'Submitted').length, color: 'bg-blue-500' },
                { label: 'In Progress', count: inProgress, color: 'bg-yellow-500' },
                { label: 'Resolved', count: resolved, color: 'bg-green-500' },
                { label: 'Critical', count: critical, color: 'bg-red-500' },
              ].map(item => (
                <div key={item.label} className="flex items-center gap-3">
                  <div className={`w-2.5 h-2.5 rounded-full ${item.color}`}></div>
                  <span className="text-sm flex-1">{item.label}</span>
                  <span className="font-semibold text-sm">{item.count}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}