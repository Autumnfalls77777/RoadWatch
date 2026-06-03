import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { motion } from 'framer-motion';
import { Camera, ClipboardList, MapPin, CheckCircle, XCircle, Calendar, Navigation, Clock, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { SeverityBadge, StatusBadge } from '@/components/shared/HealthBadge';
import AuthorityPageHeader from '@/components/authority/AuthorityPageHeader';
import RoleGuard from '@/components/authority/RoleGuard';
import { formatDistanceToNow, format } from 'date-fns';

const mockInspections = [
  { id: 'i1', road: 'Ring Road Sector 12', complaint: 'Structural crack widening', date: new Date(Date.now() - 86400000), status: 'Completed', severity: 'Critical', notes: 'Crack measures 4cm wide, full-width span. Immediate repair required.' },
  { id: 'i2', road: 'Western Express Highway', complaint: '11 potholes between Andheri-Goregaon', date: new Date(Date.now() + 86400000), status: 'Scheduled', severity: 'High', notes: '' },
  { id: 'i3', road: 'NH-48 Gurgaon Stretch', complaint: 'Road shoulder collapse', date: new Date(Date.now() + 2 * 86400000), status: 'Scheduled', severity: 'High', notes: '' },
  { id: 'i4', road: 'MG Road Bengaluru', complaint: 'Waterlogging after monsoon', date: new Date(Date.now() - 3 * 86400000), status: 'Completed', severity: 'Medium', notes: 'Drainage cleared. Issue resolved.' },
];

function InspectionCard({ inspection, index, onComplete }) {
  const [noteOpen, setNoteOpen] = useState(false);
  const [note, setNote] = useState(inspection.notes);
  const isPast = inspection.status === 'Completed';

  return (
    <motion.div initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: index * 0.06 }}
      className={`bg-card rounded-2xl border p-4 ${isPast ? 'border-border/40 opacity-80' : 'border-primary/20'}`}>
      <div className="flex items-start justify-between gap-3 mb-3">
        <div>
          <div className="font-semibold text-sm">{inspection.road}</div>
          <div className="text-xs text-muted-foreground mt-0.5">{inspection.complaint}</div>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <SeverityBadge severity={inspection.severity} />
          <span className={`text-xs px-2.5 py-0.5 rounded-full font-medium ${isPast ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-blue-50 text-blue-700 border border-blue-200'}`}>
            {inspection.status}
          </span>
        </div>
      </div>

      <div className="flex items-center gap-2 text-xs text-muted-foreground mb-3">
        <Calendar className="w-3 h-3" />
        <span>{format(new Date(inspection.date), 'dd MMM yyyy')}</span>
        {!isPast && (
          <span className="ml-auto text-primary font-medium">
            {formatDistanceToNow(new Date(inspection.date), { addSuffix: true })}
          </span>
        )}
      </div>

      {inspection.notes && (
        <div className="bg-secondary/50 rounded-xl p-2.5 mb-3 text-xs text-foreground">
          📝 {inspection.notes}
        </div>
      )}

      {!isPast && (
        <div className="flex gap-2 mt-2">
          <Button size="sm" className="flex-1 h-8 text-xs bg-green-600 hover:bg-green-700 text-white" onClick={() => onComplete(inspection.id)}>
            <CheckCircle className="w-3 h-3 mr-1" /> Mark Completed
          </Button>
          <Button size="sm" variant="outline" className="h-8 text-xs" onClick={() => setNoteOpen(!noteOpen)}>
            <ClipboardList className="w-3 h-3 mr-1" /> Add Notes
          </Button>
          <Button size="sm" variant="outline" className="h-8 w-8 p-0">
            <Navigation className="w-3 h-3" />
          </Button>
        </div>
      )}

      {noteOpen && (
        <div className="mt-2">
          <textarea
            value={note}
            onChange={e => setNote(e.target.value)}
            className="w-full h-20 text-xs p-2 bg-secondary rounded-xl border border-border resize-none outline-none focus:border-primary"
            placeholder="Add inspection notes, observations..."
          />
          <Button size="sm" className="h-7 text-xs mt-1" onClick={() => setNoteOpen(false)}>Save Notes</Button>
        </div>
      )}
    </motion.div>
  );
}

