// Service layer for Notifications
// Handles fetching, marking read, and storing notifications with localStorage persistence.
// Easy replacement for future REST API integration.

const NOTIFICATIONS_KEY = 'rw_notifications';

const seedNotifications = [
  {
    id: 'notif_1',
    title: '🚨 Nearby Road Alert: Potholes Detected',
    body: 'AI-Camera detected 4 new potholes on NH-44 Section A (1.2 km from your reported zone).',
    priority: 'high',
    type: 'complaint_update', // maps to icon configs in UI
    is_read: false,
    created_date: new Date(Date.now() - 1000 * 60 * 15).toISOString(), // 15 mins ago
  },
  {
    id: 'notif_2',
    title: '🔧 Complaint Status Update: Assigned',
    body: 'Your reported issue #CMP-9201 (Water clogging on SH-22) has been assigned to MMRDA Contractor.',
    priority: 'medium',
    type: 'complaint_update',
    is_read: false,
    created_date: new Date(Date.now() - 1000 * 60 * 120).toISOString(), // 2 hours ago
  },
  {
    id: 'notif_3',
    title: '💬 Community Reply on NH-44',
    body: 'Ravi Kumar replied: "I ride here daily, the depth is at least 6 inches now. Heavy vehicles are struggling."',
    priority: 'low',
    type: 'forum_created',
    is_read: false,
    created_date: new Date(Date.now() - 1000 * 60 * 300).toISOString(), // 5 hours ago
  },
  {
    id: 'notif_4',
    title: '🛡️ Authority Response Filed',
    body: 'District Collector Chennai officially replied to the school danger zone pothole concern.',
    priority: 'critical',
    type: 'assignment',
    is_read: true,
    created_date: new Date(Date.now() - 1000 * 60 * 1440).toISOString(), // 1 day ago
  },
  {
    id: 'notif_5',
    title: '⭐ Community Supervote',
    body: 'Your post was Supervoted by District Collector Chennai, increasing its civic visibility score.',
    priority: 'high',
    type: 'achievement',
    is_read: true,
    created_date: new Date(Date.now() - 1000 * 60 * 2880).toISOString(), // 2 days ago
  },
  {
    id: 'notif_6',
    title: '⚠️ Road Health Alert: Critical Decline',
    body: 'NH-60 Pune-Nashik highway health rating dropped to 35% (Poor) due to ongoing drainage failure.',
    priority: 'critical',
    type: 'system',
    is_read: true,
    created_date: new Date(Date.now() - 1000 * 60 * 4320).toISOString(), // 3 days ago
  },
  {
    id: 'notif_7',
    title: '🏛️ Admin Announcement',
    body: 'RoadWatch v2.1.0 release: Interactive contractor scorecards and budget monitors are now live.',
    priority: 'medium',
    type: 'system',
    is_read: true,
    created_date: new Date(Date.now() - 1000 * 60 * 10080).toISOString(), // 7 days ago
  }
];

function initializeStorage() {
  if (!localStorage.getItem(NOTIFICATIONS_KEY)) {
    localStorage.setItem(NOTIFICATIONS_KEY, JSON.stringify(seedNotifications));
  }
}

initializeStorage();

function getStoredNotifications() {
  return JSON.parse(localStorage.getItem(NOTIFICATIONS_KEY)) || [];
}

function setStoredNotifications(notifs) {
  localStorage.setItem(NOTIFICATIONS_KEY, JSON.stringify(notifs));
  // Dispatch a storage event to synchronize with other tabs/components
  window.dispatchEvent(new Event('storage'));
}

export const notificationService = {
  async getNotifications(limit = 50) {
    await new Promise(r => setTimeout(r, 100)); // simulate latency
    const list = getStoredNotifications();
    // Sort by created_date desc
    list.sort((a, b) => new Date(b.created_date) - new Date(a.created_date));
    return list.slice(0, limit);
  },

  async markAsRead(id) {
    await new Promise(r => setTimeout(r, 50));
    const list = getStoredNotifications();
    const idx = list.findIndex(n => n.id === id);
    if (idx !== -1) {
      list[idx].is_read = true;
      setStoredNotifications(list);
      return list[idx];
    }
    return null;
  },

  async markAllAsRead() {
    await new Promise(r => setTimeout(r, 80));
    const list = getStoredNotifications();
    const updated = list.map(n => ({ ...n, is_read: true }));
    setStoredNotifications(updated);
    return updated;
  },

  async addNotification({ title, body, priority = 'medium', type = 'system' }) {
    const list = getStoredNotifications();
    const newNotif = {
      id: 'notif_' + Math.random().toString(36).substr(2, 6),
      title,
      body,
      priority,
      type,
      is_read: false,
      created_date: new Date().toISOString(),
    };
    list.unshift(newNotif);
    setStoredNotifications(list);
    return newNotif;
  },

  async deleteNotification(id) {
    const list = getStoredNotifications();
    const filtered = list.filter(n => n.id !== id);
    setStoredNotifications(filtered);
    return true;
  }
};
