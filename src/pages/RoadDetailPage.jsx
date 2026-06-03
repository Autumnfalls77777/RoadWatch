import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, MapPin, Calendar, Wrench, DollarSign, Activity, Clock, User, AlertCircle, CheckCircle, Building, MessageSquare, Flame, Star, ThumbsUp, ChevronRight, Cpu, Shield } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { communityService } from '@/services/communityService';
import { RoadHealthScore, getHealthColor } from '@/components/shared/HealthBadge';
import { Button } from '@/components/ui/button';
import { motion } from 'framer-motion';
import { format, formatDistanceToNow } from 'date-fns';
import SkeletonCard from '@/components/shared/SkeletonCard';
import DataSourcesPanel from '@/components/shared/DataSourcesPanel';

const TIMELINE_ICONS = {
  'Road Built': Building,
  'Repair Completed': CheckCircle,
  'Complaint Filed': AlertCircle,
  'Inspection Conducted': Activity,
  'Pothole Detected': AlertCircle,
  'Repair Approved': CheckCircle,
  'Budget Allocated': DollarSign,
  'Contractor Assigned': User,
  'Status Update': Clock,
  'Forum Created': AlertCircle,
};

const TIMELINE_COLORS = {
  'Road Built': 'bg-blue-100 text-blue-600 dark:bg-blue-950/40 dark:text-blue-400',
  'Repair Completed': 'bg-green-100 text-green-600 dark:bg-green-950/40 dark:text-green-400',
  'Complaint Filed': 'bg-red-100 text-red-600 dark:bg-red-950/40 dark:text-red-400',
  'Inspection Conducted': 'bg-purple-100 text-purple-600 dark:bg-purple-950/40 dark:text-purple-400',
  'Pothole Detected': 'bg-orange-100 text-orange-600 dark:bg-orange-950/40 dark:text-orange-400',
  'Repair Approved': 'bg-green-100 text-green-600 dark:bg-green-950/40 dark:text-green-400',
  'Budget Allocated': 'bg-yellow-100 text-yellow-600 dark:bg-yellow-950/40 dark:text-yellow-400',
  'Contractor Assigned': 'bg-blue-100 text-blue-600 dark:bg-blue-950/40 dark:text-blue-400',
};

