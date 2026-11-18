import React, { useState, useEffect, useCallback } from 'react';
import {
  Plus,
  Flame,
  Clock,
  Loader2,
  RefreshCw,
  BookOpen,
  Film,
  Heart,
  Bookmark,
  MessageSquare,
  ChevronRight,
} from 'lucide-react';
import { fetchFeed, Post, likePost, unlikePost } from '../services/feedService';
import PostComposerModal from '../components/feed/PostComposerModal';
import PostDetailModal from '../components/feed/PostDetailModal';
import AvatarCircles from '../components/ui/avatar-circles';
import { isPostSaved, toggleSavePost, SAVED_POSTS_EVENT } from '../utils/savedPosts';
import { auth } from '../firebase';

const SAMPLE_LIKER_AVATARS = [
  'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=80&h=80&fit=crop&crop=faces',
  'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=80&h=80&fit=crop&crop=faces',
  'https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?w=80&h=80&fit=crop&crop=faces',
];

function formatDate(dateString: string): string {
  try {
    const d = new Date(dateString);
    return d.toLocaleDateString(undefined, {
      month: 'short',
      day: 'numeric',
    });
  } catch {
    return 'Recently';
  }
}

export const FeedPage: React.FC = () => {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [loadingMore, setLoadingMore] = useState<boolean>(false);
  const [sort, setSort] = useState<'recent' | 'popular'>('recent');
  const [page, setPage] = useState<number>(1);
  const [hasMore, setHasMore] = useState<boolean>(false);
  const [isComposerOpen, setIsComposerOpen] = useState<boolean>(false);
  const [selectedPost, setSelectedPost] = useState<Post | null>(null);
  const [, setSavedVersion] = useState<number>(0);

  // Sync saved state when updated
  useEffect(() => {
    const handleUpdate = () => setSavedVersion((v) => v + 1);
    window.addEventListener(SAVED_POSTS_EVENT, handleUpdate);
    return () => window.removeEventListener(SAVED_POSTS_EVENT, handleUpdate);
  }, []);

  // Load feed
  const loadFeed = useCallback(
    async (selectedSort: 'recent' | 'popular', targetPage: number, append = false) => {
      if (targetPage === 1) setLoading(true);
      else setLoadingMore(true);

      try {
        const data = await fetchFeed(selectedSort, targetPage, 12);
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
    },
    []
  );

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
    setPosts((prev) => [newPost, ...prev]);
    setSelectedPost(newPost);
  };

  // Inline Quick Like handler
  const handleInlineLike = async (e: React.MouseEvent, post: Post) => {
    e.stopPropagation();
    const nextLiked = !post.hasLiked;
    const nextCount = nextLiked ? post.like_count + 1 : Math.max(0, post.like_count - 1);

    setPosts((prev) =>
      prev.map((p) => (p.id === post.id ? { ...p, hasLiked: nextLiked, like_count: nextCount } : p))
    );

    try {
      if (nextLiked) {
        await likePost(post.id);
      } else {
        await unlikePost(post.id);
      }
    } catch {
      setPosts((prev) =>
        prev.map((p) => (p.id === post.id ? { ...p, hasLiked: post.hasLiked, like_count: post.like_count } : p))
      );
    }
  };

  // Inline Quick Save handler
  const handleInlineSave = (e: React.MouseEvent, post: Post) => {
    e.stopPropagation();
    toggleSavePost(post);
    setSavedVersion((v) => v + 1);
  };

  return (
    <div className="h-full w-full bg-background text-foreground overflow-y-auto">
      <main className="max-w-5xl w-full mx-auto px-4 sm:px-6 py-6 sm:py-8 flex flex-col gap-6">
        {/* Header Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-border/60">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground flex items-center gap-3">
              <span>Feed</span>
              <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-muted text-muted-foreground border border-border/80">
                Tabular view
              </span>
            </h1>
            <p className="text-xs text-muted-foreground mt-1">
              Click any review row to open and read the full paragraph.
            </p>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            {/* Sort Switcher */}
            <div className="flex items-center p-1 rounded-xl bg-muted/60 border border-border text-xs font-semibold">
              <button
                type="button"
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
                type="button"
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

            {/* Write Review Button */}
            <button
              type="button"
              onClick={() => setIsComposerOpen(true)}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-primary text-primary-foreground font-semibold text-xs sm:text-sm hover:bg-primary/90 transition-all shadow-2xs hover:shadow-sm cursor-pointer border-none"
            >
              <Plus className="w-4 h-4 stroke-[2.5]" />
              <span className="hidden sm:inline">Write Review</span>
              <span className="sm:hidden">Post</span>
            </button>
          </div>
        </div>

        {/* Tabular Feed View */}
        {loading ? (
          <div className="flex flex-col gap-3 py-20 items-center justify-center text-muted-foreground">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
            <p className="text-xs font-medium">Loading review feed...</p>
          </div>
        ) : posts.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 px-4 text-center rounded-2xl border border-dashed border-border bg-card/40">
            <div className="w-14 h-14 rounded-2xl bg-muted flex items-center justify-center text-muted-foreground mb-4">
              <BookOpen className="w-7 h-7 text-primary/70" />
            </div>
            <h3 className="text-base sm:text-lg font-bold text-foreground">No reviews in the feed yet</h3>
            <p className="text-xs text-muted-foreground max-w-sm mt-1 mb-6 leading-relaxed">
              Be the first to share your review on an inspiring book or movie. Click below to write one.
            </p>
            <button
              type="button"
              onClick={() => setIsComposerOpen(true)}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-primary text-primary-foreground font-bold text-xs hover:bg-primary/90 transition-all cursor-pointer shadow-md"
            >
              <Plus className="w-4 h-4" />
              <span>Write the First Review</span>
            </button>
          </div>
        ) : (
          <div className="rounded-xl border border-border bg-card overflow-hidden shadow-2xs">
            {/* Table Header */}
            <div className="hidden md:grid grid-cols-12 gap-3 px-5 py-3 border-b border-border bg-muted/40 text-[11px] font-bold text-muted-foreground uppercase tracking-wider select-none">
              <div className="col-span-5">Review Title & Preview</div>
              <div className="col-span-3">Reviewed Media</div>
              <div className="col-span-2">Author & Date</div>
              <div className="col-span-2 text-right">Engagement</div>
            </div>

            {/* Table Rows */}
            <div className="divide-y divide-border/60">
              {posts.map((post) => {
                const words = (post.content_plain || '').trim().split(/\s+/).filter(Boolean).length;
                const readTime = `${Math.max(1, Math.ceil(words / 180))} min read`;
                const saved = isPostSaved(post.id);
                const hasMedia = post.mentions && post.mentions.length > 0;
                const firstMedia = hasMedia ? post.mentions[0] : null;

                return (
                  <div
                    key={post.id}
                    onClick={() => setSelectedPost(post)}
                    className="p-4 sm:px-5 sm:py-3.5 hover:bg-muted/40 transition-colors cursor-pointer group flex flex-col md:grid md:grid-cols-12 gap-3 items-start md:items-center"
                  >
                    {/* Column 1: Title & Snippet (5 cols) */}
                    <div className="w-full md:col-span-5 min-w-0 pr-2">
                      <div className="flex items-center gap-2">
                        <h2 className="text-xs sm:text-sm font-semibold text-foreground truncate group-hover:text-primary transition-colors">
                          {post.title || 'Book & Movie Review'}
                        </h2>
                      </div>
                      <p className="text-[11px] text-muted-foreground line-clamp-1 mt-0.5 leading-normal">
                        {post.content_plain}
                      </p>
                    </div>

                    {/* Column 2: Reviewed Media (3 cols) */}
                    <div className="w-full md:col-span-3 flex items-center gap-2 min-w-0">
                      {firstMedia ? (
                        <div className="flex items-center gap-2 min-w-0 px-2 py-1 rounded-md bg-muted/60 border border-border/60">
                          {firstMedia.type === 'book' ? (
                            <BookOpen className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                          ) : (
                            <Film className="w-3.5 h-3.5 text-sky-500 shrink-0" />
                          )}
                          <span className="text-[11px] font-medium text-foreground truncate">
                            {firstMedia.title}
                          </span>
                        </div>
                      ) : (
                        <span className="text-[11px] text-muted-foreground/60 italic">
                          No media tagged
                        </span>
                      )}
                    </div>

                    {/* Column 3: Author & Date (2 cols) */}
                    <div className="w-full md:col-span-2 flex items-center gap-2 min-w-0 text-[11px] text-muted-foreground font-mono">
                      <span className="truncate font-sans font-medium text-foreground max-w-[90px]">
                        {post.author_name}
                      </span>
                      <span>•</span>
                      <span>{formatDate(post.created_at)}</span>
                    </div>

                    {/* Column 4: Engagement & Actions (2 cols) */}
                    <div className="w-full md:col-span-2 flex items-center justify-between md:justify-end gap-3 text-xs">
                      <div className="flex items-center gap-2.5">
                        {/* Likes with Quick Liker Avatars */}
                        <button
                          type="button"
                          onClick={(e) => handleInlineLike(e, post)}
                          className={`flex items-center gap-1 px-2 py-1 rounded-lg transition-colors cursor-pointer border ${
                            post.hasLiked
                              ? 'bg-rose-500/10 border-rose-500/30 text-rose-600 dark:text-rose-400 font-bold'
                              : 'border-border/60 hover:bg-muted text-muted-foreground'
                          }`}
                          title={post.hasLiked ? 'Unlike' : 'Like'}
                        >
                          <Heart className={`w-3.5 h-3.5 ${post.hasLiked ? 'fill-current' : ''}`} />
                          <span className="text-[11px]">{post.like_count || 0}</span>
                        </button>

                        {(post.like_count || 0) > 0 && (
                          <div className="hidden lg:block">
                            <AvatarCircles
                              avatarUrls={SAMPLE_LIKER_AVATARS.slice(0, Math.min(2, post.like_count || 0))}
                            />
                          </div>
                        )}

                        {/* Comments count */}
                        <div className="flex items-center gap-1 text-[11px] text-muted-foreground">
                          <MessageSquare className="w-3 h-3" />
                          <span>{post.comment_count || (post.comments?.length || 0)}</span>
                        </div>
                      </div>

                      <div className="flex items-center gap-1">
                        {/* Save Button */}
                        <button
                          type="button"
                          onClick={(e) => handleInlineSave(e, post)}
                          className={`p-1.5 rounded-lg transition-colors cursor-pointer border ${
                            saved
                              ? 'bg-primary/10 border-primary/30 text-primary'
                              : 'border-transparent hover:bg-muted text-muted-foreground hover:text-foreground'
                          }`}
                          title={saved ? 'Remove bookmark' : 'Bookmark review'}
                        >
                          <Bookmark className={`w-3.5 h-3.5 ${saved ? 'fill-primary' : ''}`} />
                        </button>

                        <ChevronRight className="w-4 h-4 text-muted-foreground/60 group-hover:text-foreground group-hover:translate-x-0.5 transition-all" />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Load More Row */}
            {hasMore && (
              <div className="p-3 bg-muted/20 border-t border-border flex justify-center">
                <button
                  type="button"
                  onClick={handleLoadMore}
                  disabled={loadingMore}
                  className="flex items-center gap-2 px-4 py-1.5 rounded-lg border border-border bg-card hover:bg-muted text-xs font-semibold text-foreground transition-all cursor-pointer shadow-2xs"
                >
                  {loadingMore ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin text-primary" />
                      <span>Loading more...</span>
                    </>
                  ) : (
                    <>
                      <RefreshCw className="w-3 h-3" />
                      <span>Load more reviews</span>
                    </>
                  )}
                </button>
              </div>
            )}
          </div>
        )}
      </main>

      {/* Post Detail Paragraph Modal */}
      <PostDetailModal
        post={selectedPost}
        isOpen={Boolean(selectedPost)}
        onClose={() => setSelectedPost(null)}
        onPostUpdated={(updated) => {
          setPosts((prev) => prev.map((p) => (p.id === updated.id ? updated : p)));
        }}
      />

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
