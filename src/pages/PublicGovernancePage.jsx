import { useState, useEffect, useRef, useCallback, forwardRef } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  MessageSquare, ThumbsUp, ThumbsDown, Eye, TrendingUp, Pin,
  Star, Search, Filter, Plus, ChevronDown, MapPin, Clock,
  AlertCircle, Flame, Shield, ArrowLeft, Send, X, ChevronRight,
  Megaphone, Activity, Award, Users, RotateCcw
} from 'lucide-react';
import { formatDistanceToNow, format } from 'date-fns';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { mockRoadsForGovernance } from '@/api/base44Client';
import { communityService } from '@/services/communityService';

// ─── Constants ────────────────────────────────────────────────────────────────
const CATEGORIES = [
  { value: 'ALL', label: 'All Topics', icon: '📋' },
  { value: 'ROAD_DAMAGE', label: 'Road Damage', icon: '🕳️' },
  { value: 'REPAIR_DELAY', label: 'Repair Delay', icon: '⏳' },
  { value: 'SAFETY_CONCERN', label: 'Safety', icon: '⚠️' },
  { value: 'ACCIDENT_REPORT', label: 'Accident', icon: '🚨' },
  { value: 'FLOODING', label: 'Flooding', icon: '🌊' },
  { value: 'STREETLIGHT_FAILURE', label: 'Streetlights', icon: '💡' },
  { value: 'TRAFFIC_ISSUE', label: 'Traffic', icon: '🚦' },
  { value: 'GOVERNMENT_FEEDBACK', label: 'Feedback', icon: '🏛️' },
  { value: 'OTHER', label: 'Other', icon: '💬' },
];

const SORT_OPTIONS = [
  { value: 'score', label: 'Top Ranked' },
  { value: 'newest', label: 'Newest' },
  { value: 'upvotes', label: 'Most Upvoted' },
  { value: 'comments', label: 'Most Discussed' },
  { value: 'views', label: 'Most Viewed' },
];

const CATEGORY_COLORS = {
  ROAD_DAMAGE: 'bg-red-50 text-red-700 border-red-200 dark:bg-red-950/40 dark:text-red-300 dark:border-red-800',
  REPAIR_DELAY: 'bg-orange-50 text-orange-700 border-orange-200 dark:bg-orange-950/40 dark:text-orange-300',
  SAFETY_CONCERN: 'bg-yellow-50 text-yellow-700 border-yellow-200 dark:bg-yellow-950/40 dark:text-yellow-300',
  ACCIDENT_REPORT: 'bg-red-50 text-red-800 border-red-300 dark:bg-red-950/50 dark:text-red-200',
  FLOODING: 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/40 dark:text-blue-300',
  STREETLIGHT_FAILURE: 'bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-950/40 dark:text-purple-300',
  TRAFFIC_ISSUE: 'bg-indigo-50 text-indigo-700 border-indigo-200 dark:bg-indigo-950/40 dark:text-indigo-300',
  GOVERNMENT_FEEDBACK: 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300',
  BUDGET_CONCERN: 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300',
  CONTRACTOR_PERFORMANCE: 'bg-orange-50 text-orange-700 border-orange-200 dark:bg-orange-950/40 dark:text-orange-300',
  OTHER: 'bg-gray-50 text-gray-700 border-gray-200 dark:bg-gray-800 dark:text-gray-300',
};

const LEVEL_COLORS = {
  road_scout: 'bg-gray-100 text-gray-600',
  road_reporter: 'bg-blue-100 text-blue-700',
  road_guardian: 'bg-purple-100 text-purple-700',
  road_inspector: 'bg-orange-100 text-orange-700',
  road_champion: 'bg-yellow-100 text-yellow-700',
  junior_officer: 'bg-green-100 text-green-700',
  executive_engineer: 'bg-teal-100 text-teal-700',
  district_authority: 'bg-blue-200 text-blue-800',
  state_authority: 'bg-indigo-200 text-indigo-800',
};

const LEVEL_DISPLAY = {
  road_scout: 'Scout', road_reporter: 'Reporter', road_guardian: 'Guardian',
  road_inspector: 'Inspector', road_champion: 'Champion',
  junior_officer: 'Officer', executive_engineer: 'Engineer',
  district_authority: 'District Authority', state_authority: 'State Authority',
};

const HEALTH_COLOR = (s) => s >= 75 ? '#22c55e' : s >= 55 ? '#eab308' : s >= 35 ? '#f97316' : '#ef4444';

