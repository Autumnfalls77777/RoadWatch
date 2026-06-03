import { Link, useLocation } from 'react-router-dom';
import { Map, AlertCircle, MessageSquare, Shield, User } from 'lucide-react';

const tabs = [
  { label: 'Map', href: '/map', icon: Map },
  { label: 'Reports', href: '/complaints', icon: AlertCircle },
  { label: 'Community', href: '/governance', icon: MessageSquare },
  { label: 'Profile', href: '/profile', icon: User },
];

export default function BottomNav() {
  const location = useLocation();
  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 lg:hidden bg-white border-t border-border safe-area-pb">
      <div className="flex items-center justify-around px-2 py-2">
        {tabs.map(({ label, href, icon: TabIcon }) => {
          const active = location.pathname === href;
          return (
            <Link
              key={href}
              to={href}
              className={`flex flex-col items-center gap-0.5 px-3 py-1 rounded-xl transition-colors min-w-[56px] ${
                active ? 'text-primary' : 'text-muted-foreground'
              }`}
            >
              <TabIcon className={`w-5 h-5 ${active ? 'text-primary' : ''}`} />
              <span className={`text-[10px] font-medium ${active ? 'text-primary' : ''}`}>{label}</span>
            </Link>
          );
        })}
      </div>
    </div>
  );
}