export default function RoadInspectorDashboard() {
  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading] = useState(true);
  const [inspections, setInspections] = useState(mockInspections);
  const [tab, setTab] = useState('upcoming');

  useEffect(() => {
    base44.entities.Complaint.filter({ status: 'Under Review' }, '-created_date', 30)
      .then(setComplaints)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const handleComplete = (id) => {
    setInspections(prev => prev.map(i => i.id === id ? { ...i, status: 'Completed' } : i));
  };

  const upcoming = inspections.filter(i => i.status === 'Scheduled');
  const completed = inspections.filter(i => i.status === 'Completed');
  const shown = tab === 'upcoming' ? upcoming : completed;

  return (
    <RoleGuard allowedRoles={['road_inspector', 'executive_engineer', 'district_authority', 'state_authority', 'super_admin']}>
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6">
        <AuthorityPageHeader
          role="Road Inspector"
          title="Field Inspections"
          subtitle="Scheduled visits, inspection notes, and field verification"
          level={3}
        />

        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
          {[
            { label: 'Upcoming Visits', value: upcoming.length, icon: '🗺️', color: 'bg-blue-50 text-blue-700' },
            { label: 'Completed', value: completed.length, icon: '✅', color: 'bg-green-50 text-green-700' },
            { label: 'Pending Review', value: complaints.length, icon: '⏳', color: 'bg-yellow-50 text-yellow-700' },
            { label: 'Reports Filed', value: 18, icon: '📋', color: 'bg-purple-50 text-purple-700' },
          ].map((s, i) => (
            <motion.div key={s.label} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
              className={`rounded-2xl p-4 border border-current/10 ${s.color}`}>
              <div className="text-2xl mb-1">{s.icon}</div>
              <div className="text-2xl font-bold font-sora">{s.value}</div>
              <div className="text-xs font-medium opacity-70">{s.label}</div>
            </motion.div>
          ))}
        </div>

        <div className="grid lg:grid-cols-3 gap-4">
          <div className="lg:col-span-2">
            <div className="flex items-center gap-2 mb-4 bg-secondary/50 rounded-2xl p-1.5">
              {[['upcoming', '🗓️ Upcoming'], ['completed', '✅ Completed']].map(([key, label]) => (
                <button key={key} onClick={() => setTab(key)}
                  className={`flex-1 py-1.5 px-3 rounded-xl text-xs font-medium transition-all ${tab === key ? 'bg-white text-foreground shadow-sm' : 'text-muted-foreground'}`}>
                  {label}
                </button>
              ))}
            </div>

            <div className="space-y-3">
              {shown.map((insp, i) => (
                <InspectionCard key={insp.id} inspection={insp} index={i} onComplete={handleComplete} />
              ))}
              {shown.length === 0 && (
                <div className="text-center py-12 text-muted-foreground">
                  <Camera className="w-10 h-10 mx-auto mb-3 opacity-30" />
                  <p className="font-medium text-sm">No inspections in this category</p>
                </div>
              )}
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-4">
            {/* Awaiting Field Visit */}
            <div className="bg-card rounded-2xl border border-border/60 p-4">
              <h3 className="font-semibold text-sm mb-3 flex items-center gap-2">
                <MapPin className="w-4 h-4 text-primary" /> Awaiting Field Visit
              </h3>
              {loading ? (
                <div className="space-y-2">{[...Array(3)].map((_, i) => <div key={i} className="h-12 bg-muted rounded-xl animate-pulse" />)}</div>
              ) : complaints.length === 0 ? (
                <p className="text-xs text-muted-foreground">No complaints awaiting inspection.</p>
              ) : complaints.slice(0, 5).map(c => (
                <Link key={c.id} to={`/complaints/${c.id}`}>
                  <div className="flex items-center gap-2 py-2 border-b border-border/40 last:border-0 hover:bg-secondary/30 rounded-lg px-1 -mx-1 transition-colors">
                    <div className="flex-1 min-w-0">
                      <div className="text-xs font-medium truncate">{c.title}</div>
                      <div className="text-xs text-muted-foreground">{c.district}</div>
                    </div>
                    <SeverityBadge severity={c.severity} />
                  </div>
                </Link>
              ))}
            </div>

            {/* Quick upload */}
            <div className="bg-gradient-to-br from-primary/5 to-primary/10 border border-primary/20 rounded-2xl p-4">
              <div className="flex items-center gap-2 mb-3">
                <Camera className="w-5 h-5 text-primary" />
                <h3 className="font-semibold text-sm text-primary">Upload Field Media</h3>
              </div>
              <p className="text-xs text-muted-foreground mb-3">Upload inspection photos and videos directly from the field.</p>
              <Button size="sm" className="w-full h-8 text-xs gradient-primary border-0 text-white">
                <Camera className="w-3 h-3 mr-1" /> Open Camera / Gallery
              </Button>
            </div>
          </div>
        </div>
      </div>
    </RoleGuard>
  );
}