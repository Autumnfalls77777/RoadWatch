import { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Shield, Search, ChevronDown, Check, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { ROLE_LABELS, ROLE_LEVELS } from './RoleGuard';
import { toast } from 'sonner';

const ROLES = Object.entries(ROLE_LABELS).map(([value, label]) => ({ value, label }));

const roleColors = {
  citizen: 'bg-gray-100 text-gray-700 border-gray-200',
  field_officer: 'bg-blue-50 text-blue-700 border-blue-200',
  road_inspector: 'bg-purple-50 text-purple-700 border-purple-200',
  executive_engineer: 'bg-yellow-50 text-yellow-700 border-yellow-200',
  district_authority: 'bg-orange-50 text-orange-700 border-orange-200',
  state_authority: 'bg-red-50 text-red-700 border-red-200',
  super_admin: 'bg-emerald-50 text-emerald-700 border-emerald-200',
};

export default function UserRoleManager() {
  const [profiles, setProfiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [updating, setUpdating] = useState(null);

  useEffect(() => {
    loadProfiles();
  }, []);

  const loadProfiles = async () => {
    setLoading(true);
    try {
      const data = await base44.entities.UserProfile.list('-created_date', 100);
      setProfiles(data);
    } finally {
      setLoading(false);
    }
  };

  const assignRole = async (profile, newRole) => {
    setUpdating(profile.id);
    try {
      await base44.entities.UserProfile.update(profile.id, { role: newRole });
      setProfiles(prev => prev.map(p => p.id === profile.id ? { ...p, role: newRole } : p));
      toast.success(`Role updated to ${ROLE_LABELS[newRole]}`);
    } catch {
      toast.error('Failed to update role');
    } finally {
      setUpdating(null);
    }
  };

  const filtered = profiles.filter(p =>
    (p.display_name || p.user_email || '').toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="bg-card rounded-2xl border border-border/60 p-5">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-emerald-100 flex items-center justify-center">
            <Users className="w-4 h-4 text-emerald-600" />
          </div>
          <div>
            <h3 className="font-semibold text-sm">User Role Management</h3>
            <p className="text-xs text-muted-foreground">{profiles.length} registered users</p>
          </div>
        </div>
        <Button variant="outline" size="sm" onClick={loadProfiles}>Refresh</Button>
      </div>

      <div className="relative mb-4">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          placeholder="Search by name or email..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="pl-9 h-9 text-sm"
        />
      </div>

      {loading ? (
        <div className="flex justify-center py-8">
          <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground text-sm">
          No users found. Users appear here after they log in.
        </div>
      ) : (
        <div className="space-y-2 max-h-[420px] overflow-y-auto pr-1">
          {filtered.map(profile => (
            <div key={profile.id} className="flex items-center justify-between p-3 bg-secondary/40 rounded-xl gap-3">
              <div className="flex-1 min-w-0">
                <div className="font-medium text-sm truncate">{profile.display_name || 'Unnamed User'}</div>
                <div className="text-xs text-muted-foreground truncate">{profile.user_email}</div>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <span className={`text-[10px] px-2 py-0.5 rounded-full border font-medium ${roleColors[profile.role || 'citizen']}`}>
                  {ROLE_LABELS[profile.role || 'citizen']}
                </span>
                {updating === profile.id ? (
                  <div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                ) : (
                  <RoleDropdown
                    currentRole={profile.role || 'citizen'}
                    onSelect={(role) => assignRole(profile, role)}
                  />
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function RoleDropdown({ currentRole, onSelect }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="relative">
      <Button
        variant="outline"
        size="sm"
        className="h-7 text-xs px-2 gap-1"
        onClick={() => setOpen(!open)}
      >
        <Shield className="w-3 h-3" />
        Assign
        <ChevronDown className="w-3 h-3" />
      </Button>
      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute right-0 top-full mt-1 bg-white border border-border rounded-xl shadow-xl z-50 min-w-[190px] p-1.5">
            {ROLES.map(({ value, label }) => (
              <button
                key={value}
                onClick={() => { onSelect(value); setOpen(false); }}
                className="flex items-center justify-between w-full px-3 py-2 text-xs font-medium rounded-lg hover:bg-secondary transition-colors"
              >
                <span>{label}</span>
                <span className="flex items-center gap-1.5">
                  <span className="text-muted-foreground">L{ROLE_LEVELS[value]}</span>
                  {currentRole === value && <Check className="w-3 h-3 text-primary" />}
                </span>
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}