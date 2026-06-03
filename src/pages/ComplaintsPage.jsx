import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Plus, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { base44 } from '@/api/base44Client';
import ComplaintCard from '@/components/complaints/ComplaintCard';
import ComplaintFilters from '@/components/complaints/ComplaintFilters';
import { SkeletonList } from '@/components/shared/SkeletonCard';
import EmptyState from '@/components/shared/EmptyState';
import PageHeader from '@/components/shared/PageHeader';
import StatCard from '@/components/shared/StatCard';
import { AlertTriangle, CheckCircle, Clock, TrendingUp } from 'lucide-react';

const DEFAULT_FILTERS = { category: 'All', severity: 'All', status: 'All', search: '', sort: '-created_date' };

export default function ComplaintsPage() {
  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState(DEFAULT_FILTERS);
  const [page, setPage] = useState(1);
  const PER_PAGE = 20;

  useEffect(() => {
    setLoading(true);
    base44.entities.Complaint.list(filters.sort, 100)
      .then(setComplaints)
      .catch(() => setComplaints([]))
      .finally(() => setLoading(false));
  }, [filters.sort]);

  const filtered = complaints.filter((c) => {
    if (filters.category !== 'All' && c.category !== filters.category) return false;
    if (filters.severity !== 'All' && c.severity !== filters.severity) return false;
    if (filters.status !== 'All' && c.status !== filters.status) return false;
    if (filters.search) {
      const q = filters.search.toLowerCase();
      if (!c.title?.toLowerCase().includes(q) && !c.location_text?.toLowerCase().includes(q)) return false;
    }
    return true;
  });

  const paginated = filtered.slice(0, page * PER_PAGE);
  const hasMore = paginated.length < filtered.length;

  const totalResolved = complaints.filter(c => c.status === 'Resolved').length;
  const totalCritical = complaints.filter(c => c.severity === 'Critical').length;
  const totalVerified = complaints.filter(c => c.status === 'AI Verified' || c.verified_count > 0).length;

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6">
      <PageHeader
        title="Complaint Board"
        subtitle="Community-reported road issues across India"
        badge="Public"
        actions={
          <Link to="/report">
            <Button className="gradient-primary border-0 text-white gap-2 shadow-sm">
              <Plus className="w-4 h-4" />
              Report Issue
            </Button>
          </Link>
        }
      />

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
        <StatCard icon={AlertTriangle} label="Total Reports" value={complaints.length.toLocaleString()} color="blue" />
        <StatCard icon={CheckCircle} label="Resolved" value={totalResolved.toLocaleString()} color="green" />
        <StatCard icon={AlertCircle} label="Critical" value={totalCritical.toLocaleString()} color="red" />
        <StatCard icon={TrendingUp} label="AI Verified" value={totalVerified.toLocaleString()} color="purple" />
      </div>

      {/* Filters */}
      <div className="mb-6">
        <ComplaintFilters filters={filters} onChange={setFilters} />
      </div>

      {/* Results count */}
      {!loading && (
        <div className="text-sm text-muted-foreground mb-4">
          Showing {paginated.length} of {filtered.length} complaints
        </div>
      )}

      {/* Complaint List */}
      {loading ? (
        <SkeletonList count={6} />
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={AlertCircle}
          title="No complaints found"
          description="No complaints match your current filters. Try adjusting or clearing the filters."
          action={<Button variant="outline" onClick={() => setFilters(DEFAULT_FILTERS)}>Clear Filters</Button>}
        />
      ) : (
        <div className="space-y-3">
          {paginated.map((c, i) => (
            <ComplaintCard key={c.id} complaint={c} index={i} />
          ))}
          {hasMore && (
            <div className="text-center pt-4">
              <Button variant="outline" onClick={() => setPage(p => p + 1)}>
                Load More ({filtered.length - paginated.length} remaining)
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}