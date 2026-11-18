import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Plus,
  Flame,
  Clock,
  Sparkles,
  Loader2,
  RefreshCw,
  BookOpen,
  Film,
} from 'lucide-react';
import { fetchFeed, Post } from '../services/feedService';
import PostCard from '../components/feed/PostCard';
import PostComposerModal from '../components/feed/PostComposerModal';
import HomeSidebar, { SidebarSection } from '../components/HomeSidebar';
import { auth } from '../firebase';

export const FeedPage: React.FC = () => {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [loadingMore, setLoadingMore] = useState<boolean>(false);
  const [sort, setSort] = useState<'recent' | 'popular'>('recent');
  const [page, setPage] = useState<number>(1);
  const [hasMore, setHasMore] = useState<boolean>(false);
  const [isComposerOpen, setIsComposerOpen] = useState<boolean>(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState<boolean>(true);

  const navigate = useNavigate();

  // Load feed
  const loadFeed = useCallback(async (selectedSort: 'recent' | 'popular', targetPage: number, append = false) => {
    if (targetPage === 1) setLoading(true);
    else setLoadingMore(true);

    try {
      const data = await fetchFeed(selectedSort, targetPage, 10);
      if (append) {
        setPosts((prev) => {
          const existingIds = new Set(prev.map((p) => p.id));
          const newPosts = data.posts.filter((p) => !existingIds.has(p.id));
          return [...prev, ...newPosts];
        });
      } else {
        setPosts(data.posts);
      }
      setHasMore(data.hasMore);
      setPage(targetPage);
    } catch (err) {
      console.error('[FeedPage] Error loading feed:', err);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, []);

  useEffect(() => {
    loadFeed(sort, 1, false);
  }, [sort, loadFeed]);

  const handleSortChange = (newSort: 'recent' | 'popular') => {
    if (newSort === sort) return;
    setSort(newSort);
  };

  const handleLoadMore = () => {
    if (!loadingMore && hasMore) {
      loadFeed(sort, page + 1, true);
    }
  };

  const handlePostCreated = (newPost: Post) => {
    // Prepend new review at the very top of feed
    setPosts((prev) => [newPost, ...prev]);
  };

  const handleSidebarNavigate = (sec: SidebarSection) => {
    if (sec === 'feed') return;
    if (sec === 'overview') {
      navigate('/dashboard');
      return;
    }
    navigate('/dashboard');
  };

  return (
    <div className="h-full w-full flex bg-background text-foreground overflow-hidden">
      {/* Primary HomeSidebar with 'feed' active */}
      <HomeSidebar
        isOpen={isSidebarOpen}
        onToggle={() => setIsSidebarOpen(!isSidebarOpen)}
        activeSection="feed"
        onSelectSection={handleSidebarNavigate}
      />

      {/* Main Feed Viewport */}
      <main className="flex-1 flex flex-col h-full min-w-0 overflow-y-auto">
        <div className="max-w-4xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 flex flex-col gap-6">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-border/60">
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground flex items-center gap-2.5">
                  <span>Feed</span>
                  <span className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.8)]" />
                </h1>
              </div>
              <p className="text-xs sm:text-sm text-muted-foreground mt-1">
                Student reviews of inspiring books & movies with live media embeds.
              </p>
            </div>

            <div className="flex items-center gap-3 shrink-0">
              {/* Sort Switcher */}
              <div className="flex items-center p-1 rounded-xl bg-muted/60 border border-border text-xs font-semibold">
                <button
                  onClick={() => handleSortChange('recent')}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all cursor-pointer border-none ${
                    sort === 'recent'
                      ? 'bg-card text-foreground shadow-xs font-bold'
                      : 'text-muted-foreground hover:text-foreground bg-transparent'
                  }`}
                >
                  <Clock className="w-3.5 h-3.5" />
                  <span>Newest</span>
                </button>
                <button
                  onClick={() => handleSortChange('popular')}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all cursor-pointer border-none ${
                    sort === 'popular'
                      ? 'bg-card text-foreground shadow-xs font-bold'
                      : 'text-muted-foreground hover:text-foreground bg-transparent'
                  }`}
                >
                  <Flame className="w-3.5 h-3.5 text-rose-500" />
                  <span>Most liked</span>
                </button>
              </div>

              {/* Prominent Write Review Button */}
              <button
                onClick={() => setIsComposerOpen(true)}
                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-primary text-primary-foreground font-bold text-xs sm:text-sm hover:bg-primary/90 transition-all shadow-md hover:shadow-lg cursor-pointer border-none"
              >
                <Plus className="w-4 h-4 stroke-[2.5]" />
                <span className="hidden sm:inline">Write Review</span>
                <span className="sm:hidden">Post</span>
              </button>
            </div>
          </div>

          {/* Quick Info Banner */}
          <div className="p-4 rounded-2xl bg-gradient-to-r from-primary/10 via-primary/5 to-transparent border border-primary/20 flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-primary/20 text-primary flex items-center justify-center shrink-0">
                <Sparkles className="w-5 h-5" />
              </div>
              <div className="text-xs">
                <p className="font-bold text-foreground">Write a min. 80-word review</p>
                <p className="text-muted-foreground mt-0.5">
                  Type <span className="font-mono text-primary font-semibold">@book/</span> or <span className="font-mono text-primary font-semibold">@movie/</span> to lookup and insert real covers.
                </p>
              </div>
            </div>
            <button
              onClick={() => setIsComposerOpen(true)}
              className="hidden md:flex items-center gap-1.5 text-xs font-semibold text-primary hover:underline cursor-pointer bg-transparent border-none"
            >
              <span>Compose now</span>
              <span>→</span>
            </button>
          </div>

          {/* Feed Content */}
          {loading ? (
            <div className="flex flex-col gap-4 py-8 items-center justify-center text-muted-foreground">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
              <p className="text-xs font-medium">Loading reviews...</p>
            </div>
          ) : posts.length === 0 ? (
            /* Empty State */
            <div className="flex flex-col items-center justify-center py-16 px-4 text-center rounded-2xl border border-dashed border-border bg-card/40">
              <div className="w-14 h-14 rounded-2xl bg-muted flex items-center justify-center text-muted-foreground mb-4">
                <BookOpen className="w-7 h-7 text-primary/70" />
              </div>
              <h3 className="text-lg font-bold text-foreground">No reviews yet</h3>
              <p className="text-xs text-muted-foreground max-w-sm mt-1 mb-6 leading-relaxed">
                Be the first CS student to share your thoughts on a recent book or movie. Reviews are min. 80 words and feature interactive covers.
              </p>
              <button
                onClick={() => setIsComposerOpen(true)}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-primary text-primary-foreground font-bold text-xs hover:bg-primary/90 transition-all cursor-pointer shadow-md"
              >
                <Plus className="w-4 h-4" />
                <span>Write the First Review</span>
              </button>
            </div>
          ) : (
            /* Post Cards Vertical List */
            <div className="flex flex-col gap-5">
              {posts.map((post) => (
                <PostCard
                  key={post.id}
                  post={post}
                  currentUserId={auth.currentUser?.uid}
                />
              ))}

              {/* Load More Button */}
              {hasMore && (
                <div className="flex justify-center pt-4 pb-6">
                  <button
                    onClick={handleLoadMore}
                    disabled={loadingMore}
                    className="flex items-center gap-2 px-6 py-2.5 rounded-xl border border-border bg-card hover:bg-muted text-xs font-bold text-foreground transition-all cursor-pointer shadow-xs"
                  >
                    {loadingMore ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin text-primary" />
                        <span>Loading more reviews...</span>
                      </>
                    ) : (
                      <>
                        <RefreshCw className="w-3.5 h-3.5" />
                        <span>Load more reviews</span>
                      </>
                    )}
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Feed Footer & TMDB Attribution (Required by Section 7 of Spec) */}
          <footer className="pt-8 pb-12 mt-6 border-t border-border/50 flex flex-col sm:flex-row items-center justify-between gap-4 text-center sm:text-left text-muted-foreground">
            <div className="flex items-center gap-3">
              <div className="px-2 py-1 rounded bg-sky-500/10 text-sky-600 dark:text-sky-400 font-black text-[10px] tracking-wider uppercase border border-sky-500/20">
                TMDB
              </div>
              <p className="text-[11px] max-w-md leading-relaxed text-muted-foreground">
                This product uses the TMDB API but is not endorsed or certified by TMDB. Book covers sourced via Open Library & Google Books.
              </p>
            </div>

            <span className="text-[11px] font-mono opacity-60">
              SkillSphere Feed © 2026
            </span>
          </footer>
        </div>
      </main>

      {/* Post Composer Modal */}
      <PostComposerModal
        isOpen={isComposerOpen}
        onClose={() => setIsComposerOpen(false)}
        onPostCreated={handlePostCreated}
      />
    </div>
  );
};

export default FeedPage;

