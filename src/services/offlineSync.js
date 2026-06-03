const API_BASE = import.meta.env.VITE_ROADWATCH_API_URL || 'http://localhost:8787/api';

export async function registerOfflineSupport() {
  if ('serviceWorker' in navigator) {
    await navigator.serviceWorker.register('/sw.js');
    navigator.serviceWorker.addEventListener('message', event => {
      if (event.data?.type === 'ROADWATCH_SYNC_REQUEST') syncOfflineComplaints();
    });
  }
  window.addEventListener('online', syncOfflineComplaints);
  window.dispatchEvent(new CustomEvent('roadwatch-sync-status', { detail: getSyncStatus() }));
}

export function getSyncStatus() {
  return {
    online: navigator.onLine,
    pending: JSON.parse(localStorage.getItem('rw_offline_complaints') || '[]').length,
  };
}

export async function syncOfflineComplaints() {
  const complaints = JSON.parse(localStorage.getItem('rw_offline_complaints') || '[]');
  if (!navigator.onLine || complaints.length === 0) return getSyncStatus();
  const token = localStorage.getItem('mock_auth_token');
  const res = await fetch(`${API_BASE}/sync/offline`, {
    method: 'POST',
    headers: { 'content-type': 'application/json', ...(token ? { authorization: `Bearer ${token}` } : {}) },
    body: JSON.stringify({ complaints }),
  });
  if (res.ok) localStorage.removeItem('rw_offline_complaints');
  const status = getSyncStatus();
  window.dispatchEvent(new CustomEvent('roadwatch-sync-status', { detail: status }));
  return status;
}