// ─── Skeleton ─────────────────────────────────────────────────────────────────
function PostSkeleton() {
  return (
    <div className="bg-card rounded-2xl border border-border/60 p-5 animate-pulse">
      <div className="flex gap-3">
        <div className="flex flex-col items-center gap-2 pt-1 w-10 shrink-0">
          <div className="w-8 h-8 bg-secondary rounded-lg" />
          <div className="w-6 h-4 bg-secondary rounded" />
          <div className="w-8 h-8 bg-secondary rounded-lg" />
        </div>
        <div className="flex-1 space-y-2">
          <div className="h-4 bg-secondary rounded w-3/4" />
          <div className="h-3 bg-secondary rounded w-1/2" />
          <div className="h-3 bg-secondary rounded w-full" />
          <div className="h-3 bg-secondary rounded w-5/6" />
          <div className="flex gap-2 pt-1">
            <div className="h-5 w-16 bg-secondary rounded-full" />
            <div className="h-5 w-20 bg-secondary rounded-full" />
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Authority Badge ──────────────────────────────────────────────────────────
function AuthorityBadge({ name }) {
  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-blue-600 text-white rounded-full text-xs font-semibold">
      <Shield className="w-2.5 h-2.5" /> Authority
    </span>
  );
}

// ─── Supervote Banner ─────────────────────────────────────────────────────────
function SupervoteBanner({ byName, at }) {
  return (
    <div className="flex items-center gap-2 px-3 py-2 bg-gradient-to-r from-amber-50 to-yellow-50 dark:from-amber-950/40 dark:to-yellow-950/40 border border-amber-200 dark:border-amber-700 rounded-xl mb-3 text-xs">
      <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-500 shrink-0" />
      <span className="font-semibold text-amber-800 dark:text-amber-300">Supervoted by Authority</span>
      {byName && <span className="text-amber-600 dark:text-amber-400">— {byName}</span>}
      {at && <span className="text-amber-500 ml-auto">{formatDistanceToNow(new Date(at), { addSuffix: true })}</span>}
    </div>
  );
}

// ─── Road Health Ring ─────────────────────────────────────────────────────────
function MiniHealthRing({ score }) {
  const r = 12, c = 2 * Math.PI * r;
  const dash = c * (score / 100);
  const color = HEALTH_COLOR(score);
  return (
    <svg width="32" height="32" className="-rotate-90">
      <circle cx="16" cy="16" r={r} fill="none" stroke="#e5e7eb" strokeWidth="3" />
      <circle cx="16" cy="16" r={r} fill="none" stroke={color} strokeWidth="3"
        strokeDasharray={`${dash} ${c}`} strokeLinecap="round" />
      <text x="16" y="16" textAnchor="middle" dominantBaseline="central" className="rotate-90"
        style={{ fontSize: 8, fontWeight: 700, fill: color, transform: 'rotate(90deg)', transformOrigin: '16px 16px' }}>
        {score}
      </text>
    </svg>
  );
}

// ─── Comment Thread ────────────────────────────────────────────────────────────
function CommentThread({ comments, onReply, depth = 0 }) {
  const rootComments = comments.filter(c => !c.parent_comment_id);
  const childrenOf = (id) => comments.filter(c => c.parent_comment_id === id);

  return (
    <div className="space-y-3">
      {rootComments.map(c => (
        <div key={c.id} className={`${depth > 0 ? 'ml-6 border-l-2 border-border/40 pl-3' : ''}`}>
          <div className={`rounded-xl p-3 ${c.is_authority_reply
            ? 'bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800'
            : 'bg-secondary/40'}`}>
            <div className="flex items-center gap-2 mb-1.5 flex-wrap">
              <span className="font-semibold text-sm">{c.author_name}</span>
              {c.is_authority_reply && <AuthorityBadge />}
              <span className={`text-xs px-2 py-0.5 rounded-full ${LEVEL_COLORS[c.author_level] || 'bg-gray-100 text-gray-600'}`}>
                {LEVEL_DISPLAY[c.author_level] || c.author_level}
              </span>
              <span className="text-xs text-muted-foreground ml-auto">
                {formatDistanceToNow(new Date(c.created_at), { addSuffix: true })}
              </span>
            </div>
            <p className="text-sm text-foreground/90 leading-relaxed">{c.content}</p>
            <div className="flex items-center gap-3 mt-2">
              <button className="flex items-center gap-1 text-xs text-muted-foreground hover:text-primary transition-colors">
                <ThumbsUp className="w-3 h-3" /> {c.upvote_count}
              </button>
              {depth < 2 && (
                <button onClick={() => onReply(c.id, c.author_name)}
                  className="text-xs text-muted-foreground hover:text-primary transition-colors">
                  Reply
                </button>
              )}
            </div>
          </div>
          {childrenOf(c.id).length > 0 && (
            <CommentThread comments={childrenOf(c.id)} onReply={onReply} depth={depth + 1} />
          )}
        </div>
      ))}
    </div>
  );
}

// ─── Post Detail Modal ────────────────────────────────────────────────────────
function PostDetailModal({ post, onClose, onVote }) {
  const [comments, setComments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [commentText, setCommentText] = useState('');
  const [replyTo, setReplyTo] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const textareaRef = useRef(null);

  useEffect(() => {
    communityService.getComments(post.id).then(data => { setComments(data); setLoading(false); });
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = ''; };
  }, [post.id]);

  const handleReply = (parentId, authorName) => {
    setReplyTo({ id: parentId, name: authorName });
    setCommentText(`@${authorName} `);
    setTimeout(() => textareaRef.current?.focus(), 100);
  };

  const handleSubmitComment = async () => {
    if (!commentText.trim() || submitting) return;
    setSubmitting(true);
    try {
      const c = await communityService.addComment(post.id, commentText.trim(), replyTo?.id || null);
      setComments(prev => [c, ...prev]);
      setCommentText(''); setReplyTo(null);
    } finally { setSubmitting(false); }
  };

  const catInfo = CATEGORIES.find(c => c.value === post.subject_category) || CATEGORIES[0];

  return (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/50 backdrop-blur-sm"
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <motion.div
        initial={{ y: '100%', opacity: 0 }} animate={{ y: 0, opacity: 1 }}
        exit={{ y: '100%', opacity: 0 }} transition={{ type: 'spring', damping: 28, stiffness: 300 }}
        className="bg-card w-full sm:max-w-2xl rounded-t-3xl sm:rounded-2xl max-h-[92vh] flex flex-col overflow-hidden shadow-2xl">
        {/* Header */}
        <div className="flex items-start justify-between p-5 border-b border-border/60 gap-3">
          <div className="flex-1 min-w-0">
            {post.is_pinned && (
              <div className="flex items-center gap-1 text-xs text-primary font-semibold mb-1">
                <Pin className="w-3 h-3" /> Pinned
              </div>
            )}
            <h2 className="font-bold text-base font-sora leading-snug">{post.title}</h2>
            <div className="flex items-center gap-2 mt-1.5 flex-wrap">
              <Link to={`/road/${post.road_id}`}
                className="flex items-center gap-1 text-xs text-primary hover:underline">
                <MapPin className="w-3 h-3" /> {post.road_name}
              </Link>
              <span className={`px-2 py-0.5 rounded-full text-xs border ${CATEGORY_COLORS[post.subject_category]}`}>
                {catInfo.icon} {catInfo.label}
              </span>
            </div>
          </div>
          <button onClick={onClose}
            className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center hover:bg-muted transition-colors shrink-0">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Scrollable body */}
        <div className="overflow-y-auto flex-1 p-5 space-y-5">
          {post.is_supervoted && <SupervoteBanner byName={post.supervoted_by_name} at={post.supervoted_at} />}

          {/* Author + content */}
          <div>
            <div className="flex items-center gap-2 mb-3 flex-wrap">
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center font-bold text-primary text-sm">
                {post.author_name?.[0]?.toUpperCase()}
              </div>
              <div>
                <span className="font-semibold text-sm">{post.author_name}</span>
                <span className={`ml-2 text-xs px-2 py-0.5 rounded-full ${LEVEL_COLORS[post.author_level] || 'bg-gray-100 text-gray-600'}`}>
                  {LEVEL_DISPLAY[post.author_level] || post.author_level}
                </span>
              </div>
              <span className="text-xs text-muted-foreground ml-auto">
                {format(new Date(post.created_at), 'dd MMM yyyy, h:mm a')}
              </span>
            </div>
            <p className="text-sm leading-relaxed text-foreground/90 whitespace-pre-line">{post.content}</p>
          </div>

          {/* Stats row */}
          <div className="flex items-center gap-4 py-3 border-y border-border/50 text-sm">
            <button onClick={() => onVote(post.id, 'UPVOTE')}
              className={`flex items-center gap-1.5 font-semibold transition-colors ${post.user_vote === 'UPVOTE' ? 'text-primary' : 'text-muted-foreground hover:text-primary'}`}>
              <ThumbsUp className={`w-4 h-4 ${post.user_vote === 'UPVOTE' ? 'fill-primary' : ''}`} />
              {post.upvote_count}
            </button>
            <button onClick={() => onVote(post.id, 'DOWNVOTE')}
              className={`flex items-center gap-1.5 transition-colors ${post.user_vote === 'DOWNVOTE' ? 'text-red-500' : 'text-muted-foreground hover:text-red-500'}`}>
              <ThumbsDown className={`w-4 h-4 ${post.user_vote === 'DOWNVOTE' ? 'fill-red-500' : ''}`} />
              {post.downvote_count}
            </button>
            <span className="flex items-center gap-1.5 text-muted-foreground">
              <Eye className="w-4 h-4" /> {post.view_count}
            </span>
            <span className="flex items-center gap-1.5 text-muted-foreground">
              <MessageSquare className="w-4 h-4" /> {post.comment_count}
            </span>
            {post.is_trending && (
              <span className="ml-auto flex items-center gap-1 text-xs font-bold text-orange-600">
                <Flame className="w-3.5 h-3.5 fill-orange-500" /> Trending
              </span>
            )}
          </div>

          {/* Comments */}
          <div>
            <h3 className="font-semibold text-sm mb-3">{post.comment_count} Comments</h3>
            {loading ? (
              <div className="space-y-2">{[0,1,2].map(i => (
                <div key={i} className="h-16 bg-secondary/50 rounded-xl animate-pulse" />
              ))}</div>
            ) : comments.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground text-sm">
                <MessageSquare className="w-8 h-8 mx-auto mb-2 opacity-30" />
                Be the first to comment
              </div>
            ) : (
              <CommentThread comments={comments} onReply={handleReply} />
            )}
          </div>
        </div>

        {/* Comment input */}
        <div className="p-4 border-t border-border/60 bg-card/80 backdrop-blur-sm">
          {replyTo && (
            <div className="flex items-center gap-2 mb-2 text-xs text-muted-foreground bg-accent/50 rounded-lg px-3 py-1.5">
              <span>Replying to <strong>{replyTo.name}</strong></span>
              <button onClick={() => { setReplyTo(null); setCommentText(''); }}
                className="ml-auto"><X className="w-3 h-3" /></button>
            </div>
          )}
          <div className="flex gap-2">
            <Textarea ref={textareaRef} value={commentText}
              onChange={e => { if (e.target.value.length <= 2000) setCommentText(e.target.value); }}
              placeholder={post.is_locked ? 'This post is locked.' : 'Share your thoughts…'}
              disabled={post.is_locked} rows={2}
              className="resize-none text-sm flex-1" />
            <Button size="icon" className="gradient-primary border-0 text-white self-end shrink-0"
              onClick={handleSubmitComment}
              disabled={!commentText.trim() || submitting || post.is_locked}>
              <Send className="w-4 h-4" />
            </Button>
          </div>
          <div className="text-xs text-muted-foreground mt-1 text-right">{commentText.length}/2000</div>
        </div>
      </motion.div>
    </motion.div>
  );
}

