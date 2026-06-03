import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { MessageSquare, Users, TrendingUp, MapPin, Clock } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { formatDistanceToNow } from 'date-fns';
import PageHeader from '@/components/shared/PageHeader';
import { SkeletonList } from '@/components/shared/SkeletonCard';
import EmptyState from '@/components/shared/EmptyState';

function ForumCard({ forum, index }) {
  const timeAgo = forum.created_date ? formatDistanceToNow(new Date(forum.created_date), { addSuffix: true }) : '';
  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.05 }}>
      <Link to={`/forums/${forum.id}`}>
        <div className="bg-card rounded-2xl border border-border/60 p-5 card-hover">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-2xl bg-accent flex items-center justify-center flex-shrink-0">
              <MessageSquare className="w-6 h-6 text-accent-foreground" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-2 mb-1">
                <h3 className="font-semibold text-foreground line-clamp-2 text-sm leading-snug">{forum.title}</h3>
                <span className={`flex-shrink-0 px-2 py-0.5 rounded-full text-xs font-medium ${
                  forum.status === 'Active' ? 'bg-green-50 text-green-700 border border-green-200' :
                  forum.status === 'Resolved' ? 'bg-blue-50 text-blue-700 border border-blue-200' :
                  'bg-gray-50 text-gray-600 border border-gray-200'
                }`}>{forum.status}</span>
              </div>
              {forum.road_name && (
                <div className="flex items-center gap-1 text-xs text-muted-foreground mb-2">
                  <MapPin className="w-3 h-3" />{forum.road_name}
                </div>
              )}
              {forum.description && (
                <p className="text-xs text-muted-foreground line-clamp-2 mb-3">{forum.description}</p>
              )}
              <div className="flex items-center gap-4 text-xs text-muted-foreground">
                <span className="flex items-center gap-1"><MessageSquare className="w-3 h-3" />{forum.post_count || 0} posts</span>
                <span className="flex items-center gap-1"><Users className="w-3 h-3" />{forum.participant_count || 0} participants</span>
                {timeAgo && <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{timeAgo}</span>}
              </div>
            </div>
          </div>
        </div>
      </Link>
    </motion.div>
  );
}

export default function ForumsPage() {
  const [forums, setForums] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');

  useEffect(() => {
    base44.entities.Forum.list('-created_date', 50)
      .then(setForums)
      .catch(() => setForums([]))
      .finally(() => setLoading(false));
  }, []);

  const filtered = forums.filter(f => {
    if (statusFilter !== 'All' && f.status !== statusFilter) return false;
    if (search && !f.title?.toLowerCase().includes(search.toLowerCase()) && !f.road_name?.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-6">
      <PageHeader
        title="Road Forums"
        subtitle="Community discussions about road conditions"
        badge="Community"
      />

      {/* Info banner */}
      <div className="bg-accent/50 border border-accent rounded-2xl p-4 mb-6">
        <div className="flex items-start gap-3">
          <div className="w-8 h-8 rounded-xl bg-accent flex items-center justify-center flex-shrink-0">
            <TrendingUp className="w-4 h-4 text-accent-foreground" />
          </div>
          <div>
            <div className="font-semibold text-sm text-accent-foreground mb-0.5">Auto-created Forums</div>
            <p className="text-xs text-muted-foreground">Forums are automatically created when a road complaint reaches 30+ verified upvotes or an officer escalates the issue. Nearby citizens are notified to participate.</p>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex gap-2 mb-5 flex-wrap">
        <div className="relative flex-1 min-w-[200px]">
          <MessageSquare className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input placeholder="Search forums..." value={search} onChange={e => setSearch(e.target.value)} className="pl-10 bg-card" />
        </div>
        <div className="flex gap-1">
          {['All', 'Active', 'Resolved', 'Archived'].map(s => (
            <Button
              key={s}
              size="sm"
              variant={statusFilter === s ? 'default' : 'outline'}
              onClick={() => setStatusFilter(s)}
              className={statusFilter === s ? 'gradient-primary border-0 text-white' : ''}
            >
              {s}
            </Button>
          ))}
        </div>
      </div>

      {loading ? <SkeletonList count={4} /> : filtered.length === 0 ? (
        <EmptyState
          icon={MessageSquare}
          title="No forums found"
          description="No active road forums in your area yet. Be the first to report an issue — when it reaches 30 upvotes, a forum auto-creates!"
        />
      ) : (
        <div className="space-y-3">
          {filtered.map((f, i) => <ForumCard key={f.id} forum={f} index={i} />)}
        </div>
      )}
    </div>
  );
}