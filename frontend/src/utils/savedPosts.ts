import { Post } from '../services/feedService';

const SAVED_POSTS_STORAGE_KEY = 'skillsphere_saved_posts';
export const SAVED_POSTS_EVENT = 'skillsphere_saved_posts_changed';

/**
 * Retrieve all saved posts from localStorage
 */
export function getSavedPosts(): Post[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(SAVED_POSTS_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch (err) {
    console.warn('[savedPosts] Failed to parse saved posts from localStorage:', err);
    return [];
  }
}

/**
 * Check if a post is currently saved
 */
export function isPostSaved(postId: string): boolean {
  if (!postId) return false;
  const saved = getSavedPosts();
  return saved.some((p) => p.id === postId);
}

/**
 * Save a post
 */
export function savePost(post: Post): void {
  if (typeof window === 'undefined' || !post?.id) return;
  const current = getSavedPosts();
  const exists = current.some((p) => p.id === post.id);
  if (!exists) {
    const updated = [post, ...current];
    try {
      localStorage.setItem(SAVED_POSTS_STORAGE_KEY, JSON.stringify(updated));
      window.dispatchEvent(new Event(SAVED_POSTS_EVENT));
    } catch (e) {
      console.warn('[savedPosts] Could not save post to localStorage:', e);
    }
  }
}

/**
 * Remove a post from saved
 */
export function unsavePost(postId: string): void {
  if (typeof window === 'undefined' || !postId) return;
  const current = getSavedPosts();
  const updated = current.filter((p) => p.id !== postId);
  try {
    localStorage.setItem(SAVED_POSTS_STORAGE_KEY, JSON.stringify(updated));
    window.dispatchEvent(new Event(SAVED_POSTS_EVENT));
  } catch (e) {
    console.warn('[savedPosts] Could not update localStorage after unsaving:', e);
  }
}

/**
 * Toggle save state for a post
 * @returns boolean new saved state (true = now saved, false = now unsaved)
 */
export function toggleSavePost(post: Post): boolean {
  if (!post?.id) return false;
  if (isPostSaved(post.id)) {
    unsavePost(post.id);
    return false;
  } else {
    savePost(post);
    return true;
  }
}
