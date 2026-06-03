import { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { motion } from 'framer-motion';
import { Wrench, Calendar, Clock, CheckCircle, AlertCircle, Camera, Users, ChevronRight, Image } from 'lucide-react';
import { formatDistanceToNow, differenceInDays } from 'date-fns';
import PageHeader from '@/components/shared/PageHeader';
import { Button } from '@/components/ui/button';

const repairProjects = [
  {
    id: 'rp1',
    road: 'Western Express Highway',
    district: 'Mumbai',
    issue: 'Multiple potholes — 34 defects identified',
    contractor: 'HCC Limited',
    authority: 'Rajesh Kumar, Exec. Engineer',
    start_date: '2024-11-28',
    expected_date: '2024-12-12',
    status: 'In Progress',
    progress: 65,
    budget: 450000,
    before_images: ['https://images.unsplash.com/photo-1515162305285-0293e4767cc2?w=400&q=80'],
    after_images: [],
    timeline: [
      { date: '2024-11-28', event: 'Repair team mobilized', type: 'start' },
      { date: '2024-11-30', event: 'Pothole filling started — Zone A', type: 'progress' },
      { date: '2024-12-03', event: '15/34 potholes completed', type: 'progress' },
      { date: '2024-12-07', event: 'Zone B work commenced', type: 'progress' },
    ]
  },
  {
    id: 'rp2',
    road: 'MG Road Bengaluru',
    district: 'Bengaluru',
    issue: 'Waterlogging and drainage failure',
    contractor: 'NCC Infrastructure',
    authority: 'Anita Sharma, Exec. Engineer',
    start_date: '2024-11-10',
    expected_date: '2024-11-22',
    status: 'Completed',
    progress: 100,
    budget: 280000,
    before_images: ['https://images.unsplash.com/photo-1601584115197-04ecc0da31d7?w=400&q=80'],
    after_images: ['https://images.unsplash.com/photo-1544636331-e26879cd4d9b?w=400&q=80'],
    timeline: [
      { date: '2024-11-10', event: 'Work order issued', type: 'start' },
      { date: '2024-11-12', event: 'Drainage unclogged — primary channel', type: 'progress' },
      { date: '2024-11-18', event: 'Road surface resurfaced', type: 'progress' },
      { date: '2024-11-22', event: 'Inspection passed — Work completed', type: 'complete' },
    ]
  },
  {
    id: 'rp3',
    road: 'Ring Road Sector 12',
    district: 'Pune',
    issue: 'Structural crack — full road width',
    contractor: 'Pending Assignment',
    authority: 'Vikram Shetty, Exec. Engineer',
    start_date: null,
    expected_date: '2024-12-25',
    status: 'Approved',
    progress: 5,
    budget: 1200000,
    before_images: ['https://images.unsplash.com/photo-1590402494610-2c378a9114c6?w=400&q=80'],
    after_images: [],
    timeline: [
      { date: '2024-12-01', event: 'Complaint verified by inspector', type: 'start' },
      { date: '2024-12-04', event: 'Repair budget approved — ₹12L', type: 'progress' },
      { date: '2024-12-08', event: 'Contractor tender process initiated', type: 'progress' },
    ]
  },
];

const statusConfig = {
  'In Progress': { color: 'bg-blue-50 text-blue-700 border-blue-200', dot: 'bg-blue-500', icon: Wrench },
  'Completed': { color: 'bg-green-50 text-green-700 border-green-200', dot: 'bg-green-500', icon: CheckCircle },
  'Approved': { color: 'bg-yellow-50 text-yellow-700 border-yellow-200', dot: 'bg-yellow-500', icon: AlertCircle },
};

function RepairCard({ repair, index }) {
  const [showTimeline, setShowTimeline] = useState(false);
  const cfg = statusConfig[repair.status] || statusConfig['Approved'];
  const daysLeft = repair.expected_date ? differenceInDays(new Date(repair.expected_date), new Date()) : null;
  const budgetInLakh = (repair.budget / 100000).toFixed(1);

  const timelineTypeConfig = {
    start: 'bg-blue-500',
    progress: 'bg-yellow-500',
    complete: 'bg-green-500',
  };

  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.07 }}
      className="bg-card rounded-2xl border border-border/60 overflow-hidden">
      <div className="p-5">
        <div className="flex items-start justify-between gap-3 mb-4">
          <div>
            <h3 className="font-bold text-base font-sora">{repair.road}</h3>
            <div className="text-xs text-muted-foreground">{repair.district} · {repair.issue}</div>
          </div>
          <span className={`text-xs font-semibold px-2.5 py-1 rounded-full border flex-shrink-0 ${cfg.color}`}>{repair.status}</span>
        </div>

        {/* Progress Bar */}
        <div className="mb-4">
          <div className="flex justify-between text-xs mb-1.5">
            <span className="text-muted-foreground">Repair Progress</span>
            <span className="font-semibold text-foreground">{repair.progress}%</span>
          </div>
          <div className="h-3 bg-secondary rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-700 ${repair.progress === 100 ? 'bg-green-500' : 'bg-blue-500'}`}
              style={{ width: `${repair.progress}%` }}
            ></div>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-4 text-center text-xs">
          <div className="bg-secondary/50 rounded-xl p-2.5">
            <div className="font-bold text-foreground">₹{budgetInLakh}L</div>
            <div className="text-muted-foreground">Budget</div>
          </div>
          <div className={`rounded-xl p-2.5 ${daysLeft !== null && daysLeft < 0 ? 'bg-red-50' : daysLeft !== null && daysLeft < 5 ? 'bg-orange-50' : 'bg-secondary/50'}`}>
            <div className={`font-bold ${daysLeft !== null && daysLeft < 0 ? 'text-red-600' : daysLeft !== null && daysLeft < 5 ? 'text-orange-600' : 'text-foreground'}`}>
              {repair.status === 'Completed' ? '✓ Done' : daysLeft !== null ? (daysLeft < 0 ? `${Math.abs(daysLeft)}d overdue` : `${daysLeft}d left`) : 'TBD'}
            </div>
            <div className="text-muted-foreground">Deadline</div>
          </div>
          <div className="bg-secondary/50 rounded-xl p-2.5">
            <div className="font-bold text-foreground truncate">{repair.contractor.split(' ')[0]}</div>
            <div className="text-muted-foreground">Contractor</div>
          </div>
          <div className="bg-secondary/50 rounded-xl p-2.5">
            <div className="font-bold text-foreground truncate">{repair.authority.split(',')[0].split(' ').slice(-1)}</div>
            <div className="text-muted-foreground">Engineer</div>
          </div>
        </div>

        {/* Before / After */}
        {(repair.before_images.length > 0 || repair.after_images.length > 0) && (
          <div className="flex gap-2 mb-4">
            {repair.before_images.length > 0 && (
              <div className="flex-1">
                <div className="text-xs text-muted-foreground mb-1 flex items-center gap-1"><Camera className="w-3 h-3" />Before</div>
                <img src={repair.before_images[0]} alt="Before repair" className="w-full h-24 object-cover rounded-xl" />
              </div>
            )}
            {repair.after_images.length > 0 ? (
              <div className="flex-1">
                <div className="text-xs text-green-600 mb-1 flex items-center gap-1"><CheckCircle className="w-3 h-3" />After</div>
                <img src={repair.after_images[0]} alt="After repair" className="w-full h-24 object-cover rounded-xl" />
              </div>
            ) : repair.before_images.length > 0 ? (
              <div className="flex-1">
                <div className="text-xs text-muted-foreground mb-1 flex items-center gap-1"><Image className="w-3 h-3" />After</div>
                <div className="w-full h-24 bg-secondary rounded-xl flex items-center justify-center">
                  <span className="text-xs text-muted-foreground text-center">Pending<br/>Completion</span>
                </div>
              </div>
            ) : null}
          </div>
        )}

        <button onClick={() => setShowTimeline(!showTimeline)} className="text-xs text-primary hover:underline flex items-center gap-1">
          {showTimeline ? '▲ Hide timeline' : '▼ View repair timeline'}
        </button>
      </div>

      {showTimeline && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="border-t border-border/40 px-5 py-4 bg-secondary/20">
          <div className="relative">
            <div className="absolute left-2 top-0 bottom-0 w-px bg-border"></div>
            <div className="space-y-3">
              {repair.timeline.map((t, i) => (
                <div key={i} className="flex items-start gap-3 pl-6 relative">
                  <div className={`absolute left-0 w-4 h-4 rounded-full border-2 border-white flex-shrink-0 ${timelineTypeConfig[t.type]}`}></div>
                  <div>
                    <div className="text-xs font-medium text-foreground">{t.event}</div>
                    <div className="text-xs text-muted-foreground">{t.date}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </motion.div>
      )}
    </motion.div>
  );
}

