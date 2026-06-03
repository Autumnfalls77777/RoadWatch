import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ArrowLeft, AlertCircle, Activity, Building2, DollarSign, MapPin, Shield, Trophy } from 'lucide-react';
import { Button } from '@/components/ui/button';
import SkeletonCard from '@/components/shared/SkeletonCard';

export default function WardProfilePage() {
  const { wardId } = useParams();
  const [ward, setWard] = useState(null);
  const [roads, setRoads] = useState([]);
  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      fetch(`http://localhost:8787/api/wards/${wardId}`).then(r => r.json()),
      fetch('http://localhost:8787/api/roads').then(r => r.json()),
      fetch('http://localhost:8787/api/complaints').then(r => r.json()),
    ]).then(([wardRecord, roadList, complaintList]) => {
      setWard(wardRecord);
      const wardRoads = roadList.filter(r => r.ward_id === wardId || r.ward === wardRecord.name);
      setRoads(wardRoads);
      setComplaints(complaintList.filter(c => c.ward_id === wardId || c.ward === wardRecord.name));
    }).finally(() => setLoading(false));
  }, [wardId]);

  if (loading) return <div className="max-w-3xl mx-auto px-4 py-8 space-y-3"><SkeletonCard lines={6} /><SkeletonCard lines={4} /></div>;

  if (!ward) return (
    <div className="max-w-2xl mx-auto px-4 py-16 text-center">
      <h2 className="text-xl font-semibold mb-2 text-white">Ward profile not found</h2>
      <Link to="/map"><Button variant="outline">View Live Map</Button></Link>
    </div>
  );

  const allocated = roads.reduce((sum, road) => sum + Number(road.allocated_budget || 0), 0);
  const spent = roads.reduce((sum, road) => sum + Number(road.spent_budget || 0), 0);
  const activeComplaints = complaints.filter(c => !['Resolved', 'completed', 'Completed'].includes(c.status)).length;

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-6 text-slate-300 space-y-4">
      <Link to="/map" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors">
        <ArrowLeft className="w-4 h-4" />
        Back to Map
      </Link>

      <div className="bg-card rounded-2xl border border-border/60 p-5 shadow-md">
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="text-xs text-primary font-bold uppercase tracking-wider">Ward Profile</div>
            <h1 className="text-2xl font-bold text-white mt-1">{ward.name || ward.ward_name}</h1>
            <div className="flex items-center gap-1.5 mt-2 text-sm text-muted-foreground">
              <MapPin className="w-4 h-4 text-primary" />
              Ward {ward.ward_number} · {ward.zone || 'Unassigned Zone'} · {ward.city}
            </div>
          </div>
          <div className="text-right">
            <div className="text-3xl font-black text-white">{ward.health_score || 0}</div>
            <div className="text-xs text-muted-foreground">Road Health Score</div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Metric icon={Trophy} label="Ward Ranking" value={`#${ward.rank || '-'}`} />
        <Metric icon={Activity} label="Road Length" value={`${Number(ward.length_km || 0).toFixed(2)} km`} />
        <Metric icon={Shield} label="Footpath Coverage" value={`${Math.round(ward.footpath_coverage_percent || 0)}%`} />
        <Metric icon={AlertCircle} label="Complaints" value={`${complaints.length} total`} />
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        <div className="bg-card rounded-2xl border border-border/60 p-5 shadow-md space-y-3">
          <h2 className="font-semibold text-white flex items-center gap-2"><AlertCircle className="w-4 h-4" /> Complaint Statistics</h2>
          <Row label="Active complaints" value={activeComplaints} />
          <Row label="Resolved complaints" value={complaints.length - activeComplaints} />
          <Row label="Complaint density" value={`${(complaints.length / (Number(ward.length_km || 1))).toFixed(2)} per km`} />
        </div>

        <div className="bg-card rounded-2xl border border-border/60 p-5 shadow-md space-y-3">
          <h2 className="font-semibold text-white flex items-center gap-2"><DollarSign className="w-4 h-4" /> Budget Statistics</h2>
          <Row label="Allocated" value={formatMoney(allocated)} />
          <Row label="Utilized" value={formatMoney(spent)} />
          <Row label="Remaining" value={formatMoney(allocated - spent)} />
        </div>
      </div>

      <div className="bg-card rounded-2xl border border-border/60 p-5 shadow-md space-y-3">
        <h2 className="font-semibold text-white flex items-center gap-2"><Building2 className="w-4 h-4" /> Responsible Authority</h2>
        <Row label="Authority" value={ward.authority_name || 'Municipal Road Department'} />
        <Row label="Road records" value={roads.length} />
        <Row label="Safety score" value={`${ward.safety_score || ward.health_score || 0}/100`} />
      </div>
    </div>
  );
}

function Metric({ icon: Icon, label, value }) {
  return (
    <div className="bg-card rounded-2xl border border-border/60 p-4 text-center shadow-md">
      <Icon className="w-4 h-4 mx-auto mb-2 text-primary" />
      <div className="font-bold text-white">{value}</div>
      <div className="text-[10px] text-muted-foreground font-semibold uppercase">{label}</div>
    </div>
  );
}

function Row({ label, value }) {
  return (
    <div className="flex items-center justify-between gap-3 text-sm border-b border-border/40 last:border-0 pb-2 last:pb-0">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-semibold text-white text-right">{value}</span>
    </div>
  );
}

function formatMoney(value) {
  if (value >= 10000000) return `Rs ${(value / 10000000).toFixed(2)} Cr`;
  if (value >= 100000) return `Rs ${(value / 100000).toFixed(2)} L`;
  return `Rs ${Number(value || 0).toLocaleString('en-IN')}`;
}
