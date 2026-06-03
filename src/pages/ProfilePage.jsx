import { useState, useEffect, useRef } from 'react';
import { 
  Shield, Award, MapPin, Star, Edit2, CheckCircle, AlertCircle, 
  MessageSquare, Settings, Camera, AlertTriangle, Activity,
  TrendingUp, Clock, ChevronRight, Plus, Map, Zap, Check, Lock, ChevronDown, LogOut
} from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/lib/AuthContext';
import { profileService } from '@/services/profileService';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { motion, AnimatePresence } from 'framer-motion';
import { SeverityBadge, StatusBadge } from '@/components/shared/HealthBadge';
import { formatDistanceToNow } from 'date-fns';

const LEVEL_CONFIG = {
  'Road Scout': { color: 'from-gray-400 to-gray-500', badge: '🔍', points: 500 },
  'Road Reporter': { color: 'from-blue-400 to-blue-600', badge: '📋', points: 2000 },
  'Road Guardian': { color: 'from-purple-400 to-purple-600', badge: '🛡️', points: 5000 },
  'Road Inspector': { color: 'from-orange-400 to-orange-600', badge: '🔎', points: 15000 },
  'Road Champion': { color: 'from-yellow-400 to-yellow-600', badge: '🏆', points: null },
};

const LEVELS = ['Road Scout', 'Road Reporter', 'Road Guardian', 'Road Champion'];

const authorityDashboards = [
  { label: 'Junior Officer', href: '/authority/junior-officer', level: 2, icon: '🔍', desc: 'Local area officer. Assigns inspect status and updates repair reports.' },
  { label: 'Road Inspector', href: '/authority/road-inspector', level: 3, icon: '🗺️', desc: 'Inspects reported areas on-site. Verifies potholes and coordinates.' },
  { label: 'Executive Engineer', href: '/authority/executive-engineer', level: 4, icon: '🔧', desc: 'Supervises road repairs, contractor work allocations, and budget clearances.' },
  { label: 'District Authority', href: '/authority/district', level: 5, icon: '🏛️', desc: 'Coordinates district-wide road priorities and infrastructure allocation.' },
  { label: 'State Authority', href: '/authority/state', level: 6, icon: '🌐', desc: 'Monitors state-wide budget allocation and highway health heatmaps.' },
  { label: 'Super Admin', href: '/authority/super-admin', level: 7, icon: '⚙️', desc: 'Full system configuration, role overrides, and system auditing logs.' }
];