export default function RepairTrackingPage() {
  const active = repairProjects.filter(r => r.status === 'In Progress').length;
  const completed = repairProjects.filter(r => r.status === 'Completed').length;
  const approved = repairProjects.filter(r => r.status === 'Approved').length;

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6">
      <PageHeader
        title="Repair Tracker"
        subtitle="Real-time Before/After tracking, progress updates and repair countdowns"
        badge="Live Repairs"
      />

      <div className="grid grid-cols-3 gap-3 mb-6">
        {[
          { label: 'In Progress', value: active, color: 'bg-blue-50 border-blue-200 text-blue-800' },
          { label: 'Approved', value: approved, color: 'bg-yellow-50 border-yellow-200 text-yellow-800' },
          { label: 'Completed', value: completed, color: 'bg-green-50 border-green-200 text-green-800' },
        ].map((s, i) => (
          <motion.div key={s.label} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
            className={`rounded-2xl p-4 border text-center ${s.color}`}>
            <div className="text-2xl font-bold font-sora">{s.value}</div>
            <div className="text-xs font-medium opacity-70">{s.label}</div>
          </motion.div>
        ))}
      </div>

      <div className="space-y-4">
        {repairProjects.map((r, i) => <RepairCard key={r.id} repair={r} index={i} />)}
      </div>
    </div>
  );
}