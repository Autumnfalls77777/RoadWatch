import { useState, useEffect } from 'react';
import { Bell, CheckCircle, AlertCircle, MessageSquare, Award, Info, Check, Trash2 } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { motion } from 'framer-motion';
import { formatDistanceToNow } from 'date-fns';
import PageHeader from '@/components/shared/PageHeader';
import EmptyState from '@/components/shared/EmptyState';

const PRIORITY_CONFIG = {
  critical: { color: 'border-l-red-500 bg-red-50/30', icon: AlertCircle, iconColor: 'text-red-500', badge: 'bg-red-100 text-red-700' },
  high: { color: 'border-l-orange-500 bg-orange-50/30', icon: AlertCircle, iconColor: 'text-orange-500', badge: 'bg-orange-100 text-orange-700' },
  medium: { color: 'border-l-blue-500 bg-blue-50/20', icon: Info, iconColor: 'text-blue-500', badge: 'bg-blue-100 text-blue-700' },
  low: { color: 'border-l-border bg-card', icon: Bell, iconColor: 'text-muted-foreground', badge: 'bg-secondary text-secondary-foreground' },
};

const TYPE_ICONS = {
  complaint_update: CheckCircle,
  upvote_milestone: Award,
  forum_created: MessageSquare,
  assignment: AlertCircle,
  system: Info,
  achievement: Award,
};

function NotificationItem({ notif, onRead, index }) {
  const config = PRIORITY_CONFIG[notif.priority] || PRIORITY_CONFIG.low;
  const IconComp = TYPE_ICONS[notif.type] || Bell;
  const timeAgo = notif.created_date ? formatDistanceToNow(new Date(notif.created_date), { addSuffix: true }) : '';

  return (
    <motion.div initial={{ opacity: 0, x: -12 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: index * 0.04 }}>
      <div className={`flex items-start gap-3 p-4 rounded-2xl border-l-4 border border-border/60 ${config.color} ${!notif.is_read ? 'ring-1 ring-primary/20' : ''}`}>
        <div className={`w-9 h-9 rounded-xl bg-white flex items-center justify-center flex-shrink-0 shadow-sm`}>
          <IconComp className={`w-4 h-4 ${config.iconColor}`} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div className="flex-1">
              <div className={`font-semibold text-sm ${!notif.is_read ? 'text-foreground' : 'text-foreground/80'}`}>
                {notif.title}
                {!notif.is_read && <span className="ml-2 w-2 h-2 rounded-full bg-primary inline-block"></span>}
              </div>
              <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">{notif.body}</p>
            </div>
            <span className={`text-xs px-2 py-0.5 rounded-full font-medium flex-shrink-0 ${config.badge}`}>
              {notif.priority}
            </span>
          </div>
          <div className="flex items-center justify-between mt-2">
            <span className="text-xs text-muted-foreground">{timeAgo}</span>
            {!notif.is_read && (
              <button
                onClick={() => onRead(notif.id)}
                className="text-xs text-primary hover:underline flex items-center gap-1"
              >
                <Check className="w-3 h-3" />
                Mark read
              </button>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
}

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('All');

  useEffect(() => {
    base44.entities.Notification.list('-created_date', 50)
      .then(setNotifications)
      .catch(() => setNotifications([]))
      .finally(() => setLoading(false));
  }, []);

  const handleRead = async (id) => {
    await base44.entities.Notification.update(id, { is_read: true });
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n));
  };

  const markAllRead = async () => {
    const unread = notifications.filter(n => !n.is_read);
    await Promise.all(unread.map(n => base44.entities.Notification.update(n.id, { is_read: true })));
    setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
  };

  const filtered = notifications.filter(n => {
    if (filter === 'Unread') return !n.is_read;
    if (filter === 'Critical') return n.priority === 'critical';
    return true;
  });

  const unreadCount = notifications.filter(n => !n.is_read).length;

  return (
    <div className="max-w-xl mx-auto px-4 sm:px-6 py-6">
      <PageHeader
        title="Notifications"
        subtitle={`${unreadCount} unread notification${unreadCount !== 1 ? 's' : ''}`}
        actions={
          unreadCount > 0 && (
            <Button variant="outline" size="sm" onClick={markAllRead} className="gap-1.5">
              <Check className="w-3.5 h-3.5" />
              Mark all read
            </Button>
          )
        }
      />

      {/* Priority info */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-5 text-xs">
        {[
          { label: 'Critical', desc: 'In-app + Email + WhatsApp + SMS', color: 'text-red-600 bg-red-50 border-red-200' },
          { label: 'High', desc: 'In-app + Email + WhatsApp', color: 'text-orange-600 bg-orange-50 border-orange-200' },
          { label: 'Medium', desc: 'In-app + Email', color: 'text-blue-600 bg-blue-50 border-blue-200' },
          { label: 'Low', desc: 'In-app only', color: 'text-gray-600 bg-gray-50 border-gray-200' },
        ].map(p => (
          <div key={p.label} className={`rounded-xl border p-2.5 ${p.color}`}>
            <div className="font-semibold">{p.label}</div>
            <div className="text-[10px] mt-0.5 opacity-80">{p.desc}</div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex gap-2 mb-5">
        {['All', 'Unread', 'Critical'].map(f => (
          <Button
            key={f}
            size="sm"
            variant={filter === f ? 'default' : 'outline'}
            onClick={() => setFilter(f)}
            className={filter === f ? 'gradient-primary border-0 text-white' : ''}
          >
            {f}
            {f === 'Unread' && unreadCount > 0 && (
              <span className="ml-1.5 px-1.5 py-0.5 text-[10px] rounded-full bg-white/20 font-medium">{unreadCount}</span>
            )}
          </Button>
        ))}
      </div>

      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-20 bg-muted rounded-2xl animate-pulse" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={Bell}
          title="No notifications"
          description="You're all caught up! Notifications appear here when complaints are updated, upvotes hit milestones, or forums are created."
        />
      ) : (
        <div className="space-y-2">
          {filtered.map((n, i) => (
            <NotificationItem key={n.id} notif={n} onRead={handleRead} index={i} />
          ))}
        </div>
      )}
    </div>
  );
}