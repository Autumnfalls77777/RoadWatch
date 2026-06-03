// Service layer for Community Governance / Forums
// Handles posts, comments, voting, and search with localStorage persistence.
// Easy replacement for future REST API integration.

import { mockCommunityPosts, mockCommunityComments, mockRoadsForGovernance } from '@/api/base44Client';

const POSTS_KEY = 'rw_community_posts';
const COMMENTS_KEY = 'rw_community_comments';

// Seed initial data if not present
function initializeStorage() {
  if (!localStorage.getItem(POSTS_KEY)) {
    localStorage.setItem(POSTS_KEY, JSON.stringify(mockCommunityPosts));
  }
  if (!localStorage.getItem(COMMENTS_KEY)) {
    localStorage.setItem(COMMENTS_KEY, JSON.stringify(mockCommunityComments));
  }
}

initializeStorage();

function getStoredPosts() {
  const posts = JSON.parse(localStorage.getItem(POSTS_KEY)) || [];
  return posts.map((post, index) => {
    const road = mockRoadsForGovernance.find(r => r.id === post.road_id) || mockRoadsForGovernance[index % mockRoadsForGovernance.length] || {};
    return {
      ...post,
      road_id: road.id || post.road_id,
      road_name: road.name || post.road_name,
      road_code: road.road_code || post.road_code,
      road_district: road.district || post.road_district,
      road_state: road.state || post.road_state,
      road_health: road.health_score || post.road_health,
      ward: post.ward || road.ward,
      authority: post.authority || road.authority,
    };
  });
}

function setStoredPosts(posts) {
  localStorage.setItem(POSTS_KEY, JSON.stringify(posts));
}

function getStoredComments() {
  return JSON.parse(localStorage.getItem(COMMENTS_KEY)) || {};
}

function setStoredComments(comments) {
  localStorage.setItem(COMMENTS_KEY, JSON.stringify(comments));
}

