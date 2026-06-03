import { Search, Filter, X } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

const CATEGORIES = ['All', 'Pothole', 'Crack', 'Waterlogging', 'Broken Road', 'Missing Signage', 'Unsafe Construction', 'Drainage Issue', 'Other'];
const SEVERITIES = ['All', 'Low', 'Medium', 'High', 'Critical'];
const STATUSES = ['All', 'Submitted', 'AI Verified', 'Under Review', 'In Progress', 'Resolved'];
const SORT_OPTIONS = [
  { value: '-created_date', label: 'Newest First' },
  { value: 'created_date', label: 'Oldest First' },
  { value: '-upvotes', label: 'Most Upvoted' },
  { value: '-verified_count', label: 'Most Verified' },
];

export default function ComplaintFilters({ filters, onChange }) {
  const update = (key, value) => onChange({ ...filters, [key]: value });
  const hasFilters = filters.category !== 'All' || filters.severity !== 'All' || filters.status !== 'All' || filters.search;

  return (
    <div className="space-y-3">
      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          placeholder="Search complaints..."
          value={filters.search || ''}
          onChange={(e) => update('search', e.target.value)}
          className="pl-10 bg-card"
        />
      </div>

      {/* Filter row */}
      <div className="flex items-center gap-2 flex-wrap">
        <Select value={filters.category || 'All'} onValueChange={(v) => update('category', v)}>
          <SelectTrigger className="w-36 bg-card text-sm h-9">
            <SelectValue placeholder="Category" />
          </SelectTrigger>
          <SelectContent>
            {CATEGORIES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
          </SelectContent>
        </Select>

        <Select value={filters.severity || 'All'} onValueChange={(v) => update('severity', v)}>
          <SelectTrigger className="w-32 bg-card text-sm h-9">
            <SelectValue placeholder="Severity" />
          </SelectTrigger>
          <SelectContent>
            {SEVERITIES.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
          </SelectContent>
        </Select>

        <Select value={filters.status || 'All'} onValueChange={(v) => update('status', v)}>
          <SelectTrigger className="w-36 bg-card text-sm h-9">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            {STATUSES.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
          </SelectContent>
        </Select>

        <Select value={filters.sort || '-created_date'} onValueChange={(v) => update('sort', v)}>
          <SelectTrigger className="w-40 bg-card text-sm h-9">
            <SelectValue placeholder="Sort by" />
          </SelectTrigger>
          <SelectContent>
            {SORT_OPTIONS.map((s) => <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>)}
          </SelectContent>
        </Select>

        {hasFilters && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onChange({ category: 'All', severity: 'All', status: 'All', search: '', sort: '-created_date' })}
            className="gap-1.5 text-muted-foreground h-9"
          >
            <X className="w-3.5 h-3.5" />
            Clear
          </Button>
        )}
      </div>
    </div>
  );
}