// ─── Create Post Modal ────────────────────────────────────────────────────────
function CreatePostModal({ onClose, onCreated }) {
  const [form, setForm] = useState({ road_id: '', title: '', subject_category: 'ROAD_DAMAGE', content: '' });
  const [roadSearch, setRoadSearch] = useState('');
  const [roads, setRoads] = useState(mockRoadsForGovernance);
  const [showRoadDropdown, setShowRoadDropdown] = useState(false);
  const [selectedRoad, setSelectedRoad] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState({});

  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = ''; };
  }, []);

  const searchRoads = useCallback(async (q) => {
    const results = await communityService.getRoads(q);
    setRoads(results);
  }, []);

  useEffect(() => {
    const t = setTimeout(() => searchRoads(roadSearch), 300);
    return () => clearTimeout(t);
  }, [roadSearch, searchRoads]);

  const validate = () => {
    const e = {};
    if (!form.road_id) e.road = 'Please select a road';
    if (!form.title.trim() || form.title.length < 10) e.title = 'Title must be at least 10 characters';
    if (!form.content.trim() || form.content.length < 20) e.content = 'Description must be at least 20 characters';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate() || submitting) return;
    setSubmitting(true);
    try {
      const post = await communityService.createPost({
        ...form, author_name: 'You', author_level: 'road_scout', author_points: 5,
      });
      onCreated(post);
      onClose();
    } catch (e) {
      console.error(e);
    } finally { setSubmitting(false); }
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/50 backdrop-blur-sm"
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <motion.div initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }}
        transition={{ type: 'spring', damping: 28, stiffness: 300 }}
        className="bg-card w-full sm:max-w-lg rounded-t-3xl sm:rounded-2xl max-h-[92vh] flex flex-col overflow-hidden shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-border/60">
          <div>
            <h2 className="font-bold font-sora">Create Community Post</h2>
            <p className="text-xs text-muted-foreground mt-0.5">Discuss road issues with your community</p>
          </div>
          <button onClick={onClose}
            className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center hover:bg-muted transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="overflow-y-auto flex-1 p-5 space-y-4">
          {/* Road selector */}
          <div>
            <label className="text-sm font-medium mb-1.5 block">Road *</label>
            <div className="relative">
              <div className="flex items-center gap-2 border border-border rounded-xl px-3 py-2.5 bg-background cursor-pointer"
                onClick={() => setShowRoadDropdown(v => !v)}>
                <MapPin className="w-4 h-4 text-muted-foreground shrink-0" />
                {selectedRoad ? (
                  <span className="text-sm font-medium flex-1">{selectedRoad.name} <span className="text-muted-foreground font-normal">— {selectedRoad.district}</span></span>
                ) : (
                  <span className="text-sm text-muted-foreground flex-1">Search for a road…</span>
                )}
                <ChevronDown className="w-4 h-4 text-muted-foreground" />
              </div>
              {showRoadDropdown && (
                <div className="absolute z-10 top-full mt-1 w-full bg-card border border-border rounded-xl shadow-xl overflow-hidden">
                  <div className="p-2 border-b border-border/50">
                    <Input value={roadSearch} onChange={e => setRoadSearch(e.target.value)}
                      placeholder="Type road name or code…" className="text-sm" autoFocus />
                  </div>
                  <div className="max-h-48 overflow-y-auto">
                    {roads.map(r => (
                      <button key={r.id} className="w-full text-left px-3 py-2.5 hover:bg-accent/50 transition-colors"
                        onClick={() => { setSelectedRoad(r); setForm(f => ({ ...f, road_id: r.id })); setShowRoadDropdown(false); setErrors(e => ({ ...e, road: '' })); }}>
                        <div className="text-sm font-medium">{r.name}</div>
                        <div className="text-xs text-muted-foreground flex items-center gap-2">
                          <span>{r.road_code}</span> · <span>{r.district}, {r.state}</span>
                          <span className="ml-auto" style={{ color: HEALTH_COLOR(r.health_score) }}>Health: {r.health_score}</span>
                        </div>
                      </button>
                    ))}
                    {roads.length === 0 && <div className="py-4 text-center text-sm text-muted-foreground">No roads found</div>}
                  </div>
                </div>
              )}
            </div>
            {errors.road && <p className="text-xs text-red-500 mt-1">{errors.road}</p>}
          </div>

          {/* Category */}
          <div>
            <label className="text-sm font-medium mb-1.5 block">Category *</label>
            <div className="grid grid-cols-3 gap-1.5">
              {CATEGORIES.filter(c => c.value !== 'ALL').map(c => (
                <button key={c.value} onClick={() => setForm(f => ({ ...f, subject_category: c.value }))}
                  className={`rounded-xl px-2 py-2 text-xs font-medium transition-all border ${form.subject_category === c.value
                    ? 'gradient-primary border-0 text-white shadow-sm'
                    : 'border-border/60 bg-secondary/40 hover:bg-secondary text-foreground/80'}`}>
                  {c.icon} {c.label}
                </button>
              ))}
              {[
                { value: 'BUDGET_CONCERN', label: 'Budget' },
                { value: 'CONTRACTOR_PERFORMANCE', label: 'Contractor' },
              ].map(c => (
                <button key={c.value} onClick={() => setForm(f => ({ ...f, subject_category: c.value }))}
                  className={`rounded-xl px-2 py-2 text-xs font-medium transition-all border ${form.subject_category === c.value
                    ? 'gradient-primary border-0 text-white shadow-sm'
                    : 'border-border/60 bg-secondary/40 hover:bg-secondary text-foreground/80'}`}>
                  {c.label}
                </button>
              ))}
            </div>
          </div>

          {/* Title */}
          <div>
            <label className="text-sm font-medium mb-1.5 block">Title *</label>
            <Input value={form.title}
              onChange={e => { if (e.target.value.length <= 150) setForm(f => ({ ...f, title: e.target.value })); }}
              placeholder="Describe the issue clearly…" className="text-sm" />
            <div className="flex justify-between mt-1">
              {errors.title ? <p className="text-xs text-red-500">{errors.title}</p> : <span />}
              <span className="text-xs text-muted-foreground">{form.title.length}/150</span>
            </div>
          </div>

          {/* Content */}
          <div>
            <label className="text-sm font-medium mb-1.5 block">Description *</label>
            <Textarea value={form.content}
              onChange={e => { if (e.target.value.length <= 5000) setForm(f => ({ ...f, content: e.target.value })); }}
              placeholder="Provide detailed information: location, duration, impact, photos evidence…"
              rows={5} className="text-sm resize-none" />
            <div className="flex justify-between mt-1">
              {errors.content ? <p className="text-xs text-red-500">{errors.content}</p> : <span />}
              <span className="text-xs text-muted-foreground">{form.content.length}/5000</span>
            </div>
          </div>

          {/* Points info */}
          <div className="flex items-center gap-2 bg-accent/50 rounded-xl px-3 py-2.5 text-xs">
            <Award className="w-3.5 h-3.5 text-primary" />
            <span className="text-muted-foreground">You'll earn <strong className="text-primary">+5 points</strong> for creating this post. Earn more when others upvote!</span>
          </div>
        </div>

        <div className="p-4 border-t border-border/60">
          <Button className="w-full gradient-primary border-0 text-white font-semibold"
            onClick={handleSubmit} disabled={submitting}>
            {submitting ? (
              <span className="flex items-center gap-2"><RotateCcw className="w-4 h-4 animate-spin" /> Publishing…</span>
            ) : (
              <span className="flex items-center gap-2"><Megaphone className="w-4 h-4" /> Publish Post</span>
            )}
          </Button>
        </div>
      </motion.div>
    </motion.div>
  );
}

