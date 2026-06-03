import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, MessageSquare, ThumbsUp, Send, Pin, Shield, UserCheck } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { useAuth } from '@/lib/AuthContext';
import { motion } from 'framer-motion';
import { formatDistanceToNow } from 'date-fns';
import SkeletonCard from '@/components/shared/SkeletonCard';

const POST_TYPE_COLORS = {
  Discussion: 'bg-blue-50 text-blue-700 border-blue-200',
  Update: 'bg-green-50 text-green-700 border-green-200',
  Alert: 'bg-red-50 text-red-700 border-red-200',
  Question: 'bg-purple-50 text-purple-700 border-purple-200',
  Review: 'bg-yellow-50 text-yellow-700 border-yellow-200',
};

function PostCard({ post, index }) {
  const timeAgo = post.created_date ? formatDistanceToNow(new Date(post.created_date), { addSuffix: true }) : '';
  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.04 }}>
      <div className={`bg-card rounded-2xl border p-4 ${post.is_pinned ? 'border-primary/30 bg-accent/20' : 'border-border/60'}`}>
        {post.is_pinned && (
          <div className="flex items-center gap-1 text-xs text-primary font-medium mb-2">
            <Pin className="w-3 h-3" /> Pinned
          </div>
        )}
        <div className="flex items-start gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center flex-shrink-0">
            {post.is_anonymous ? (
              <Shield className="w-4 h-4 text-muted-foreground" />
            ) : (
              <UserCheck className="w-4 h-4 text-primary" />
            )}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1 flex-wrap">
              <span className="font-medium text-sm">{post.is_anonymous ? 'Anonymous Citizen' : (post.author_name || 'Citizen')}</span>
              {post.author_level && <span className="px-2 py-0.5 bg-accent text-accent-foreground rounded-full text-xs">{post.author_level}</span>}
              <span className={`px-2 py-0.5 rounded-full text-xs border ${POST_TYPE_COLORS[post.post_type] || POST_TYPE_COLORS.Discussion}`}>{post.post_type || 'Discussion'}</span>
              <span className="text-xs text-muted-foreground ml-auto">{timeAgo}</span>
            </div>
            <p className="text-sm text-foreground leading-relaxed mb-2">{post.content}</p>
            <button className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-primary transition-colors">
              <ThumbsUp className="w-3.5 h-3.5" /> {post.upvotes || 0} helpful
            </button>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

export default function ForumDetailPage() {
  const { user } = useAuth();
  const { forumId } = useParams();
  const [forum, setForum] = useState(null);
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [newPost, setNewPost] = useState('');
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [posting, setPosting] = useState(false);

  useEffect(() => {
    Promise.all([
      base44.entities.Forum.list('-created_date', 50),
      base44.entities.ForumPost.list('-created_date', 100),
    ]).then(([allForums, allPosts]) => {
      setForum(allForums.find(f => f.id === forumId) || null);
      setPosts(allPosts.filter(p => p.forum_id === forumId));
      setLoading(false);
    }).catch(() => setLoading(false));
  }, [forumId]);

  const handlePost = async () => {
    if (!newPost.trim()) return;

    const now = Date.now();
    const oneHour = 60 * 60 * 1000;
    const timestamps = JSON.parse(localStorage.getItem('forum_timestamps') || '[]');
    const recent = timestamps.filter(t => now - t < oneHour);
    if (recent.length >= 5) {
      alert("Rate limit exceeded: You can only post 5 messages per hour.");
      return;
    }

    setPosting(true);
    try {
      const post = await base44.entities.ForumPost.create({
        forum_id: forumId,
        content: newPost.trim(),
        is_anonymous: isAnonymous,
        author_name: isAnonymous ? null : (user?.name || 'You'),
        author_id: user?.id || null,
        author_level: 'Road Scout',
        post_type: 'Discussion',
        upvotes: 0,
      });
      localStorage.setItem('forum_timestamps', JSON.stringify([...recent, now]));
      setPosts(prev => [post, ...prev]);
      setNewPost('');
    } catch (e) {
      console.error(e);
    } finally {
      setPosting(false);
    }
  };

  if (loading) return <div className="max-w-2xl mx-auto px-4 py-8 space-y-3"><SkeletonCard lines={3} /><SkeletonCard lines={2} /></div>;

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 py-6">
      <Link to="/forums" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors mb-5">
        <ArrowLeft className="w-4 h-4" />
        Back to Forums
      </Link>

      {/* Forum Header */}
      {forum && (
        <div className="bg-card rounded-2xl border border-border/60 p-5 mb-5">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-2xl gradient-primary flex items-center justify-center flex-shrink-0">
              <MessageSquare className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-lg font-bold font-sora mb-1">{forum.title}</h1>
              {forum.road_name && <div className="text-sm text-muted-foreground mb-2">{forum.road_name}</div>}
              <div className="flex items-center gap-3 text-xs text-muted-foreground">
                <span>{posts.length} posts</span>
                <span>{forum.participant_count || 0} participants</span>
                <span className={`px-2 py-0.5 rounded-full border ${
                  forum.status === 'Active' ? 'bg-green-50 text-green-700 border-green-200' : 'bg-gray-50 text-gray-600 border-gray-200'
                }`}>{forum.status}</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* New Post */}
      <div className="bg-card rounded-2xl border border-border/60 p-4 mb-5">
        <Textarea
          placeholder="Share your thoughts, observations, or updates about this road issue..."
          value={newPost}
          onChange={e => setNewPost(e.target.value)}
          rows={3}
          className="mb-3"
        />
        <div className="flex items-center justify-between gap-3">
          <label className="flex items-center gap-2 text-sm cursor-pointer">
            <input type="checkbox" checked={isAnonymous} onChange={e => setIsAnonymous(e.target.checked)} className="rounded" />
            <Shield className="w-3.5 h-3.5 text-muted-foreground" />
            <span className="text-muted-foreground">Post anonymously</span>
          </label>
          <Button className="gradient-primary border-0 text-white gap-2" onClick={handlePost} disabled={posting || !newPost.trim()}>
            <Send className="w-3.5 h-3.5" />
            {posting ? 'Posting...' : 'Post'}
          </Button>
        </div>
      </div>

      {/* Posts */}
      {posts.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          <MessageSquare className="w-10 h-10 mx-auto mb-3 opacity-30" />
          <div className="text-sm">No posts yet. Be the first to share!</div>
        </div>
      ) : (
        <div className="space-y-3">
          {posts.map((p, i) => <PostCard key={p.id} post={p} index={i} />)}
        </div>
      )}
    </div>
  );
}