export const communityService = {
  // Get paginated posts
  async getPosts({ roadId, category, sort = 'score', search = '', page = 1, limit = 5, filter = 'ALL' } = {}) {
    await new Promise(r => setTimeout(r, 200)); // simulate latency
    let posts = getStoredPosts().filter(p => !p.is_hidden);

    if (roadId) posts = posts.filter(p => p.road_id === roadId);
    if (category && category !== 'ALL') posts = posts.filter(p => p.subject_category === category);
    
    if (search) {
      const q = search.toLowerCase();
      posts = posts.filter(p =>
        p.title.toLowerCase().includes(q) ||
        p.content.toLowerCase().includes(q) ||
        p.road_name.toLowerCase().includes(q) ||
        (p.road_code || '').toLowerCase().includes(q)
      );
    }

    // Apply quick filters (trending, supervoted, pinned) before sorting/pagination
    if (filter === 'TRENDING') posts = posts.filter(p => p.is_trending);
    else if (filter === 'SUPERVOTED') posts = posts.filter(p => p.is_supervoted);
    else if (filter === 'PINNED') posts = posts.filter(p => p.is_pinned);

    // Sort
    const pinned = posts.filter(p => p.is_pinned);
    const supervoted = posts.filter(p => p.is_supervoted && !p.is_pinned);
    let rest = posts.filter(p => !p.is_pinned && !p.is_supervoted);

    if (sort === 'score') rest.sort((a, b) => b.score - a.score);
    else if (sort === 'newest') rest.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
    else if (sort === 'upvotes') rest.sort((a, b) => b.upvote_count - a.upvote_count);
    else if (sort === 'comments') rest.sort((a, b) => b.comment_count - a.comment_count);
    else if (sort === 'views') rest.sort((a, b) => b.view_count - a.view_count);

    const sorted = [...pinned, ...supervoted, ...rest];
    const start = (page - 1) * limit;
    const paginatedPosts = sorted.slice(start, start + limit);
    const hasMore = start + limit < sorted.length;

    return { posts: paginatedPosts, total: sorted.length, hasMore };
  },

  async getPost(id) {
    await new Promise(r => setTimeout(r, 100));
    const posts = getStoredPosts();
    const postIdx = posts.findIndex(p => p.id === id);
    if (postIdx === -1) return null;

    // Increment view count
    posts[postIdx].view_count += 1;
    setStoredPosts(posts);
    return posts[postIdx];
  },

  async createPost(data) {
    await new Promise(r => setTimeout(r, 300));
    const posts = getStoredPosts();
    const road = mockRoadsForGovernance.find(r => r.id === data.road_id) || {};
    
    // Check user profile for displaying correct author details
    const activeProfile = JSON.parse(localStorage.getItem('rw_active_profile')) || {};
    const authorName = activeProfile.display_name || data.author_name || 'Anonymous';
    const authorLevel = activeProfile.level || data.author_level || 'road_scout';

    const newPost = {
      id: 'cp_' + Math.random().toString(36).substr(2, 6),
      ...data,
      road_name: road.name || 'Unknown Road',
      road_code: road.road_code || '',
      road_district: road.district || '',
      road_state: road.state || '',
      road_health: road.health_score || 50,
      ward: road.ward || '',
      authority: road.authority || '',
      author_name: authorName,
      author_level: authorLevel,
      author_points: activeProfile.points || 0,
      upvote_count: 0,
      downvote_count: 0,
      comment_count: 0,
      view_count: 0,
      score: 0,
      is_pinned: false,
      is_supervoted: false,
      is_trending: false,
      is_locked: false,
      is_hidden: false,
      media: [],
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      user_vote: null,
    };

    posts.unshift(newPost);
    setStoredPosts(posts);

    // Update user post count
    if (activeProfile.display_name) {
      activeProfile.forum_posts = (activeProfile.forum_posts || 0) + 1;
      activeProfile.points = (activeProfile.points || 0) + 5; // +5 points for creating a post
      localStorage.setItem('rw_active_profile', JSON.stringify(activeProfile));
      // Dispatch storage event to alert UI components
      window.dispatchEvent(new Event('storage'));
    }

    return newPost;
  },

  async vote(postId, voteType) {
    await new Promise(r => setTimeout(r, 100));
    const posts = getStoredPosts();
    const post = posts.find(p => p.id === postId);
    if (!post) return null;

    if (post.user_vote === voteType) {
      // Remove vote
      if (voteType === 'UPVOTE') post.upvote_count = Math.max(0, post.upvote_count - 1);
      else post.downvote_count = Math.max(0, post.downvote_count - 1);
      post.user_vote = null;
    } else {
      if (post.user_vote) {
        if (post.user_vote === 'UPVOTE') post.upvote_count = Math.max(0, post.upvote_count - 1);
        else post.downvote_count = Math.max(0, post.downvote_count - 1);
      }
      if (voteType === 'UPVOTE') post.upvote_count += 1;
      else post.downvote_count += 1;
      post.user_vote = voteType;
    }

    post.score = (post.upvote_count * 2) - (post.downvote_count) + (post.comment_count * 0.5) + (post.view_count * 0.1);
    post.is_trending = post.upvote_count > 50 || post.comment_count > 20 || post.view_count > 500;
    
    setStoredPosts(posts);
    return post;
  },

  async getComments(postId) {
    await new Promise(r => setTimeout(r, 100));
    const comments = getStoredComments();
    return comments[postId] || [];
  },

  async addComment(postId, content, parentId = null) {
    await new Promise(r => setTimeout(r, 200));
    const comments = getStoredComments();
    
    const activeProfile = JSON.parse(localStorage.getItem('rw_active_profile')) || {};
    const authorName = activeProfile.display_name || 'You';
    const authorLevel = activeProfile.level || 'road_scout';

    const comment = {
      id: 'c_' + Math.random().toString(36).substr(2, 6),
      post_id: postId,
      author_name: authorName,
      author_level: authorLevel,
      is_authority_reply: ['junior_officer', 'executive_engineer', 'district_authority', 'state_authority'].includes(authorLevel),
      content,
      upvote_count: 0,
      parent_comment_id: parentId,
      created_at: new Date().toISOString(),
    };

    if (!comments[postId]) comments[postId] = [];
    comments[postId].unshift(comment);
    setStoredComments(comments);

    // Update post comment count & score
    const posts = getStoredPosts();
    const post = posts.find(p => p.id === postId);
    if (post) {
      post.comment_count += 1;
      post.score += 0.5;
      setStoredPosts(posts);
    }

    return comment;
  },

  async getRoads(query = '') {
    await new Promise(r => setTimeout(r, 50));
    if (!query) return mockRoadsForGovernance;
    const q = query.toLowerCase();
    return mockRoadsForGovernance.filter(r =>
      r.name.toLowerCase().includes(q) ||
      r.road_code.toLowerCase().includes(q) ||
      r.district.toLowerCase().includes(q)
    );
  },

  getAnalytics() {
    const posts = getStoredPosts();
    const totalPosts = posts.length;
    const totalUpvotes = posts.reduce((s, p) => s + p.upvote_count, 0);
    const trending = posts.filter(p => p.is_trending).length;
    const supervoted = posts.filter(p => p.is_supervoted).length;
    return { totalPosts, totalUpvotes, trending, supervoted };
  },
};
