import Navbar from './Navbar';
import BottomNav from './BottomNav';
import { Outlet } from 'react-router-dom';
import OfflineSyncBanner from '../shared/OfflineSyncBanner';

export default function AppLayout() {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="pt-16">
        <OfflineSyncBanner />
      </div>
      <main className="pb-16 lg:pb-0">
        <Outlet />
      </main>
      <BottomNav />
    </div>
  );
}