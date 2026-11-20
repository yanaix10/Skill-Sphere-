import { Post } from '../services/feedService';
import { auth, db } from '../firebase';
import { doc, getDoc, setDoc } from 'firebase/firestore';

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

    // Sync to Firestore user document if signed in
    const user = auth.currentUser;
    if (user && user.uid !== 'test-user-123') {
      setDoc(
        doc(db, 'users', user.uid),
        { savedPosts: updated },
        { merge: true }
      ).catch((err) => {
        console.warn('[savedPosts] Could not sync saved post to firestore:', err);
      });
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

  // Sync to Firestore user document if signed in
  const user = auth.currentUser;
  if (user && user.uid !== 'test-user-123') {
    setDoc(
      doc(db, 'users', user.uid),
      { savedPosts: updated },
      { merge: true }
    ).catch((err) => {
      console.warn('[savedPosts] Could not sync unsave to firestore:', err);
    });
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

/**
 * Sync saved posts from Firestore into localStorage
 */
export async function syncSavedPostsWithFirestore(): Promise<Post[]> {
  const user = auth.currentUser;
  if (!user || user.uid === 'test-user-123') return getSavedPosts();
  try {
    const snap = await getDoc(doc(db, 'users', user.uid));
    if (snap.exists()) {
      const data = snap.data();
      if (Array.isArray(data.savedPosts)) {
        localStorage.setItem(SAVED_POSTS_STORAGE_KEY, JSON.stringify(data.savedPosts));
        window.dispatchEvent(new Event(SAVED_POSTS_EVENT));
        return data.savedPosts;
      }
    }
  } catch (err) {
    console.warn('[savedPosts] Failed to fetch saved posts from firestore:', err);
  }
  return getSavedPosts();
}