function TimelineItem({ event, isLast }) {
  const Icon = TIMELINE_ICONS[event.event_type] || Clock;
  const colorClass = TIMELINE_COLORS[event.event_type] || 'bg-secondary text-muted-foreground';

  return (
    <div className="flex gap-4">
      <div className="flex flex-col items-center">
        <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${colorClass}`}>
          <Icon className="w-4 h-4" />
        </div>
        {!isLast && <div className="w-px flex-1 bg-border mt-2 mb-0"></div>}
      </div>
      <div className="pb-5 flex-1 text-slate-300">
        <div className="font-semibold text-sm text-white">{event.event_type}</div>
        {event.description && <p className="text-xs text-slate-400 mt-0.5">{event.description}</p>}
        <div className="flex items-center gap-3 mt-1 text-[11px] text-slate-500">
          {event.event_date && <span>{format(new Date(event.event_date), 'dd MMM yyyy')}</span>}
          {event.actor_name && <span>by {event.actor_name}</span>}
        </div>
      </div>
    </div>
  );
}

function BudgetBar({ allocated, spent }) {
  const pct = allocated > 0 ? Math.min((spent / allocated) * 100, 100) : 0;
  const remaining = Math.max(0, allocated - spent);
  const color = pct > 90 ? 'bg-red-500' : pct > 70 ? 'bg-orange-500' : 'bg-green-500';

  return (
    <div>
      <div className="flex justify-between text-xs mb-1.5 text-muted-foreground font-semibold">
        <span>Spent: ₹{(spent / 100000).toFixed(1)} Lakh</span>
        <span>Remaining: ₹{(remaining / 100000).toFixed(1)} Lakh</span>
      </div>
      <div className="h-3 bg-secondary rounded-full overflow-hidden">
        <div className={`h-full rounded-full ${color} transition-all duration-700`} style={{ width: `${pct}%` }}></div>
      </div>
      <div className="text-xs text-muted-foreground mt-1.5">{pct.toFixed(0)}% utilized of ₹{(allocated / 100000).toFixed(1)} Lakh total</div>
    </div>
  );
}

function RoadCommunitySection({ roadId, roadName }) {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    communityService.getPosts({ roadId, sort: 'score', limit: 3 })
      .then(({ posts: data }) => { setPosts(data.slice(0, 3)); setLoading(false); })
      .catch(() => setLoading(false));
  }, [roadId]);

  return (
    <div className="bg-card rounded-2xl border border-border/60 p-5 shadow-md">
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-semibold flex items-center gap-2 text-white">
          <MessageSquare className="w-4 h-4" />
          Community Discussions
          {posts.length > 0 && (
            <span className="text-xs font-normal text-muted-foreground">({posts.length} active)</span>
          )}
        </h2>
        <Link to="/governance"
          className="text-xs text-primary font-semibold flex items-center gap-0.5 hover:underline">
          View all <ChevronRight className="w-3 h-3" />
        </Link>
      </div>

      {loading ? (
        <div className="space-y-2">
          {[0,1].map(i => <div key={i} className="h-14 bg-secondary/50 rounded-xl animate-pulse" />)}
        </div>
      ) : posts.length === 0 ? (
        <div className="text-center py-6">
          <MessageSquare className="w-8 h-8 mx-auto mb-2 text-muted-foreground/30" />
          <p className="text-sm text-muted-foreground mb-3">No discussions yet for this road.</p>
          <Link to="/governance">
            <Button size="sm" className="gradient-primary border-0 text-white gap-2">
              Start a Discussion
            </Button>
          </Link>
        </div>
      ) : (
        <div className="space-y-2">
          {posts.map(post => (
            <Link key={post.id} to="/governance"
              className="block rounded-xl p-3 bg-secondary/40 hover:bg-accent/40 transition-colors">
              <div className="flex items-start gap-2">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5 mb-0.5">
                    {post.is_trending && <Flame className="w-3 h-3 text-orange-500 fill-orange-400 shrink-0" />}
                    {post.is_supervoted && <Star className="w-3 h-3 text-amber-500 fill-amber-400 shrink-0" />}
                    <span className="text-xs font-semibold text-white line-clamp-1">{post.title}</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-slate-400">
                    <span className="flex items-center gap-0.5"><ThumbsUp className="w-2.5 h-2.5" /> {post.upvote_count}</span>
                    <span className="flex items-center gap-0.5"><MessageSquare className="w-2.5 h-2.5" /> {post.comment_count}</span>
                    <span>{formatDistanceToNow(new Date(post.created_at), { addSuffix: true })}</span>
                  </div>
                </div>
                <ChevronRight className="w-3.5 h-3.5 text-muted-foreground shrink-0 mt-0.5" />
              </div>
            </Link>
          ))}
          <Link to="/governance">
            <Button variant="outline" size="sm" className="w-full mt-2 gap-2 text-xs text-slate-300">
              <MessageSquare className="w-3.5 h-3.5" /> View All Discussions
            </Button>
          </Link>
        </div>
      )}
    </div>
  );
}

export default function RoadDetailPage() {
  const { roadId } = useParams();
  const [road, setRoad] = useState(null);
  const [timeline, setTimeline] = useState([]);
  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    
    // Attempt to fetch specific road from single road API endpoint
    Promise.all([
      fetch(`http://localhost:8787/api/roads/${roadId}`)
        .then(r => {
          if (!r.ok) throw new Error('API single road down');
          return r.json();
        }),
      fetch(`http://localhost:8787/api/repairs`).then(r => r.json()),
      fetch(`http://localhost:8787/api/complaints`).then(r => r.json())
    ])
      .then(([singleRoad, events, complaintData]) => {
        setRoad(singleRoad);
        setTimeline(events.filter(e => e.road_id === roadId));
        setComplaints(complaintData.filter(c => c.road_id === roadId));
      })
      .catch(async () => {
        // Fallback: list all roads and search
        try {
          const [roadsList, events, complaintData] = await Promise.all([
            base44.entities.Road.list('-created_date', 100),
            base44.entities.RoadTimeline.list('-event_date', 50),
            base44.entities.Complaint.list('-created_date', 100),
          ]);
          const found = roadsList.find(r => r.id === roadId);
          setRoad(found || null);
          setTimeline(events.filter(e => e.road_id === roadId));
          setComplaints(complaintData.filter(c => c.road_id === roadId));
        } catch (err) {
          console.error('Offline detail page load failed:', err);
        }
      })
      .finally(() => setLoading(false));
  }, [roadId]);

  if (loading) return <div className="max-w-2xl mx-auto px-4 py-8 space-y-3"><SkeletonCard lines={6} /><SkeletonCard lines={4} /></div>;

  if (!road) return (
    <div className="max-w-2xl mx-auto px-4 py-16 text-center">
      <div className="text-4xl mb-4">🛣️</div>
      <h2 className="text-xl font-semibold mb-2 text-white">Road profile not found</h2>
      <Link to="/map"><Button variant="outline">View Live Map</Button></Link>
    </div>
  );

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 py-6 text-slate-300">
      <Link to="/map" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors mb-5">
        <ArrowLeft className="w-4 h-4" />
        Back to Map
      </Link>

      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
        {/* Road Header */}
        <div className="bg-card rounded-2xl border border-border/60 p-5 shadow-md">
          <div className="flex items-start justify-between gap-3 mb-4">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <span className="px-2.5 py-0.5 bg-accent text-accent-foreground rounded-full text-xs font-semibold">{road.road_type}</span>
                <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold border ${
                  road.status === 'Excellent' || road.status === 'Good' ? 'bg-green-500/10 text-green-400 border-green-500/20' :
                  road.status === 'Under Repair' ? 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20' :
                  road.status === 'Closed' ? 'bg-red-500/10 text-red-400 border-red-500/20' :
                  'bg-orange-500/10 text-orange-400 border-orange-500/20'
                }`}>{road.status}</span>
              </div>
              <h1 className="text-xl font-bold font-sora text-white">{road.name || road.road_name}</h1>
              <div className="flex items-center gap-1.5 mt-1 text-sm text-muted-foreground">
                <MapPin className="w-3.5 h-3.5 text-primary" />
                {road.district && `${road.district}, `}{road.state || road.country}
              </div>
            </div>
            <RoadHealthScore score={road.health_score || road.current_health_score || 0} size="md" />
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              { icon: Activity, label: 'Length', value: road.length_km ? `${road.length_km} km` : '—' },
              { icon: MapPin, label: 'Ward', value: road.ward_number ? `Ward ${road.ward_number}` : (road.ward || '—') },
              { icon: Building, label: 'Zone', value: road.zone || '—' },
              { icon: Shield, label: 'Safety', value: `${road.safety_score || road.health_score || 0}/100` },
              { icon: Calendar, label: 'Built Date', value: road.construction_date ? format(new Date(road.construction_date), 'MMM yyyy') : '—' },
              { icon: Wrench, label: 'Last Relayed', value: road.last_repair_date ? format(new Date(road.last_repair_date), 'MMM yyyy') : '—' },
              { icon: AlertCircle, label: 'Total Claims', value: road.total_complaints || 0 },
            ].map((item, i) => (
              <div key={i} className="bg-secondary/35 rounded-xl p-3 text-center border border-border/40">
                <item.icon className="w-4 h-4 text-muted-foreground mx-auto mb-1" />
                <div className="font-bold text-sm text-white">{item.value}</div>
                <div className="text-[10px] text-muted-foreground font-semibold uppercase">{item.label}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Budget */}
        {road.allocated_budget > 0 && (
          <div className="bg-card rounded-2xl border border-border/60 p-5 shadow-md">
            <h2 className="font-semibold mb-4 flex items-center gap-2 text-white">
              <DollarSign className="w-4 h-4" />
              Budget Transparency
            </h2>
            <BudgetBar allocated={road.allocated_budget} spent={road.spent_budget || 0} />
          </div>
        )}

        {/* Dynamic Twin Data Feed Layers */}
        <DataSourcesPanel activeSourceIds={['osm', 'municipal', 'citizen', 'ai', 'repair', 'budget']} />

        {/* Complaints */}
        <div className="bg-card rounded-2xl border border-border/60 p-5 shadow-md">
          <h2 className="font-semibold mb-4 flex items-center gap-2 text-white">
            <AlertCircle className="w-4 h-4" />
            Active Complaints
          </h2>
          {complaints.length === 0 ? (
            <div className="text-center py-6 text-sm text-muted-foreground">No active complaint records for this road.</div>
          ) : (
            <div className="space-y-2">
              {complaints.map(c => (
                <Link key={c.id} to={`/complaints/${c.id}`} className="block rounded-xl p-3 bg-secondary/40 hover:bg-accent/40 transition-colors border border-border/40">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="text-sm font-semibold text-white line-clamp-1">{c.title}</div>
                      <div className="text-xs text-slate-400 mt-0.5">{c.verification_status || 'Under Review'} · {c.community_confidence_score || 0}% community confidence</div>
                    </div>
                    <span className="text-xs font-bold text-primary shrink-0">{c.status}</span>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* Responsible Parties */}
        {(road.contractor_name || road.contractor_id) && (
          <div className="bg-card rounded-2xl border border-border/60 p-5 shadow-md">
            <h2 className="font-semibold mb-3 flex items-center gap-2 text-white">
              <User className="w-4 h-4" />
              Responsible Parties
            </h2>
            <div className="space-y-2.5">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Contractor Team</span>
                <span className="font-semibold text-white">{road.contractor_name || 'Assigned Road Builder'}</span>
              </div>
              {(road.authority_name || road.authority_id) && (
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Governing Authority</span>
                  <span className="font-semibold text-white">{road.authority_name || 'Municipal Ward Office'}</span>
                </div>
              )}
              {road.traffic_density && (
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Traffic Density index</span>
                  <span className="font-semibold text-white">{road.traffic_density}</span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Repair History */}
        <div className="bg-card rounded-2xl border border-border/60 p-5 shadow-md">
          <h2 className="font-semibold mb-4 flex items-center gap-2 text-white">
            <Clock className="w-4 h-4" />
            Repair & Relaying History
          </h2>
          {timeline.length === 0 ? (
            <div className="text-center py-8 text-sm text-muted-foreground">No historical repairs registered.</div>
          ) : (
            <div className="space-y-3">
              {timeline.map((event, i) => (
                <div key={event.id} className="rounded-xl border border-border/60 bg-secondary/15 p-4 space-y-3">
                  <TimelineItem event={event} isLast={i === timeline.length - 1} />
                  <div className="grid sm:grid-cols-2 gap-2.5 text-xs">
                    <div className="bg-slate-950/40 rounded-xl border border-border/40 p-3">
                      <div className="font-bold text-muted-foreground mb-1">Pre-relaying status</div>
                      <p className="text-slate-300">{event.before_repair || 'Distress parameters not visualised'}</p>
                    </div>
                    <div className="bg-slate-950/40 rounded-xl border border-border/40 p-3">
                      <div className="font-bold text-muted-foreground mb-1">Post-relaying outcome</div>
                      <p className="text-slate-300">{event.after_repair || 'SLA outcome not audited'}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Community Discussions */}
        <RoadCommunitySection roadId={roadId} roadName={road?.name || road?.road_name} />

        {/* Actions */}
        <div className="flex gap-2">
          <Link to="/report" className="flex-1">
            <Button variant="outline" className="w-full gap-2 text-slate-200">
              <AlertCircle className="w-4 h-4 text-primary" />
              Report Issue on this Road
            </Button>
          </Link>
          <Link to="/complaints" className="flex-1">
            <Button className="w-full gradient-primary border-0 text-white gap-2">
              View Complaints
            </Button>
          </Link>
        </div>
      </motion.div>
    </div>
  );
}
