import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { LazyImage } from '../ui/lazy-image';
import { AvatarCircles } from '../ui/avatar-circles';
import { Post } from '../../services/feedService';
import { getSavedPosts, unsavePost, SAVED_POSTS_EVENT } from '../../utils/savedPosts';
import PostDetailModal from '../feed/PostDetailModal';
import { Bookmark, Heart, MessageSquare, Trash2, BookOpen, Sparkles } from 'lucide-react';
import { auth, db } from '../../firebase';
import { doc, onSnapshot } from 'firebase/firestore';

const SAMPLE_LIKER_AVATARS = [
  'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=80&h=80&fit=crop&crop=faces',
  'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=80&h=80&fit=crop&crop=faces',
  'https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?w=80&h=80&fit=crop&crop=faces',
];

export const SavedPosts: React.FC = () => {
  const [savedPosts, setSavedPosts] = useState<Post[]>(getSavedPosts);
  const [selectedPost, setSelectedPost] = useState<Post | null>(null);
  const navigate = useNavigate();

  // Listen to local changes
  useEffect(() => {
    const handleUpdate = () => {
      setSavedPosts(getSavedPosts());
    };
    window.addEventListener(SAVED_POSTS_EVENT, handleUpdate);
    window.addEventListener('storage', handleUpdate);
    return () => {
      window.removeEventListener(SAVED_POSTS_EVENT, handleUpdate);
      window.removeEventListener('storage', handleUpdate);
    };
  }, []);

  // Real-time synchronization with Firestore user's savedPosts
  useEffect(() => {
    const user = auth.currentUser;
    if (!user || user.uid === 'test-user-123') return;

    const unsubscribe = onSnapshot(doc(db, 'users', user.uid), (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        if (Array.isArray(data.savedPosts)) {
          setSavedPosts(data.savedPosts);
          try {
            localStorage.setItem('skillsphere_saved_posts', JSON.stringify(data.savedPosts));
          } catch {}
        }
      }
    });

    return () => unsubscribe();
  }, []);

  const handleUnsave = (e: React.MouseEvent, postId: string) => {
    e.stopPropagation();
    unsavePost(postId);
    setSavedPosts(getSavedPosts());
  };

  return (
    <div className="mx-auto w-full max-w-5xl grow pb-10">
      {/* Background Ambience */}
      <div
        aria-hidden
        className="absolute inset-0 isolate contain-strict -z-10 opacity-60 pointer-events-none"
      >
        <div className="-rotate-45 bg-[radial-gradient(68.54%_68.72%_at_55.02%_31.46%,--theme(--color-foreground/.06)_0,hsla(0,0%,55%,.02)_50%,--theme(--color-foreground/.01)_80%)] absolute top-0 left-0 h-320 w-140 -translate-y-87.5 rounded-full" />
        <div className="-rotate-45 bg-[radial-gradient(50%_50%_at_50%_50%,--theme(--color-foreground/.04)_0,--theme(--color-foreground/.01)_80%,transparent_100%)] absolute top-0 left-0 h-320 w-60 [translate:5%_-50%] rounded-full" />
      </div>

      {/* Header */}
      <div className="space-y-1.5 px-4 py-6 border-b border-border/60 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground flex items-center gap-2.5">
            <Bookmark className="w-6 h-6 text-primary fill-primary" />
            <span>Saved Reviews</span>
          </h1>
          <p className="text-muted-foreground text-xs sm:text-sm mt-0.5">
            {savedPosts.length > 0
              ? `You have ${savedPosts.length} bookmarked review${savedPosts.length > 1 ? 's' : ''} in your personal library.`
              : 'Your saved reviews and bookmarked discussions appear here.'}
          </p>
        </div>

        <button
          onClick={() => navigate('/feed')}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-primary text-primary-foreground font-semibold text-xs hover:bg-primary/90 transition-all cursor-pointer border-none shadow-2xs self-start sm:self-auto"
        >
          <BookOpen className="w-3.5 h-3.5" />
          <span>Explore Feed</span>
        </button>
      </div>

      {/* Content: Empty State vs Saved Cards Grid */}
      {savedPosts.length === 0 ? (
        <div className="flex flex-col items-center justify-center p-12 text-center my-10 rounded-2xl border border-dashed border-border/80 bg-card/40 max-w-lg mx-auto">
          <div className="w-14 h-14 rounded-2xl bg-primary/10 text-primary flex items-center justify-center mb-4 ring-8 ring-primary/5">
            <Bookmark className="w-7 h-7" />
          </div>
          <h3 className="text-base sm:text-lg font-bold text-foreground mb-1.5">No saved reviews yet</h3>
          <p className="text-xs sm:text-sm text-muted-foreground max-w-sm mb-6 leading-relaxed">
            Whenever you discover inspiring reviews, books, or film critiques in the community feed, tap the bookmark icon to save them to your library.
          </p>
          <button
            onClick={() => navigate('/feed')}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-primary text-primary-foreground font-semibold text-xs hover:bg-primary/90 transition-all cursor-pointer border-none shadow-sm"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Browse Community Feed</span>
          </button>
        </div>
      ) : (
        <div className="grid p-4 md:grid-cols-2 lg:grid-cols-3 z-10 gap-4 sm:gap-5">
          {savedPosts.map((blog) => {
            const coverImage =
              blog.mentions && blog.mentions[0]?.cover_url
                ? blog.mentions[0].cover_url
                : 'https://cdn.21st.dev/assets/mirror/f2/f2b2a055966c6c1681569e43db628e02b5f32ce532c436bd05b2889a78914819.jpg';

            const wordCount = (blog.content_plain || '').trim().split(/\s+/).filter(Boolean).length;
            const readTime = `${Math.max(1, Math.ceil(wordCount / 180))} min read`;

            return (
              <div
                key={blog.id}
                onClick={() => setSelectedPost(blog)}
                className="group hover:bg-muted/50 active:bg-muted/80 flex flex-col justify-between gap-2.5 rounded-xl p-3 duration-150 border border-border/60 hover:border-border transition-all cursor-pointer bg-card shadow-2xs relative"
              >
                <div className="space-y-2.5">
                  <div className="relative overflow-hidden rounded-lg">
                    <LazyImage
                      src={coverImage}
                      fallback="https://cdn.21st.dev/assets/mirror/cc/ccf6e78beb7f7cc5b720069cb4f86696912be109614973d49df165d1e51631c8.svg"
                      inView={true}
                      alt={blog.title || 'Review cover'}
                      ratio={16 / 9}
                      className="transition-all duration-500 group-hover:scale-105"
                    />

                    {/* Unsave Button */}
                    <button
                      type="button"
                      onClick={(e) => handleUnsave(e, blog.id)}
                      className="absolute top-2 right-2 p-1.5 rounded-lg bg-black/60 hover:bg-rose-500 text-white backdrop-blur-md opacity-0 group-hover:opacity-100 transition-all cursor-pointer border-none"
                      title="Remove from saved"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <div className="space-y-1.5 px-1">
                    <div className="text-muted-foreground flex items-center gap-1.5 text-[11px] font-mono">
                      <span className="truncate max-w-[120px]">by {blog.author_name}</span>
                      <span className="inline-block w-1 h-1 rounded-full bg-muted-foreground/60" />
                      <span>{readTime}</span>
                    </div>

                    <h2 className="line-clamp-2 text-sm sm:text-base leading-snug font-semibold tracking-tight text-foreground group-hover:text-primary transition-colors">
                      {blog.title || 'Book & Movie Review'}
                    </h2>

                    <p className="text-muted-foreground line-clamp-2 text-xs leading-relaxed">
                      {blog.content_plain}
                    </p>
                  </div>
                </div>

                {/* Card Footer with AvatarCircles & Like Stats */}
                <div className="px-1 pt-2 border-t border-border/50 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="flex items-center gap-1 text-xs text-rose-500 font-semibold">
                      <Heart className="w-3.5 h-3.5 fill-current" />
                      <span>{blog.like_count || 0}</span>
                    </span>

                    {(blog.like_count || 0) > 0 && (
                      <AvatarCircles
                        avatarUrls={SAMPLE_LIKER_AVATARS.slice(0, Math.min(3, blog.like_count || 0))}
                        numPeople={(blog.like_count || 0) > 3 ? (blog.like_count || 0) - 3 : undefined}
                      />
                    )}
                  </div>

                  <div className="flex items-center gap-1 text-[11px] text-muted-foreground">
                    <MessageSquare className="w-3 h-3" />
                    <span>{blog.comment_count || (blog.comments?.length || 0)}</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Full Post Modal on Card Click */}
      <PostDetailModal
        post={selectedPost}
        isOpen={Boolean(selectedPost)}
        onClose={() => setSelectedPost(null)}
      />
    </div>
  );
};

export default SavedPosts;
