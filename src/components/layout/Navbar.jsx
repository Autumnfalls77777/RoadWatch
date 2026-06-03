import { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Bell, Map, Menu, X, Shield, ChevronDown, User, LogOut, CheckCircle, Info, Award, AlertCircle, MessageSquare } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '@/lib/AuthContext';
import { notificationService } from '@/services/notificationService';
import { formatDistanceToNow } from 'date-fns';

const navLinks = [
  { label: 'Live Map', href: '/map' },
  { label: 'Complaints', href: '/complaints' },
  { label: 'Community', href: '/governance' },
  { label: 'Contractors', href: '/contractors' },
  { label: 'Analytics', href: '/analytics' },
];

const NOTIF_ICONS = {
  complaint_update: CheckCircle,
  upvote_milestone: Award,
  forum_created: MessageSquare,
  assignment: AlertCircle,
  system: Info,
  achievement: Award,
};

const NOTIF_COLORS = {
  critical: 'text-red-500 bg-red-50',
  high: 'text-orange-500 bg-orange-50',
  medium: 'text-blue-500 bg-blue-50',
  low: 'text-muted-foreground bg-secondary',
};

export default function Navbar() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const location = useLocation();
  const { isAuthenticated, logout, user } = useAuth();

  const isActive = (href) => location.pathname === href;

  const loadNotifications = async () => {
    try {
      const list = await notificationService.getNotifications(6);
      setNotifications(list);
      setUnreadCount(list.filter(n => !n.is_read).length);
    } catch (e) {
      console.error('Failed to load notifications in navbar:', e);
    }
  };

  useEffect(() => {
    loadNotifications();
    window.addEventListener('storage', loadNotifications);
    return () => window.removeEventListener('storage', loadNotifications);
  }, []);

  const handleMarkAllRead = async (e) => {
    e.stopPropagation();
    await notificationService.markAllAsRead();
    await loadNotifications();
  };

  const handleReadNotif = async (id, e) => {
    e.stopPropagation();
    await notificationService.markAsRead(id);
    await loadNotifications();
  };

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-md border-b border-border/60">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="flex items-center justify-between h-16">
          {/* Logo on the left */}
          <Link to="/" className="flex items-center gap-2.5 font-sora shrink-0">
            <div className="w-8 h-8 rounded-lg gradient-primary flex items-center justify-center shadow-sm">
              <Shield className="w-4 h-4 text-white" />
            </div>
            <span className="text-lg font-bold gradient-text">RoadWatch</span>
          </Link>

          {/* Centered Navigation Links */}
          <div className="hidden lg:flex items-center gap-1 justify-center flex-1 mx-8">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                to={link.href}
                className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  isActive(link.href)
                    ? 'text-primary bg-accent'
                    : 'text-muted-foreground hover:text-foreground hover:bg-secondary'
                }`}
              >
                {link.label}
              </Link>
            ))}
          </div>

          {/* Right Actions */}
          <div className="flex items-center gap-3 shrink-0">
            {/* Notification Bell Dropdown */}
            <div className="relative">
              <button 
                onClick={() => setNotifOpen(!notifOpen)}
                className={`relative p-2 rounded-lg hover:bg-secondary transition-colors ${notifOpen ? 'bg-secondary' : ''}`}
              >
                <Bell className="w-5 h-5 text-muted-foreground" />
                {unreadCount > 0 && (
                  <span className="absolute top-1.5 right-1.5 w-4 h-4 bg-destructive text-[10px] text-white font-bold flex items-center justify-center rounded-full">
                    {unreadCount}
                  </span>
                )}
              </button>

              <AnimatePresence>
                {notifOpen && (
                  <>
                    {/* Backdrop to close */}
                    <div className="fixed inset-0 z-40" onClick={() => setNotifOpen(false)} />
                    
                    <motion.div
                      initial={{ opacity: 0, y: 8, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 8, scale: 0.95 }}
                      transition={{ duration: 0.15 }}
                      className="absolute right-0 mt-2 bg-white border border-border/60 rounded-2xl shadow-xl p-3 min-w-[340px] max-w-[380px] z-50 overflow-hidden"
                    >
                      <div className="flex items-center justify-between border-b border-border/50 pb-2 mb-2">
                         <span className="font-semibold text-sm">Notifications</span>
                        {unreadCount > 0 && (
                          <button 
                            onClick={handleMarkAllRead} 
                            className="text-xs text-primary hover:underline font-medium"
                          >
                            Mark all read
                          </button>
                        )}
                      </div>

                      <div className="space-y-1.5 max-h-[280px] overflow-y-auto pr-1">
                        {notifications.map((notif) => {
                          const IconComp = NOTIF_ICONS[notif.type] || Bell;
                          const iconColor = NOTIF_COLORS[notif.priority] || NOTIF_COLORS.low;
                          const timeAgo = notif.created_date 
                            ? formatDistanceToNow(new Date(notif.created_date), { addSuffix: true }) 
                            : '';
                          return (
                            <div 
                              key={notif.id}
                              onClick={(e) => handleReadNotif(notif.id, e)}
                              className={`p-2.5 rounded-xl border border-border/40 hover:bg-secondary/40 transition-colors flex gap-2.5 cursor-pointer relative ${
                                !notif.is_read ? 'bg-accent/10 border-accent/20' : ''
                              }`}
                            >
                              <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${iconColor}`}>
                                <IconComp className="w-4 h-4" />
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="text-xs font-semibold text-foreground leading-snug truncate">
                                  {notif.title}
                                </div>
                                <p className="text-[11px] text-muted-foreground mt-0.5 leading-relaxed line-clamp-2">
                                  {notif.body}
                                </p>
                                <span className="text-[10px] text-muted-foreground/80 mt-1 block">
                                  {timeAgo}
                                </span>
                              </div>
                              {!notif.is_read && (
                                <span className="w-1.5 h-1.5 rounded-full bg-primary shrink-0 self-center" />
                              )}
                            </div>
                          );
                        })}

                        {notifications.length === 0 && (
                          <div className="text-center py-8 text-muted-foreground text-xs">
                            No notifications yet.
                          </div>
                        )}
                      </div>

                      <div className="border-t border-border/50 pt-2 mt-2 text-center">
                        <Link 
                          to="/notifications" 
                          onClick={() => setNotifOpen(false)}
                          className="text-xs text-primary hover:underline font-medium block"
                        >
                          View all notifications
                        </Link>
                      </div>
                    </motion.div>
                  </>
                )}
              </AnimatePresence>
            </div>

            <Link to="/report">
              <Button size="sm" className="text-sm gradient-primary border-0 text-white shadow-sm font-semibold">
                Report Issue
              </Button>
            </Link>

            {/* Login / Profile Controls */}
            {isAuthenticated ? (
              <Link to="/profile" className="hidden sm:block">
                <Button size="sm" variant="outline" className="text-sm border-border/60 hover:bg-secondary flex items-center gap-1.5">
                  <User className="w-4 h-4 text-muted-foreground" />
                  Dashboard
                </Button>
              </Link>
            ) : (
              <Link to="/login" className="hidden sm:block">
                <Button size="sm" className="gradient-primary border-0 text-white shadow-sm font-semibold">
                  Login
                </Button>
              </Link>
            )}

            {/* Mobile menu toggle */}
            <button
              className="lg:hidden p-2 rounded-lg hover:bg-secondary transition-colors"
              onClick={() => setMenuOpen(!menuOpen)}
            >
              {menuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      <AnimatePresence>
        {menuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="lg:hidden bg-white border-t border-border"
          >
            <div className="px-4 py-3 space-y-1">
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  to={link.href}
                  onClick={() => setMenuOpen(false)}
                  className={`block px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                    isActive(link.href)
                      ? 'text-primary bg-accent'
                      : 'text-muted-foreground hover:text-foreground hover:bg-secondary'
                  }`}
                >
                  {link.label}
                </Link>
              ))}

              <div className="pt-2 border-t border-border mt-2 space-y-2">
                {isAuthenticated ? (
                  <>
                    <Link to="/profile" onClick={() => setMenuOpen(false)}>
                      <Button variant="outline" className="w-full flex items-center justify-center gap-1.5">
                        <User className="w-4 h-4" />
                        My Profile & Dashboard
                      </Button>
                    </Link>
                    <Button 
                      variant="ghost" 
                      onClick={() => { setMenuOpen(false); logout(true); }} 
                      className="w-full text-destructive hover:bg-destructive/10 flex items-center justify-center gap-1.5"
                    >
                      <LogOut className="w-4 h-4" />
                      Logout
                    </Button>
                  </>
                ) : (
                  <Link to="/login" onClick={() => setMenuOpen(false)}>
                    <Button className="w-full gradient-primary border-0 text-white font-semibold">
                      Login
                    </Button>
                  </Link>
                )}
                <Link to="/ai-assistant" onClick={() => setMenuOpen(false)}>
                  <Button className="w-full gradient-primary border-0 text-white">AI Assistant</Button>
                </Link>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
}