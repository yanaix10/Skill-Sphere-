import { BACKEND_URL } from '../utils/api';
import { auth } from '../firebase';

export interface PostMention {
  type: 'book' | 'movie';
  external_id: string;
  title: string;
  subtitle?: string;
  cover_url?: string;
  year?: string;
}

export interface Post {
  id: string;
  author_id: string;
  author_name: string;
  author_avatar?: string;
  content_html: string;
  content_plain: string;
  like_count: number;
  mentions: PostMention[];
  created_at: string;
  hasLiked?: boolean;
}

export interface FeedResponse {
  posts: Post[];
  total: number;
  page: number;
  limit: number;
  hasMore: boolean;
}

export interface NormalizedMediaItem {
  external_id: string;
  type: 'book' | 'movie';
  title: string;
  subtitle: string;
  cover_url: string;
  year: string;
}

/**
 * Returns authorization headers with Firebase ID token or dev bypass
 */
async function getAuthHeaders(): Promise<Record<string, string>> {
  const user = auth.currentUser;
  if (!user) {
    return {
      'Content-Type': 'application/json',
      'Authorization': 'Bearer dev-bypass-token',
      'x-dev-user': 'true',
    };
  }

  try {
    const token = await user.getIdToken();
    return {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    };
  } catch {
    return {
      'Content-Type': 'application/json',
      'Authorization': 'Bearer dev-bypass-token',
    };
  }
}

/**
 * GET /api/media/search?type=book|movie&q={query}
 */
export async function searchMedia(type: 'book' | 'movie', q: string): Promise<NormalizedMediaItem[]> {
  if (!q.trim()) return [];

  const headers = await getAuthHeaders();
  const url = `${BACKEND_URL}/api/media/search?type=${encodeURIComponent(type)}&q=${encodeURIComponent(q.trim())}`;
  
  const res = await fetch(url, { headers });
  if (!res.ok) {
    throw new Error(`Media search failed with status ${res.status}`);
  }
  return res.json();
}

/**
 * GET /api/feed?sort=recent|popular&page=1&limit=10
 */
export async function fetchFeed(sort: 'recent' | 'popular' = 'recent', page = 1, limit = 10): Promise<FeedResponse> {
  const headers = await getAuthHeaders();
  const user = auth.currentUser;
  const userId = user?.uid || 'test-user-123';
  const url = `${BACKEND_URL}/api/feed?sort=${sort}&page=${page}&limit=${limit}&userId=${encodeURIComponent(userId)}`;

  const res = await fetch(url, { headers });
  if (!res.ok) {
    throw new Error(`Failed to fetch feed with status ${res.status}`);
  }
  return res.json();
}

/**
 * POST /api/posts
 */
export async function createPost(payload: {
  content_html: string;
  content_plain: string;
  mentions: PostMention[];
}): Promise<Post> {
  const headers = await getAuthHeaders();
  const user = auth.currentUser;

  const body = {
    ...payload,
    author_id: user?.uid || 'test-user-123',
    author_name: user?.displayName || user?.email?.split('@')[0] || 'Developer',
    author_avatar: user?.photoURL || '',
  };

  const res = await fetch(`${BACKEND_URL}/api/posts`, {
    method: 'POST',
    headers,
    body: JSON.stringify(body),
  });

  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error || `Failed to create post (${res.status})`);
  }

  return data.post;
}

/**
 * POST /api/posts/:id/like
 */
export async function likePost(postId: string): Promise<{ success: boolean; like_count: number; hasLiked: boolean }> {
  const headers = await getAuthHeaders();
  const user = auth.currentUser;
  const body = { userId: user?.uid || 'test-user-123' };

  const res = await fetch(`${BACKEND_URL}/api/posts/${postId}/like`, {
    method: 'POST',
    headers,
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    throw new Error('Failed to like post');
  }
  return res.json();
}

/**
 * DELETE /api/posts/:id/like
 */
export async function unlikePost(postId: string): Promise<{ success: boolean; like_count: number; hasLiked: boolean }> {
  const headers = await getAuthHeaders();
  const user = auth.currentUser;
  const body = { userId: user?.uid || 'test-user-123' };

  const res = await fetch(`${BACKEND_URL}/api/posts/${postId}/like`, {
    method: 'DELETE',
    headers,
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    throw new Error('Failed to unlike post');
  }
  return res.json();
}