// ─── Post Card ────────────────────────────────────────────────────────────────
const PostCard = forwardRef(({ post, index, onOpen, onVote }, ref) => {
  const catInfo = CATEGORIES.find(c => c.value === post.subject_category) || CATEGORIES[0];
  const timeAgo = formatDistanceToNow(new Date(post.created_at), { addSuffix: true });

  return (
    <motion.div ref={ref} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
      transition={{ delay: Math.min(index * 0.04, 0.3), duration: 0.3 }}>
      <div className={`bg-card rounded-2xl border transition-all duration-200 hover:shadow-md hover:-translate-y-0.5 cursor-pointer ${post.is_supervoted
        ? 'border-amber-300 dark:border-amber-700 ring-1 ring-amber-200 dark:ring-amber-800'
        : post.is_pinned ? 'border-primary/30'
        : 'border-border/60'}`}
        onClick={() => onOpen(post)}>
        <div className="p-4 sm:p-5">
          {/* Supervote banner */}
          {post.is_supervoted && <SupervoteBanner byName={post.supervoted_by_name} at={post.supervoted_at} />}

          <div className="flex gap-3">
            {/* Vote column */}
            <div className="flex flex-col items-center gap-1 pt-0.5 shrink-0">
              <button onClick={e => { e.stopPropagation(); onVote(post.id, 'UPVOTE'); }}
                className={`w-8 h-8 rounded-lg flex items-center justify-center transition-all ${post.user_vote === 'UPVOTE'
                  ? 'bg-primary text-white shadow-sm'
                  : 'bg-secondary/70 text-muted-foreground hover:bg-primary/10 hover:text-primary'}`}>
                <ThumbsUp className="w-3.5 h-3.5" />
              </button>
              <span className="text-xs font-bold text-foreground">
                {post.upvote_count - post.downvote_count}
              </span>
              <button onClick={e => { e.stopPropagation(); onVote(post.id, 'DOWNVOTE'); }}
                className={`w-8 h-8 rounded-lg flex items-center justify-center transition-all ${post.user_vote === 'DOWNVOTE'
                  ? 'bg-red-500 text-white shadow-sm'
                  : 'bg-secondary/70 text-muted-foreground hover:bg-red-50 hover:text-red-500'}`}>
                <ThumbsDown className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Main content */}
            <div className="flex-1 min-w-0">
              {/* Badges row */}
              <div className="flex items-center gap-1.5 mb-2 flex-wrap">
                {post.is_pinned && (
                  <span className="flex items-center gap-0.5 text-xs font-semibold text-primary">
                    <Pin className="w-2.5 h-2.5" /> Pinned
                  </span>
                )}
                {post.is_trending && (
                  <span className="flex items-center gap-0.5 text-xs font-bold text-orange-600 bg-orange-50 dark:bg-orange-950/30 px-1.5 py-0.5 rounded-md">
                    <Flame className="w-2.5 h-2.5 fill-orange-500" /> Trending
                  </span>
                )}
                <span className={`text-xs px-2 py-0.5 rounded-full border ${CATEGORY_COLORS[post.subject_category]}`}>
                  {catInfo.icon} {catInfo.label}
                </span>
              </div>

              {/* Title */}
              <h3 className="font-semibold text-sm leading-snug text-foreground mb-1.5 line-clamp-2">{post.title}</h3>
              <p className="text-xs text-muted-foreground line-clamp-2 mb-3">{post.content}</p>

              {/* Road info */}
              <div className="flex items-center gap-1.5 mb-3">
                <MiniHealthRing score={post.road_health || 50} />
                <div>
                  <div className="text-xs font-medium text-foreground">{post.road_name}</div>
                  <div className="text-xs text-muted-foreground flex items-center gap-1">
                    <MapPin className="w-2.5 h-2.5" /> {post.road_district}, {post.road_state} · {post.ward || 'Ward mapped'} · {post.authority || 'Authority routed'}
                  </div>
                </div>
              </div>

              {/* Footer */}
              <div className="flex items-center gap-3 text-xs text-muted-foreground flex-wrap">
                <span className="flex items-center gap-1"><Eye className="w-3 h-3" /> {post.view_count}</span>
                <span className="flex items-center gap-1"><MessageSquare className="w-3 h-3" /> {post.comment_count}</span>
                <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> {timeAgo}</span>
                <span className="ml-auto flex items-center gap-1.5">
                  <div className="w-5 h-5 rounded-full bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center text-primary font-bold text-xs">
                    {post.author_name?.[0]}
                  </div>
                  <span className={`px-1.5 py-0.5 rounded-full text-xs ${LEVEL_COLORS[post.author_level] || 'bg-gray-100 text-gray-600'}`}>
                    {LEVEL_DISPLAY[post.author_level] || post.author_level}
                  </span>
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
});

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function PublicGovernancePage() {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [category, setCategory] = useState('ALL');
  const [sort, setSort] = useState('score');
  const [filter, setFilter] = useState('ALL'); // ALL, TRENDING, SUPERVOTED, PINNED
  const [selectedPost, setSelectedPost] = useState(null);
  const [showCreate, setShowCreate] = useState(false);
  const [analytics, setAnalytics] = useState({ totalPosts: 0, totalUpvotes: 0, trending: 0, supervoted: 0 });

  const fetchPosts = useCallback(async (reset = false) => {
    const p = reset ? 1 : page;
    if (reset) { 
      setLoading(true); 
      setPosts([]); 
    } else {
      setLoadingMore(true);
    }

    try {
      const { posts: data, hasMore: more } = await communityService.getPosts({
        category, sort, search, page: p, limit: 5, filter,
      });

      setPosts(prev => reset ? data : [...prev, ...data]);
      setHasMore(more);
      setPage(p + 1);
    } finally { setLoading(false); setLoadingMore(false); }
  }, [category, sort, search, page, filter]);

  // Reset and fetch when filters change
  useEffect(() => { 
    fetchPosts(true); 
  }, [category, sort, search, filter]);

  useEffect(() => { 
    setAnalytics(communityService.getAnalytics()); 
  }, [posts]);

  // Search debounce
  useEffect(() => {
    const t = setTimeout(() => setSearch(searchInput), 400);
    return () => clearTimeout(t);
  }, [searchInput]);

  const handleVote = async (postId, voteType) => {
    const updated = await communityService.vote(postId, voteType);
    if (updated) {
      setPosts(prev => prev.map(p => p.id === postId ? { ...p, ...updated } : p));
      if (selectedPost?.id === postId) setSelectedPost(p => ({ ...p, ...updated }));
    }
  };

  const handlePostCreated = (newPost) => {
    setPosts(prev => [newPost, ...prev]);
    setAnalytics(communityService.getAnalytics());
  };

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-6">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-start justify-between gap-3">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <div className="w-8 h-8 rounded-xl gradient-primary flex items-center justify-center">
                <Users className="w-4 h-4 text-white" />
              </div>
              <h1 className="text-2xl font-bold font-sora">Community Governance</h1>
            </div>
            <p className="text-sm text-muted-foreground">Civic discussions for road safety & government accountability</p>
          </div>
          <Button onClick={() => setShowCreate(true)}
            className="gradient-primary border-0 text-white gap-2 shrink-0 shadow-lg">
            <Plus className="w-4 h-4" /> New Post
          </Button>
        </div>

        {/* Analytics KPIs */}
        <div className="grid grid-cols-4 gap-2 mt-4">
          {[
            { icon: MessageSquare, label: 'Discussions', value: analytics.totalPosts, color: 'text-primary' },
            { icon: ThumbsUp, label: 'Total Votes', value: analytics.totalUpvotes, color: 'text-green-600' },
            { icon: Flame, label: 'Trending', value: analytics.trending, color: 'text-orange-500' },
            { icon: Star, label: 'Supervoted', value: analytics.supervoted, color: 'text-amber-500' },
          ].map((s, i) => (
            <motion.div key={s.label} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              className="bg-card rounded-xl border border-border/60 p-3 text-center">
              <s.icon className={`w-4 h-4 mx-auto mb-1 ${s.color}`} />
              <div className="text-base font-bold font-sora">{s.value}</div>
              <div className="text-xs text-muted-foreground">{s.label}</div>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Search */}
      <div className="relative mb-4">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input value={searchInput} onChange={e => setSearchInput(e.target.value)}
          placeholder="Search by road name, code, or keyword…"
          className="pl-10 bg-card text-sm" />
        {searchInput && (
          <button onClick={() => { setSearchInput(''); setSearch(''); }}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Category filter — horizontal scroll */}
      <div className="flex gap-2 overflow-x-auto pb-2 mb-3 scrollbar-hide">
        {CATEGORIES.map(c => (
          <button key={c.value} onClick={() => setCategory(c.value)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-all border ${category === c.value
              ? 'gradient-primary border-0 text-white shadow-sm'
              : 'border-border/60 bg-card text-muted-foreground hover:text-foreground hover:bg-secondary'}`}>
            {c.icon} {c.label}
          </button>
        ))}
        {[
          { value: 'BUDGET_CONCERN', label: 'Budget Concerns' },
          { value: 'CONTRACTOR_PERFORMANCE', label: 'Contractor Performance' },
        ].map(c => (
          <button key={c.value} onClick={() => setCategory(c.value)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-all border ${category === c.value
              ? 'gradient-primary border-0 text-white shadow-sm'
              : 'border-border/60 bg-card text-muted-foreground hover:text-foreground hover:bg-secondary'}`}>
            {c.label}
          </button>
        ))}
      </div>

      {/* Sort + Quick filters */}
      <div className="flex items-center gap-2 mb-5 flex-wrap">
        <div className="flex gap-1 flex-wrap">
          {[
            { v: 'ALL', icon: Activity, label: 'All' },
            { v: 'TRENDING', icon: Flame, label: 'Trending' },
            { v: 'SUPERVOTED', icon: Star, label: 'Authority' },
            { v: 'PINNED', icon: Pin, label: 'Pinned' },
          ].map(f => (
            <button key={f.v} onClick={() => setFilter(f.v)}
              className={`flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-xs font-medium transition-all ${filter === f.v
                ? 'bg-primary text-white shadow-sm'
                : 'bg-secondary/70 text-muted-foreground hover:bg-secondary'}`}>
              <f.icon className="w-3 h-3" /> {f.label}
            </button>
          ))}
        </div>

        <div className="ml-auto flex items-center gap-1.5">
          <Filter className="w-3.5 h-3.5 text-muted-foreground" />
          <select value={sort} onChange={e => setSort(e.target.value)}
            className="text-xs bg-card border border-border/60 rounded-xl px-2 py-1.5 text-foreground cursor-pointer focus:outline-none focus:ring-1 focus:ring-primary">
            {SORT_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
        </div>
      </div>

      {/* Post List */}
      <div className="space-y-3">
        {loading ? (
          Array.from({ length: 4 }).map((_, i) => <PostSkeleton key={i} />)
        ) : posts.length === 0 ? (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
            className="text-center py-16">
            <div className="text-5xl mb-4">💬</div>
            <h3 className="text-lg font-semibold font-sora mb-2">No discussions found</h3>
            <p className="text-sm text-muted-foreground mb-6">
              {search ? `No posts match "${search}". Try different keywords.` : 'Be the first to start a community discussion!'}
            </p>
            <Button onClick={() => setShowCreate(true)} className="gradient-primary border-0 text-white gap-2">
              <Plus className="w-4 h-4" /> Create First Post
            </Button>
          </motion.div>
        ) : (
          <>
            <AnimatePresence mode="popLayout">
              {posts.map((post, i) => (
                <PostCard key={post.id} post={post} index={i}
                  onOpen={p => setSelectedPost(p)} onVote={handleVote} />
              ))}
            </AnimatePresence>

            {/* Load More Button pagination */}
            {hasMore && (
              <div className="flex justify-center py-6">
                <Button 
                  onClick={() => fetchPosts(false)} 
                  disabled={loadingMore} 
                  variant="outline" 
                  className="gap-2 border-border/60 hover:bg-secondary/40 font-semibold"
                >
                  {loadingMore ? (
                    <span className="flex items-center gap-2">
                      <RotateCcw className="w-4 h-4 animate-spin" /> Loading...
                    </span>
                  ) : (
                    "Load More Discussions"
                  )}
                </Button>
              </div>
            )}
          </>
        )}
      </div>

      {/* Modals */}
      <AnimatePresence>
        {selectedPost && (
          <PostDetailModal
            post={posts.find(p => p.id === selectedPost.id) || selectedPost}
            onClose={() => setSelectedPost(null)}
            onVote={handleVote}
          />
        )}
        {showCreate && (
          <CreatePostModal
            onClose={() => setShowCreate(false)}
            onCreated={handlePostCreated}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
