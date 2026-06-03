import { useEffect } from 'react';
import { base44 } from '@/api/base44Client';

/**
 * On first login, ensures a UserProfile record exists for the current user.
 * Defaults to role: 'citizen'. SuperAdmin can change it later.
 */
export default function useEnsureUserProfile(user) {
  useEffect(() => {
    if (!user?.email) return;

    async function ensureProfile() {
      try {
        const existing = await base44.entities.UserProfile.filter({ user_email: user.email });
        if (existing.length === 0) {
          await base44.entities.UserProfile.create({
            user_email: user.email,
            display_name: user.full_name || '',
            role: 'citizen',
            level: 'Road Scout',
            points: 0,
            total_reports: 0,
            verified_reports: 0,
            forum_posts: 0,
          });
        }
      } catch (e) {
        // silent — profile creation is best-effort
      }
    }

    ensureProfile();
  }, [user?.email]);
}