import { useState } from 'react';
import { Bell, Shield, User, ChevronRight, Moon, Globe, Phone } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { motion } from 'framer-motion';
import PageHeader from '@/components/shared/PageHeader';

function ToggleRow({ label, desc, value, onChange }) {
  return (
    <div className="flex items-center justify-between py-3 border-b border-border/40 last:border-0">
      <div>
        <div className="text-sm font-medium">{label}</div>
        {desc && <div className="text-xs text-muted-foreground mt-0.5">{desc}</div>}
      </div>
      <button
        onClick={() => onChange(!value)}
        className={`relative w-12 h-6 rounded-full transition-colors ${value ? 'bg-primary' : 'bg-secondary'}`}
      >
        <div className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-transform ${value ? 'translate-x-7' : 'translate-x-1'}`} />
      </button>
    </div>
  );
}

function Section({ title, icon: Icon, children }) {
  return (
    <div className="bg-card rounded-2xl border border-border/60 p-5 mb-4">
      <div className="flex items-center gap-2 mb-4">
        <div className="w-8 h-8 rounded-xl bg-accent flex items-center justify-center">
          <Icon className="w-4 h-4 text-accent-foreground" />
        </div>
        <h2 className="font-semibold text-sm">{title}</h2>
      </div>
      {children}
    </div>
  );
}

export default function SettingsPage() {
  const [notifs, setNotifs] = useState({
    email: true, whatsapp: false, sms: false,
    complaint_updates: true, upvote_milestones: true, forum_alerts: true, weekly_digest: false,
  });
  const [profile, setProfile] = useState({ display_name: '', district: '', state: '' });
  const [saved, setSaved] = useState(false);

  const updateNotif = (key) => (val) => setNotifs(p => ({ ...p, [key]: val }));

  const handleSave = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div className="max-w-lg mx-auto px-4 sm:px-6 py-6">
      <PageHeader title="Settings" subtitle="Manage your preferences and notifications" />

      {/* Profile */}
      <Section title="Profile Information" icon={User}>
        <div className="space-y-3">
          <div>
            <label className="block text-xs font-medium text-muted-foreground mb-1">Display Name</label>
            <Input value={profile.display_name} onChange={e => setProfile(p => ({ ...p, display_name: e.target.value }))} placeholder="Your name" />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-1">District</label>
              <Input value={profile.district} onChange={e => setProfile(p => ({ ...p, district: e.target.value }))} placeholder="District" />
            </div>
            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-1">State</label>
              <Input value={profile.state} onChange={e => setProfile(p => ({ ...p, state: e.target.value }))} placeholder="State" />
            </div>
          </div>
        </div>
      </Section>

      {/* Notification Channels */}
      <Section title="Notification Channels" icon={Bell}>
        <ToggleRow label="Email Notifications" desc="Receive updates via email" value={notifs.email} onChange={updateNotif('email')} />
        <ToggleRow label="WhatsApp Alerts" desc="High & Critical priority alerts via WhatsApp" value={notifs.whatsapp} onChange={updateNotif('whatsapp')} />
        <ToggleRow label="SMS Alerts" desc="Critical priority alerts via SMS" value={notifs.sms} onChange={updateNotif('sms')} />
      </Section>

      {/* Notification Types */}
      <Section title="What to Notify" icon={Bell}>
        <ToggleRow label="Complaint Updates" desc="When your complaint status changes" value={notifs.complaint_updates} onChange={updateNotif('complaint_updates')} />
        <ToggleRow label="Upvote Milestones" desc="When your report hits 10, 25, 50+ upvotes" value={notifs.upvote_milestones} onChange={updateNotif('upvote_milestones')} />
        <ToggleRow label="Forum Alerts" desc="When a forum is created for roads you follow" value={notifs.forum_alerts} onChange={updateNotif('forum_alerts')} />
        <ToggleRow label="Weekly Digest" desc="Weekly road health summary for your area" value={notifs.weekly_digest} onChange={updateNotif('weekly_digest')} />
      </Section>

      {/* Privacy */}
      <Section title="Privacy" icon={Shield}>
        <ToggleRow label="Anonymous Reporting" desc="Hide your name on public complaint boards" value={false} onChange={() => {}} />
        <ToggleRow label="Location Visibility" desc="Allow others to see your general area" value={true} onChange={() => {}} />
        <ToggleRow label="Show on Leaderboard" desc="Appear on the community points leaderboard" value={true} onChange={() => {}} />
      </Section>

      <div className="flex gap-3">
        <Button className="flex-1 gradient-primary border-0 text-white" onClick={handleSave}>
          {saved ? '✓ Saved!' : 'Save Changes'}
        </Button>
        <Button variant="outline" className="flex-1">Cancel</Button>
      </div>
    </div>
  );
}