function LevelProgressBar({ level, points }) {
  const config = LEVEL_CONFIG[level] || LEVEL_CONFIG['Road Scout'];
  const idx = LEVELS.indexOf(level);
  const nextLevel = LEVELS[idx + 1];
  const nextConfig = nextLevel ? LEVEL_CONFIG[nextLevel] : null;
  const progress = nextConfig ? Math.min((points / nextConfig.points) * 100, 100) : 100;

  return (
    <div className="mb-3">
      <div className="flex justify-between text-xs mb-1.5">
        <span className="font-semibold text-white/90">{level}</span>
        {nextLevel && <span className="text-white/70">Next: {nextLevel} ({nextConfig.points.toLocaleString()} pts)</span>}
      </div>
      <div className="h-2 bg-white/20 rounded-full overflow-hidden">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${progress}%` }}
          transition={{ duration: 1, ease: 'easeOut' }}
          className="h-full rounded-full bg-white"
        />
      </div>
      <div className="text-right text-xs text-white/80 mt-1">{points?.toLocaleString() || 0} pts</div>
    </div>
  );
}

const maskValue = (val, type) => {
  if (!val) return '***';
  if (type === 'password') {
    return '*'.repeat(val.length);
  }
  if (type === 'email') {
    const parts = val.split('@');
    const local = parts[0];
    const domain = parts[1] || '';
    const visibleLocal = local.slice(0, 3);
    const maskedLocal = visibleLocal + '*'.repeat(Math.max(0, local.length - 3));
    return domain ? `${maskedLocal}@${domain}` : maskedLocal;
  }
  const visible = val.slice(0, 3);
  const masked = visible + '*'.repeat(Math.max(0, val.length - 3));
  return masked;
};

export default function ProfilePage() {
  const navigate = useNavigate();
  const { isAuthenticated, user, logout } = useAuth();
  
  // Profile State
  const [profile, setProfile] = useState(null);
  const [editingProfile, setEditingProfile] = useState(false);
  const [editForm, setEditForm] = useState({ display_name: '', district: '', state: '' });
  
  const [editingCredentials, setEditingCredentials] = useState(false);
  const [credForm, setCredForm] = useState({
    display_name: '',
    email: '',
    phone: '',
    password: '',
    new_password: '',
    confirm_new_password: '',
  });
  const [credError, setCredError] = useState('');
  const [credSuccess, setCredSuccess] = useState('');
  
  // Dashboard State
  const [complaints, setComplaints] = useState([]);
  const [posts, setPosts] = useState([]);
  const [activeTab, setActiveTab] = useState('complaints');
  const [visibleComplaintsCount, setVisibleComplaintsCount] = useState(5);
  const [visiblePostsCount, setVisiblePostsCount] = useState(5);
  const [loading, setLoading] = useState(true);
  const [uploadingPic, setUploadingPic] = useState(false);

  // Delete Data State
  const [deletingAccount, setDeletingAccount] = useState(false);
  const [deleteForm, setDeleteForm] = useState({ email: '', password: '', phone: '', confirm: '' });

  const fileInputRef = useRef(null);

  const loadData = async () => {
    if (!isAuthenticated) {
      setLoading(false);
      return;
    }
    
    try {
      setLoading(true);
      const activeProf = await profileService.getProfile();
      setProfile(activeProf);
      setEditForm({
        display_name: activeProf.display_name || '',
        district: activeProf.district || '',
        state: activeProf.state || '',
      });

      const comps = await base44.entities.Complaint.list('-created_date', 100);
      setComplaints(comps.filter(c => c.reporter_id === user?.id));
      const allPosts = await base44.entities.ForumPost.list('-created_date', 100);
      setPosts(allPosts.filter(p => p.author_id === user?.id));
    } catch (e) {
      console.error('Failed to load profile/dashboard data:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    window.addEventListener('storage', loadData);
    return () => window.removeEventListener('storage', loadData);
  }, [isAuthenticated]);

  const handleProfileImageClick = () => {
    fileInputRef.current?.click();
  };

  const handleImageChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate type and size (limit to 2MB for localStorage)
    if (!file.type.startsWith('image/')) {
      alert('Please upload an image file.');
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      alert('Image must be under 2MB.');
      return;
    }

    try {
      setUploadingPic(true);
      const updated = await profileService.uploadProfilePicture(file);
      setProfile(updated);
    } catch (err) {
      console.error('Upload photo failed:', err);
      alert('Failed to upload profile picture.');
    } finally {
      setUploadingPic(false);
    }
  };

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    if (!editForm.display_name.trim()) return;
    try {
      const updated = await profileService.updateProfile({
        display_name: editForm.display_name.trim(),
        district: editForm.district.trim(),
        state: editForm.state.trim()
      });
      setProfile(updated);
      setEditingProfile(false);
    } catch (err) {
      console.error('Update profile details failed:', err);
    }
  };

  const handleUpdateCredentials = async (e) => {
    e.preventDefault();
    setCredError('');
    setCredSuccess('');

    const actualPassword = localStorage.getItem('rw_user_password') || 'demo1234';
    if (credForm.password !== actualPassword) {
      setCredError('Incorrect current password.');
      return;
    }

    if (credForm.new_password && credForm.new_password !== credForm.confirm_new_password) {
      setCredError('New passwords do not match.');
      return;
    }

    try {
      const activeUser = JSON.parse(localStorage.getItem('rw_current_user')) || {};
      
      const updatedUser = {
        ...activeUser,
        email: credForm.email.trim(),
        name: credForm.display_name.trim(),
      };
      
      if (credForm.new_password) {
        updatedUser.password = credForm.new_password;
        localStorage.setItem('rw_user_password', credForm.new_password);
      }
      
      localStorage.setItem('rw_current_user', JSON.stringify(updatedUser));

      const profileUpdates = {
        display_name: credForm.display_name.trim(),
        email: credForm.email.trim(),
        phone: credForm.phone.trim(),
      };
      const updatedProfile = await profileService.updateProfile(profileUpdates);
      setProfile(updatedProfile);

      try {
        const uId = activeUser.id;
        if (uId && !uId.startsWith('user_')) {
          await fetch(`http://localhost:8787/api/users/${uId}`, {
            method: 'PATCH',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${localStorage.getItem('mock_auth_token')}`
            },
            body: JSON.stringify({
              name: credForm.display_name.trim(),
              email: credForm.email.trim(),
              phone: credForm.phone.trim(),
              ...(credForm.new_password ? { password: credForm.new_password } : {})
            })
          });
        }
      } catch (err) {
        console.warn("Backend sync failed:", err);
      }

      setCredSuccess('Credentials updated successfully!');
      setEditingCredentials(false);
    } catch (err) {
      setCredError('Failed to update credentials.');
      console.error(err);
    }
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-8 animate-pulse space-y-6 mt-16">
        <div className="h-8 bg-muted rounded w-1/4"></div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="h-96 bg-muted rounded-2xl"></div>
          <div className="lg:col-span-2 h-96 bg-muted rounded-2xl"></div>
        </div>
      </div>
    );
  }

  // --- GUEST STATE RENDERING ---
  if (!isAuthenticated) {
    return (
      <div className="min-h-[80vh] flex items-center justify-center px-4 py-12 mt-8">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-md w-full bg-card border border-border/80 rounded-3xl p-8 shadow-xl text-center space-y-6"
        >
          <div className="w-16 h-16 rounded-2xl gradient-primary flex items-center justify-center mx-auto shadow-md">
            <Shield className="w-8 h-8 text-white" />
          </div>
          <div className="space-y-2">
            <h1 className="text-2xl font-bold font-sora text-foreground">Citizen Hub</h1>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Track your reports, earn reputation points, validate local potholes, and participate in direct governance discussions.
            </p>
          </div>

          <div className="bg-secondary/40 rounded-2xl p-4 text-xs text-muted-foreground text-left space-y-2 border border-border/40">
            <div className="flex items-center gap-2 font-medium text-foreground">
              <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
              <span>Features available for members:</span>
            </div>
            <ul className="list-disc pl-4 space-y-1">
              <li>File AI-camera verified road complaints</li>
              <li>Track assignees and repair logs in real time</li>
              <li>Upvote community topics & raise municipal awareness</li>
              <li>Access official authority tools hierarchy</li>
            </ul>
          </div>

          <div className="grid grid-cols-2 gap-3 pt-2">
            <Link to="/login">
              <Button className="w-full gradient-primary border-0 text-white font-semibold shadow-md">
                Log In
              </Button>
            </Link>
            <Link to="/register">
              <Button variant="outline" className="w-full border-border/60 hover:bg-secondary font-semibold">
                Sign Up
              </Button>
            </Link>
          </div>
        </motion.div>
      </div>
    );
  }

  // --- LOGGED-IN STATE CALCULATIONS ---
  const resolved = complaints.filter(c => c.status === 'Resolved').length;
  const critical = complaints.filter(c => c.severity === 'Critical').length;
  const inProgress = complaints.filter(c => c.status === 'In Progress' || c.status === 'Assigned').length;
  const resolutionRate = complaints.length > 0 ? Math.round((resolved / complaints.length) * 100) : 0;

  const recentComplaints = complaints.slice(0, visibleComplaintsCount);
  const recentPosts = posts.slice(0, visiblePostsCount);
  const criticalComplaints = complaints.filter(c => c.severity === 'Critical').slice(0, 3);
  const levelIdx = LEVELS.indexOf(profile?.level || 'Road Scout');
  const levelConfig = LEVEL_CONFIG[profile?.level] || LEVEL_CONFIG['Road Scout'];
  const hierarchyLevels = profileService.getLevelHierarchy();

  const handleDeleteData = (e) => {
    e.preventDefault();
    if (deleteForm.confirm !== `Delete_${profile?.display_name}`) {
      alert(`Please type exactly: Delete_${profile?.display_name}`);
      return;
    }
    // Delete data logic
    localStorage.removeItem('rw_current_user');
    localStorage.removeItem('rw_user_password');
    localStorage.removeItem('rw_profile');
    logout(true);
  };

  return (
    <div className="max-w-[1500px] mx-auto px-4 sm:px-6 py-8 mt-16 space-y-6">
      
      {/* Title Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold font-sora tracking-tight">Citizen Dashboard</h1>
          <p className="text-sm text-muted-foreground">Manage your credentials, reputation levels, and track road repair statuses.</p>
        </div>
        <div className="flex gap-2">
          <Link to="/report">
            <Button size="sm" className="gradient-primary border-0 text-white gap-2 font-semibold shadow-md">
              <Plus className="w-4 h-4" /> Report New Issue
            </Button>
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[330px_minmax(0,1fr)] xl:grid-cols-[360px_minmax(0,1fr)] gap-5 xl:gap-6 items-start">
        
        {/* ================= LEFT COLUMN ================= */}
        <div className="space-y-5 xl:space-y-6 min-w-0">
          
          {/* Profile Card */}
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}>
            <div className={`relative bg-gradient-to-br ${levelConfig.color} rounded-3xl p-6 text-white overflow-hidden shadow-lg`}>
              <div className="absolute top-4 right-4 text-7xl opacity-15 select-none pointer-events-none">
                {levelConfig.badge}
              </div>

              <div className="relative z-10 space-y-4">
                <div className="flex items-center gap-4">
                  {/* Photo Upload Container */}
                  <div 
                    onClick={handleProfileImageClick}
                    className="relative w-16 h-16 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center text-3xl cursor-pointer group overflow-hidden border border-white/30"
                  >
                    {profile?.profile_image_url ? (
                      <img 
                        src={profile.profile_image_url} 
                        alt="Profile Picture" 
                        className="w-full h-full object-cover transition-opacity group-hover:opacity-60" 
                      />
                    ) : (
                      <span className="group-hover:opacity-40">{levelConfig.badge}</span>
                    )}
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                      <Camera className="w-4 h-4 text-white" />
                    </div>
                    {uploadingPic && (
                      <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      </div>
                    )}
                  </div>
                  <input 
                    type="file" 
                    ref={fileInputRef} 
                    onChange={handleImageChange} 
                    className="hidden" 
                    accept="image/*" 
                  />

                  {/* Profile Info */}
                  <div className="flex-1 min-w-0">
                    {editingProfile ? (
                      <form onSubmit={handleUpdateProfile} className="space-y-2 mt-1">
                        <input
                          type="text"
                          value={editForm.display_name}
                          onChange={e => setEditForm({ ...editForm, display_name: e.target.value })}
                          className="bg-white/25 text-white placeholder-white/60 text-sm font-semibold rounded px-2 py-1 w-full border border-white/10 focus:outline-none focus:ring-1 focus:ring-white"
                          placeholder="Your Name"
                          maxLength={30}
                          required
                        />
                        <div className="flex gap-1.5">
                          <input
                            type="text"
                            value={editForm.district}
                            onChange={e => setEditForm({ ...editForm, district: e.target.value })}
                            className="bg-white/20 text-white text-xs rounded px-2 py-0.5 w-1/2 focus:outline-none"
                            placeholder="District"
                          />
                          <input
                            type="text"
                            value={editForm.state}
                            onChange={e => setEditForm({ ...editForm, state: e.target.value })}
                            className="bg-white/20 text-white text-xs rounded px-2 py-0.5 w-1/2 focus:outline-none"
                            placeholder="State"
                          />
                        </div>
                        <div className="flex gap-1.5 pt-1">
                          <Button size="xs" variant="secondary" type="submit" className="text-[10px] h-6 py-0.5 px-2 font-bold bg-white text-primary">Save</Button>
                          <Button size="xs" variant="ghost" type="button" onClick={() => setEditingProfile(false)} className="text-[10px] h-6 py-0.5 px-2 text-white hover:bg-white/10">Cancel</Button>
                        </div>
                      </form>
                    ) : (
                      <div>
                        <div className="flex items-center gap-1.5">
                          <h2 className="text-lg font-bold font-sora truncate">{profile?.display_name || 'Citizen'}</h2>
                          <button 
                            onClick={() => setEditingProfile(true)}
                            className="p-1 rounded hover:bg-white/20 transition-colors shrink-0"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                        <div className="text-white/80 text-xs font-semibold px-2 py-0.5 bg-white/20 rounded-full inline-block mt-0.5">
                          {profile?.level || 'Road Scout'}
                        </div>
                        {profile?.district && (
                          <div className="flex items-center gap-1 text-white/70 text-xs mt-1">
                            <MapPin className="w-3 h-3" />
                            {profile.district}, {profile.state}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                {/* Score Summary */}
                <div className="bg-white/20 rounded-2xl p-4 flex justify-between items-center">
                  <div>
                    <div className="text-2xl font-bold font-sora leading-none">{profile?.points?.toLocaleString() || 0}</div>
                    <div className="text-white/80 text-[10px] font-semibold mt-1">REPUTATION POINTS</div>
                  </div>
                  <div className="bg-white/20 px-3 py-1 rounded-xl text-center">
                    <div className="text-sm font-bold font-sora">{profile?.total_reports || 0}</div>
                    <div className="text-white/70 text-[9px]">REPORTS</div>
                  </div>
                </div>

                {/* Progress bar to next level */}
                <div className="bg-white/10 rounded-xl p-3">
                  <LevelProgressBar level={profile?.level} points={profile?.points} />
                </div>
              </div>
            </div>
          </motion.div>

          {/* Citizen Levels Guide */}
          <div className="bg-card rounded-2xl border border-border/60 p-5 shadow-sm space-y-4">
            <h2 className="font-semibold text-sm text-foreground flex items-center gap-2">
              <Award className="w-4 h-4 text-primary" /> Citizen Level Ranks
            </h2>
            <div className="space-y-2">
              {hierarchyLevels.map((l, i) => {
                const unlocked = i <= levelIdx;
                return (
                  <div key={l.level} className={`flex items-start gap-2.5 p-2.5 rounded-xl border border-transparent transition-colors ${unlocked ? 'bg-secondary/40 border-secondary' : 'opacity-55 bg-background/50'}`}>
                    <div className={`w-8 h-8 rounded-lg shrink-0 flex items-center justify-center bg-gradient-to-br ${LEVEL_CONFIG[l.level]?.color || 'from-gray-300 to-gray-400'} text-white text-sm`}>
                      {l.badge}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-1.5">
                        <span className="text-xs font-semibold text-foreground truncate">{l.level}</span>
                        {i === levelIdx && (
                          <span className="text-[9px] font-bold text-primary px-1.5 py-0.5 bg-accent rounded-full shrink-0">Active</span>
                        )}
                        {!unlocked && (
                          <span className="text-[9px] text-muted-foreground shrink-0">{l.points.toLocaleString()} pts</span>
                        )}
                      </div>
                      <p className="text-[10px] text-muted-foreground leading-tight mt-0.5 line-clamp-2">{l.description}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Quick Links */}
          <div className="bg-card rounded-2xl border border-border/60 p-5 shadow-sm space-y-3">
            <h2 className="font-semibold text-sm">Dashboard Links</h2>
            <div className="grid grid-cols-2 gap-2">
              <Link to="/map">
                <Button variant="outline" className="w-full text-xs font-semibold justify-start gap-1.5 border-border/60">
                  <Map className="w-3.5 h-3.5 text-green-600" />
                  Live Map
                </Button>
              </Link>
              <Link to="/governance">
                <Button variant="outline" className="w-full text-xs font-semibold justify-start gap-1.5 border-border/60">
                  <MessageSquare className="w-3.5 h-3.5 text-pink-600" />
                  Community
                </Button>
              </Link>
              <Link to="/ai-assistant">
                <Button variant="outline" className="w-full text-xs font-semibold justify-start gap-1.5 border-border/60">
                  <Zap className="w-3.5 h-3.5 text-purple-600 animate-pulse" />
                  AI Assistant
                </Button>
              </Link>
              <Link to="/settings">
                <Button variant="outline" className="w-full text-xs font-semibold justify-start gap-1.5 border-border/60">
                  <Settings className="w-3.5 h-3.5 text-gray-600" />
                  Settings
                </Button>
              </Link>
            </div>
          </div>

          {/* Account Credentials Card */}
          <div className="bg-card rounded-2xl border border-border/60 p-5 shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-border/40 pb-2">
              <h2 className="font-semibold text-sm flex items-center gap-2">
                <Lock className="w-4 h-4 text-primary" /> Account Credentials
              </h2>
              <button 
                onClick={() => {
                  setEditingCredentials(!editingCredentials);
                  setCredForm({
                    display_name: profile?.display_name || '',
                    email: profile?.email || '',
                    phone: profile?.phone || '',
                    password: '',
                    new_password: '',
                    confirm_new_password: '',
                  });
                  setCredError('');
                  setCredSuccess('');
                }}
                className="text-xs text-primary hover:underline font-semibold"
              >
                {editingCredentials ? 'Cancel' : 'Edit'}
              </button>
            </div>

            {credError && (
              <div className="p-2.5 rounded-xl bg-destructive/10 text-destructive text-xs border border-destructive/20">
                {credError}
              </div>
            )}
            {credSuccess && (
              <div className="p-2.5 rounded-xl bg-green-500/10 text-green-600 text-xs border border-green-500/20">
                {credSuccess}
              </div>
            )}

            {!editingCredentials ? (
              <div className="space-y-3 text-xs">
                <div className="flex justify-between items-center py-1 border-b border-border/30">
                  <span className="text-muted-foreground font-medium">Display Name</span>
                  <span className="font-semibold text-foreground">{maskValue(profile?.display_name, 'name')}</span>
                </div>
                <div className="flex justify-between items-center py-1 border-b border-border/30">
                  <span className="text-muted-foreground font-medium">Email (Gmail)</span>
                  <span className="font-semibold text-foreground">{maskValue(profile?.email || user?.email, 'email')}</span>
                </div>
                <div className="flex justify-between items-center py-1 border-b border-border/30">
                  <span className="text-muted-foreground font-medium">Phone Number</span>
                  <span className="font-semibold text-foreground">
                    {profile?.phone ? maskValue(profile?.phone, 'phone') : 'Not Set'}
                  </span>
                </div>
                <div className="flex justify-between items-center py-1">
                  <span className="text-muted-foreground font-medium">Password</span>
                  <span className="font-semibold text-foreground">
                    {maskValue(localStorage.getItem('rw_user_password') || 'demo1234', 'password')}
                  </span>
                </div>
              </div>
            ) : (
              <form onSubmit={handleUpdateCredentials} className="space-y-3 text-xs">
                <div className="space-y-1">
                  <label className="text-muted-foreground font-semibold">Display Name</label>
                  <Input 
                    type="text" 
                    value={credForm.display_name} 
                    onChange={e => setCredForm({ ...credForm, display_name: e.target.value })} 
                    className="h-8 text-xs rounded-xl"
                    required
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-muted-foreground font-semibold">Email (Gmail)</label>
                  <Input 
                    type="email" 
                    value={credForm.email} 
                    onChange={e => setCredForm({ ...credForm, email: e.target.value })} 
                    className="h-8 text-xs rounded-xl"
                    required
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-muted-foreground font-semibold">Mobile Number</label>
                  <Input 
                    type="text" 
                    value={credForm.phone} 
                    onChange={e => setCredForm({ ...credForm, phone: e.target.value })} 
                    placeholder="Enter phone number"
                    className="h-8 text-xs rounded-xl"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-muted-foreground font-semibold">New Password (optional)</label>
                  <Input 
                    type="password" 
                    value={credForm.new_password} 
                    onChange={e => setCredForm({ ...credForm, new_password: e.target.value })} 
                    placeholder="Leave blank to keep current"
                    className="h-8 text-xs rounded-xl"
                  />
                </div>
                {credForm.new_password && (
                  <div className="space-y-1">
                    <label className="text-muted-foreground font-semibold">Confirm New Password</label>
                    <Input 
                      type="password" 
                      value={credForm.confirm_new_password} 
                      onChange={e => setCredForm({ ...credForm, confirm_new_password: e.target.value })} 
                      className="h-8 text-xs rounded-xl"
                      required
                    />
                  </div>
                )}
                <div className="space-y-1 border-t border-border/40 pt-2">
                  <label className="text-red-500 font-bold">Current Password *</label>
                  <Input 
                    type="password" 
                    value={credForm.password} 
                    onChange={e => setCredForm({ ...credForm, password: e.target.value })} 
                    placeholder="Verify current password"
                    className="h-8 text-xs rounded-xl border-red-200 focus:border-red-500"
                    required
                  />
                </div>
                <Button type="submit" size="sm" className="w-full gradient-primary border-0 text-white font-semibold shadow-md mt-2">
                  Save Credentials
                </Button>
              </form>
            )}
          </div>

          {/* Danger Zone */}
          <div className="bg-card rounded-2xl border border-red-200 p-5 shadow-sm space-y-4">
            <h2 className="font-semibold text-sm flex items-center gap-2 text-red-600">
              <AlertTriangle className="w-4 h-4" /> Danger Zone
            </h2>
            
            <div className="space-y-3">
              <Button 
                variant="outline" 
                className="w-full justify-start gap-2 text-sm text-foreground hover:bg-secondary border-border/60"
                onClick={() => logout(true)}
              >
                <LogOut className="w-4 h-4 text-muted-foreground" />
                Logout
              </Button>
              
              {!deletingAccount ? (
                <Button 
                  variant="outline" 
                  className="w-full justify-start gap-2 text-sm text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200"
                  onClick={() => setDeletingAccount(true)}
                >
                  <AlertCircle className="w-4 h-4" />
                  Request Data Deletion
                </Button>
              ) : (
                <form onSubmit={handleDeleteData} className="space-y-3 pt-3 border-t border-red-100 text-xs mt-2">
                  <p className="text-[11px] text-red-600 font-semibold mb-2 leading-tight">
                    To permanently delete your account and all associated data, please verify your details.
                  </p>
                  <div className="space-y-1">
                    <label className="text-muted-foreground">Email</label>
                    <Input 
                      type="email" required
                      value={deleteForm.email}
                      onChange={e => setDeleteForm({ ...deleteForm, email: e.target.value })}
                      className="h-8 text-xs rounded-xl"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-muted-foreground">Password</label>
                    <Input 
                      type="password" required
                      value={deleteForm.password}
                      onChange={e => setDeleteForm({ ...deleteForm, password: e.target.value })}
                      className="h-8 text-xs rounded-xl"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-muted-foreground">Mobile Number</label>
                    <Input 
                      type="text" required
                      value={deleteForm.phone}
                      onChange={e => setDeleteForm({ ...deleteForm, phone: e.target.value })}
                      className="h-8 text-xs rounded-xl"
                    />
                  </div>
                  <div className="space-y-1 mt-2">
                    <label className="text-red-600 font-bold">Type "Delete_{profile?.display_name}"</label>
                    <Input 
                      type="text" required
                      value={deleteForm.confirm}
                      onChange={e => setDeleteForm({ ...deleteForm, confirm: e.target.value })}
                      className="h-8 text-xs rounded-xl border-red-200 focus:border-red-500"
                      placeholder={`Delete_${profile?.display_name}`}
                    />
                  </div>
                  <div className="flex gap-2 pt-2">
                    <Button type="button" variant="ghost" onClick={() => setDeletingAccount(false)} className="flex-1 h-8 text-xs hover:bg-secondary">
                      Cancel
                    </Button>
                    <Button type="submit" className="flex-1 h-8 text-xs bg-red-600 hover:bg-red-700 text-white border-0">
                      Confirm Delete
                    </Button>
                  </div>
                </form>
              )}
            </div>
          </div>

        </div>

        {/* ================= RIGHT COLUMN (Dashboard Widgets) ================= */}
        <div className="space-y-5 xl:space-y-6 min-w-0">
          
          {/* Dynamic Stats Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              { label: 'Total Filings', value: complaints.length.toString(), icon: AlertCircle, color: 'text-blue-500 bg-blue-50 border-blue-100' },
              { label: 'Resolved Case', value: resolved.toString(), icon: CheckCircle, color: 'text-green-500 bg-green-50 border-green-100' },
              { label: 'Critical Alert', value: critical.toString(), icon: AlertTriangle, color: 'text-red-500 bg-red-50 border-red-100 animate-pulse' },
              { label: 'Resolve Rate', value: `${resolutionRate}%`, icon: TrendingUp, color: 'text-purple-500 bg-purple-50 border-purple-100' }
            ].map((stat, i) => (
              <div key={i} className={`p-4 bg-card rounded-2xl border ${stat.color.split(' ')[2]} flex flex-col justify-between h-28 shadow-sm`}>
                <div className="flex justify-between items-center">
                  <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">{stat.label}</span>
                  <div className={`w-7 h-7 rounded-lg flex items-center justify-center ${stat.color.split(' ')[1]}`}>
                    <stat.icon className={`w-4 h-4 ${stat.color.split(' ')[0]}`} />
                  </div>
                </div>
                <div className="text-2xl font-bold font-sora tracking-tight mt-2">{stat.value}</div>
              </div>
            ))}
          </div>

          {/* Quick Actions Shortcuts */}
          <div className="bg-card rounded-2xl border border-border/60 p-5 shadow-sm space-y-4">
            <h2 className="font-semibold text-sm">Dashboard Quick Actions</h2>
            <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
              <Link to="/complaints" className="flex flex-col items-center p-3 bg-secondary/30 rounded-xl hover:bg-secondary/50 border border-secondary transition-colors">
                <AlertCircle className="w-5 h-5 text-blue-500 mb-1" />
                <span className="text-[10px] font-semibold">Reports</span>
              </Link>
              <Link to="/map" className="flex flex-col items-center p-3 bg-secondary/30 rounded-xl hover:bg-secondary/50 border border-secondary transition-colors">
                <Map className="w-5 h-5 text-green-500 mb-1" />
                <span className="text-[10px] font-semibold">Live Map</span>
              </Link>
              <Link to="/ai-assistant" className="flex flex-col items-center p-3 bg-secondary/30 rounded-xl hover:bg-secondary/50 border border-secondary transition-colors">
                <Zap className="w-5 h-5 text-purple-500 mb-1" />
                <span className="text-[10px] font-semibold">AI Help</span>
              </Link>
              <Link to="/governance" className="flex flex-col items-center p-3 bg-secondary/30 rounded-xl hover:bg-secondary/50 border border-secondary transition-colors">
                <MessageSquare className="w-5 h-5 text-pink-500 mb-1" />
                <span className="text-[10px] font-semibold">Community</span>
              </Link>
              <Link to="/contractors" className="flex flex-col items-center p-3 bg-secondary/30 rounded-xl hover:bg-secondary/50 border border-secondary transition-colors">
                <Award className="w-5 h-5 text-orange-500 mb-1" />
                <span className="text-[10px] font-semibold">Contractors</span>
              </Link>
              <Link to="/analytics" className="flex flex-col items-center p-3 bg-secondary/30 rounded-xl hover:bg-secondary/50 border border-secondary transition-colors">
                <Activity className="w-5 h-5 text-indigo-500 mb-1" />
                <span className="text-[10px] font-semibold">Analytics</span>
              </Link>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_230px] xl:grid-cols-[minmax(0,1fr)_260px] gap-5 xl:gap-6 items-start">
            
            {/* My Complaints and My Posts (col-span-2) */}
            <div className="bg-card rounded-2xl border border-border/60 p-5 shadow-sm space-y-4 min-w-0">
              <div className="flex items-center justify-between border-b border-border/40 pb-3">
                <div className="flex gap-4">
                  <button 
                    onClick={() => setActiveTab('complaints')}
                    className={`text-sm font-semibold flex items-center gap-2 pb-1 ${activeTab === 'complaints' ? 'text-primary border-b-2 border-primary' : 'text-muted-foreground'}`}
                  >
                    <Activity className="w-4 h-4" /> My Complaints
                  </button>
                  <button 
                    onClick={() => setActiveTab('posts')}
                    className={`text-sm font-semibold flex items-center gap-2 pb-1 ${activeTab === 'posts' ? 'text-primary border-b-2 border-primary' : 'text-muted-foreground'}`}
                  >
                    <MessageSquare className="w-4 h-4" /> My Posts
                  </button>
                </div>
                <Link to={activeTab === 'complaints' ? '/complaints' : '/forums'} className="text-xs text-primary hover:underline font-semibold">View all</Link>
              </div>

              <div className="space-y-2 max-h-[400px] overflow-y-auto pr-1">
                {activeTab === 'complaints' && recentComplaints.map(c => (
                  <div key={c.id} className="flex items-start justify-between p-3 bg-secondary/20 hover:bg-secondary/40 border border-border/40 rounded-xl transition-all">
                    <div className="min-w-0 pr-2 flex-1">
                      <div className="text-sm font-semibold truncate text-foreground">{c.title}</div>
                      <Link 
                        to="/map"
                        state={{ targetLocation: { lat: c.latitude, lng: c.longitude } }}
                        className="text-[11px] text-muted-foreground hover:text-primary hover:underline flex items-center gap-1 mt-1 transition-colors"
                      >
                        <MapPin className="w-3.5 h-3.5 text-muted-foreground/60 shrink-0" />
                        <span className="truncate">{c.location_text || c.district}</span>
                      </Link>
                      <div className="flex items-center gap-3 mt-2 text-[10px] font-medium">
                        <span className="flex items-center gap-1 text-green-600 bg-green-50 px-1.5 py-0.5 rounded border border-green-100">
                          <TrendingUp className="w-3 h-3" /> {c.upvotes || 0} Upvotes
                        </span>
                        <span className="flex items-center gap-1 text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded border border-blue-100">
                          <CheckCircle className="w-3 h-3" /> {c.verified_count || 0} Verified
                        </span>
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-1.5 shrink-0">
                      <StatusBadge status={c.status} />
                      <SeverityBadge severity={c.severity} />
                      <Link to={`/complaints/${c.id}`} className="text-[10px] text-primary font-bold hover:underline flex items-center mt-1">
                        Details <ChevronRight className="w-3 h-3" />
                      </Link>
                    </div>
                  </div>
                ))}

                {activeTab === 'complaints' && recentComplaints.length < complaints.length && (
                  <div className="text-center pt-2">
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="text-xs"
                      onClick={() => setVisibleComplaintsCount(v => v + 5)}
                    >
                      Load More
                    </Button>
                  </div>
                )}

                {activeTab === 'complaints' && recentComplaints.length === 0 && (
                  <div className="text-center py-8 text-xs text-muted-foreground space-y-2">
                    <AlertCircle className="w-6 h-6 mx-auto opacity-30" />
                    <p>No complaints reported yet.</p>
                  </div>
                )}

                {activeTab === 'posts' && recentPosts.map(p => (
                  <div key={p.id} className="flex items-start justify-between p-3 bg-secondary/20 hover:bg-secondary/40 border border-border/40 rounded-xl transition-all">
                    <div className="min-w-0 pr-2 flex-1">
                      <div className="text-xs font-medium text-muted-foreground mb-1">In Forum</div>
                      <div className="text-sm text-foreground line-clamp-2">{p.content}</div>
                      <div className="flex items-center gap-3 mt-2 text-[10px] font-medium">
                        <span className="flex items-center gap-1 text-purple-600 bg-purple-50 px-1.5 py-0.5 rounded border border-purple-100">
                          <TrendingUp className="w-3 h-3" /> {p.upvotes || 0} Upvotes
                        </span>
                        <span className="text-muted-foreground">{p.post_type}</span>
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-1.5 shrink-0">
                      <span className="text-[10px] text-muted-foreground">{formatDistanceToNow(new Date(p.created_date), { addSuffix: true })}</span>
                      <Link to={`/forums/${p.forum_id}`} className="text-[10px] text-primary font-bold hover:underline flex items-center mt-1">
                        View <ChevronRight className="w-3 h-3" />
                      </Link>
                    </div>
                  </div>
                ))}

                {activeTab === 'posts' && recentPosts.length < posts.length && (
                  <div className="text-center pt-2">
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="text-xs"
                      onClick={() => setVisiblePostsCount(v => v + 5)}
                    >
                      Load More
                    </Button>
                  </div>
                )}

                {activeTab === 'posts' && posts.length === 0 && (
                  <div className="text-center py-8 text-xs text-muted-foreground space-y-2">
                    <MessageSquare className="w-6 h-6 mx-auto opacity-30" />
                    <p>No forum posts yet.</p>
                  </div>
                )}
              </div>
            </div>

            {/* Critical Issues & Summary Sidebar */}
            <div className="space-y-4">
              
              {/* Critical Alert Box */}
              <div className="bg-red-50/20 border border-red-200 rounded-2xl p-4 shadow-sm space-y-3">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-red-500 animate-bounce" />
                  <span className="text-xs font-bold text-red-700">Critical Concerns</span>
                </div>
                <div className="space-y-2">
                  {criticalComplaints.map(c => (
                    <Link key={c.id} to={`/complaints/${c.id}`} className="block">
                      <div className="p-2.5 bg-white border border-red-100 hover:border-red-300 rounded-xl transition-all">
                        <div className="text-[11px] font-semibold text-foreground line-clamp-1">{c.title}</div>
                        <div className="text-[9px] text-muted-foreground mt-0.5 truncate">{c.location_text || c.district}</div>
                      </div>
                    </Link>
                  ))}
                  {criticalComplaints.length === 0 && (
                    <p className="text-[10px] text-muted-foreground">Zero critical highway concerns currently.</p>
                  )}
                </div>
              </div>

              {/* Status Overview count widget */}
              <div className="bg-card rounded-2xl border border-border/60 p-4 shadow-sm space-y-3">
                <h3 className="text-xs font-semibold">Reports Review States</h3>
                <div className="space-y-2 text-xs">
                  {[
                    { label: 'Submitted', count: complaints.filter(c => c.status === 'Submitted').length, color: 'bg-blue-500' },
                    { label: 'In Progress', count: inProgress, color: 'bg-yellow-500' },
                    { label: 'Resolved', count: resolved, color: 'bg-green-500' },
                    { label: 'Critical Alert', count: critical, color: 'bg-red-500' },
                  ].map(item => (
                    <div key={item.label} className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5">
                        <span className={`w-2 h-2 rounded-full ${item.color}`} />
                        <span className="text-muted-foreground">{item.label}</span>
                      </div>
                      <span className="font-bold">{item.count}</span>
                    </div>
                  ))}
                </div>
              </div>

            </div>

          </div>

        </div>

      </div>

      {/* ================= BOTTOM ROW (Authority Dashboard Selector) ================= */}
      <div className="border-t border-border/60 pt-4 mt-0 space-y-4">
        <div>
          <h2 className="text-lg font-bold font-sora flex items-center gap-2">
            <Shield className="w-5 h-5 text-primary" /> Authority Administrative Dashboards
          </h2>
          <p className="text-xs text-muted-foreground">Verified municipal officers and contractors can switch to specific workflow dashboards below.</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {authorityDashboards.map((role) => (
            <Link 
              key={role.level} 
              to={role.href}
              className="group p-4 bg-card hover:bg-secondary/40 border border-border/60 hover:border-primary/30 rounded-2xl transition-all shadow-sm flex gap-3.5 relative"
            >
              <div className="w-10 h-10 rounded-xl bg-secondary group-hover:bg-primary/10 flex items-center justify-center text-xl shrink-0 transition-colors">
                {role.icon}
              </div>
              <div className="space-y-1 pr-4">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-foreground group-hover:text-primary transition-colors">{role.label}</span>
                  <span className="text-[9px] font-semibold text-muted-foreground bg-secondary px-1.5 py-0.5 rounded-md">L{role.level}</span>
                </div>
                <p className="text-[10px] text-muted-foreground leading-snug">{role.desc}</p>
              </div>
              <ChevronRight className="w-4 h-4 text-muted-foreground absolute right-4 top-4 opacity-40 group-hover:opacity-100 transition-opacity" />
            </Link>
          ))}
        </div>
      </div>

    </div>
  );
}
