import { useEffect, useState } from 'react';
import { Wifi, WifiOff, RefreshCw, CheckCircle2 } from 'lucide-react';
import { base44 } from '@/api/base44Client';

export default function OfflineSyncBanner() {
  const [offlineCount, setOfflineCount] = useState(0);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [syncing, setSyncing] = useState(false);
  const [syncedJustNow, setSyncedJustNow] = useState(false);

  const checkQueue = () => {
    const queue = JSON.parse(localStorage.getItem('rw_offline_complaints') || '[]');
    setOfflineCount(queue.length);
  };

  useEffect(() => {
    checkQueue();
    
    // Listen to changes in localStorage
    window.addEventListener('storage', checkQueue);
    
    const handleOnline = () => {
      setIsOnline(true);
      triggerSync();
    };
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Initial check to sync immediately if online
    if (navigator.onLine) {
      triggerSync();
    }

    return () => {
      window.removeEventListener('storage', checkQueue);
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const triggerSync = async () => {
    const queue = JSON.parse(localStorage.getItem('rw_offline_complaints') || '[]');
    if (queue.length === 0 || syncing) return;

    setSyncing(true);
    try {
      const res = await fetch('http://localhost:8787/api/sync/offline', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ complaints: queue })
      });

      if (res.ok) {
        // Clear queue
        localStorage.setItem('rw_offline_complaints', '[]');
        checkQueue();
        
        // Show success animation
        setSyncedJustNow(true);
        setTimeout(() => setSyncedJustNow(false), 3000);
        
        // Dispatch storage event to trigger list reloads
        window.dispatchEvent(new Event('storage'));
      }
    } catch (err) {
      console.error('Offline synchronization failed:', err);
    } finally {
      setSyncing(false);
    }
  };

  if (offlineCount === 0 && !syncedJustNow && isOnline) return null;

  return (
    <div className={`w-full text-xs font-bold text-center py-2.5 px-4 flex items-center justify-center gap-2 border-b backdrop-blur-md transition-all duration-300 ${!isOnline ? 'bg-amber-500/10 border-amber-500/20 text-amber-500' : syncing ? 'bg-primary/10 border-primary/20 text-primary' : syncedJustNow ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-500' : 'bg-slate-800 border-slate-700 text-slate-300'}`}>
      {!isOnline ? (
        <>
          <WifiOff className="w-3.5 h-3.5 animate-pulse text-amber-500 shrink-0" />
          <span>You are currently offline. {offlineCount} complaints queued for automatic sync.</span>
        </>
      ) : syncing ? (
        <>
          <RefreshCw className="w-3.5 h-3.5 animate-spin text-primary shrink-0" />
          <span>Syncing {offlineCount} offline complaints to the central registry...</span>
        </>
      ) : syncedJustNow ? (
        <>
          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
          <span>Offline reports successfully synchronized! AI assessment in progress.</span>
        </>
      ) : (
        <>
          <Wifi className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
          <span>Central connection active. {offlineCount} pending offline complaints.</span>
          <button onClick={triggerSync} className="underline text-indigo-400 hover:text-indigo-300 ml-1">Sync now</button>
        </>
      )}
    </div>
  );
}
