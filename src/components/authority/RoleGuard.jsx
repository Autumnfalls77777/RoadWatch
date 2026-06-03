import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Shield, Lock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { base44 } from '@/api/base44Client';

// Role hierarchy levels
export const ROLE_LEVELS = {
  citizen: 1,
  junior_officer: 2,
  field_officer: 2,
  road_inspector: 3,
  executive_engineer: 4,
  district_authority: 5,
  state_authority: 6,
  contractor: 3,
  admin: 7,
  super_admin: 7,
};

export const ROLE_LABELS = {
  citizen: 'Citizen',
  junior_officer: 'Junior Officer',
  field_officer: 'Junior Officer',
  road_inspector: 'Road Inspector',
  executive_engineer: 'Executive Engineer',
  district_authority: 'District Authority',
  state_authority: 'State Authority',
  contractor: 'Contractor',
  admin: 'Admin',
  super_admin: 'Super Admin',
};

export function useUserRole() {
  const [role, setRole] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchRole() {
      try {
        const user = await base44.auth.me();
        // Check UserProfile for role
        if (user?.role) {
          setRole(user.role);
          return;
        }
        const profiles = await base44.entities.UserProfile.filter({ user_email: user.email });
        if (profiles.length > 0 && profiles[0].role) {
          setRole(profiles[0].role);
        } else {
          setRole('citizen'); // default
        }
      } catch {
        setRole('citizen');
      } finally {
        setLoading(false);
      }
    }
    fetchRole();
  }, []);

  return { role, loading, level: ROLE_LEVELS[role] || 1 };
}

export default function RoleGuard({ children, allowedRoles, minLevel }) {
  const { role, loading, level } = useUserRole();

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const hasAccess = minLevel
    ? level >= minLevel
    : allowedRoles
      ? allowedRoles.includes(role)
      : true;

  if (!hasAccess) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-4 text-center p-6">
        <div className="w-16 h-16 rounded-2xl bg-destructive/10 flex items-center justify-center">
          <Lock className="w-8 h-8 text-destructive" />
        </div>
        <div>
          <h2 className="text-lg font-bold font-sora text-foreground">Access Restricted</h2>
          <p className="text-muted-foreground text-sm mt-1">
            Your current role (<span className="font-semibold">{ROLE_LABELS[role] || role}</span>) does not have permission to view this dashboard.
          </p>
          <p className="text-muted-foreground text-xs mt-2">Contact your Super Admin to request access.</p>
        </div>
        <Link to="/authority">
          <Button variant="outline" size="sm">
            <Shield className="w-4 h-4 mr-2" />
            Back to Authority Portal
          </Button>
        </Link>
      </div>
    );
  }

  return children;
}
