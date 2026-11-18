import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Bookmark,
  BookOpen,
  Film,
  ExternalLink,
  Heart,
  MessageSquare,
  Clock,
  ArrowRight,
  Trash2,
} from 'lucide-react';
import { Post } from '../../services/feedService';
import { getSavedPosts, unsavePost, SAVED_POSTS_EVENT } from '../../utils/savedPosts';

function formatDateTime(dateString: string): string {
  try {
    const date = new Date(dateString);
    const datePart = date.toLocaleDateString(undefined, {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
    const timePart = date.toLocaleTimeString(undefined, {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });
    return `${datePart} • ${timePart}`;
  } catch {
    return 'Recently';
  }
}

export const DashboardSavedPosts: React.FC = () => {
  const [savedPosts, setSavedPosts] = useState<Post[]>(getSavedPosts);
  const navigate = useNavigate();

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

  const handleUnsave = (postId: string) => {
    unsavePost(postId);
    setSavedPosts(getSavedPosts());
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-10">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-2xl bg-card border border-border shadow-xs">
        <div className="flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
            <Bookmark className="w-5 h-5 fill-primary" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-foreground">Saved Posts & Reviews</h2>
            <p className="text-xs text-muted-foreground mt-0.5">
              Articles and reviews bookmarked from the SkillSphere Feed.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <span className="text-xs font-semibold px-3 py-1 rounded-full bg-muted text-foreground border border-border/80">
            {savedPosts.length} {savedPosts.length === 1 ? 'saved review' : 'saved reviews'}
          </span>
          <button
            onClick={() => navigate('/feed')}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-primary text-primary-foreground text-xs font-bold hover:bg-primary/90 transition-all cursor-pointer border-none shadow-xs"
          >
            <span>Explore Feed</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Empty State */}
      {savedPosts.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 px-4 text-center rounded-2xl border border-dashed border-border bg-card/40">
          <div className="w-14 h-14 rounded-2xl bg-muted/80 flex items-center justify-center text-muted-foreground mb-4">
            <Bookmark className="w-7 h-7 text-primary/70" />
          </div>
          <h3 className="text-base sm:text-lg font-bold text-foreground">No saved posts yet</h3>
          <p className="text-xs text-muted-foreground max-w-md mt-1.5 mb-6 leading-relaxed">
            Every time you click the save button on a review in the Feed, it will be neatly organized here as a card for you to revisit anytime.
          </p>
          <button
            onClick={() => navigate('/feed')}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-primary text-primary-foreground font-bold text-xs hover:bg-primary/90 transition-all cursor-pointer shadow-md"
          >
            <BookOpen className="w-4 h-4" />
            <span>Go to Feed</span>
          </button>
        </div>
      ) : (
        /* Saved Cards Grid */
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {savedPosts.map((post) => {
            const words = (post.content_plain || '').trim().split(/\s+/).filter(Boolean).length;
            const readTime = Math.max(1, Math.ceil(words / 180));
            const authorInitial = (post.author_name || 'U').charAt(0).toUpperCase();

            return (
              <article
                key={post.id}
                className="bg-card border border-border hover:border-primary/40 rounded-2xl p-5 shadow-xs hover:shadow-md transition-all flex flex-col justify-between gap-4 text-card-foreground group"
              >
                {/* Top: Author & Unsave Button */}
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-emerald-500 to-teal-400 flex items-center justify-center font-bold text-xs text-white shrink-0 overflow-hidden">
                      {post.author_avatar ? (
                        <img
                          src={post.author_avatar}
                          alt={post.author_name}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            (e.target as HTMLElement).style.display = 'none';
                          }}
                        />
                      ) : (
                        authorInitial
                      )}
                    </div>
                    <div className="min-w-0">
                      <div className="font-bold text-xs text-foreground truncate">
                        {post.author_name}
                      </div>
                      <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground font-mono mt-0.5">
                        <span>{formatDateTime(post.created_at)}</span>
                        <span>•</span>
                        <span className="flex items-center gap-0.5">
                          <Clock className="w-2.5 h-2.5" />
                          {readTime} min read
                        </span>
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={() => handleUnsave(post.id)}
                    className="p-1.5 rounded-lg text-muted-foreground hover:text-rose-500 hover:bg-rose-500/10 transition-colors cursor-pointer border-none bg-transparent"
                    title="Remove from saved"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>

                {/* Post Title */}
                {post.title ? (
                  <h3 className="font-bold text-sm sm:text-base text-foreground line-clamp-2 leading-snug group-hover:text-primary transition-colors">
                    {post.title}
                  </h3>
                ) : (
                  <h3 className="font-bold text-sm text-foreground line-clamp-2 leading-snug group-hover:text-primary transition-colors">
                    Book & Movie Review
                  </h3>
                )}

                {/* Excerpt */}
                <p className="text-xs text-muted-foreground line-clamp-3 leading-relaxed break-words">
                  {post.content_plain}
                </p>

                {/* Media Embed Thumbnails (if any) */}
                {post.mentions && post.mentions.length > 0 && (
                  <div className="flex items-center gap-2.5 p-2 rounded-xl bg-muted/40 border border-border/60">
                    {post.mentions[0].cover_url ? (
                      <img
                        src={post.mentions[0].cover_url}
                        alt={post.mentions[0].title}
                        className="w-9 h-13 object-cover rounded-md border border-border/40 shrink-0"
                        onError={(e) => {
                          (e.target as HTMLElement).style.display = 'none';
                        }}
                      />
                    ) : (
                      <div className="w-9 h-13 rounded-md bg-muted flex items-center justify-center shrink-0">
                        {post.mentions[0].type === 'book' ? (
                          <BookOpen className="w-4 h-4 text-muted-foreground" />
                        ) : (
                          <Film className="w-4 h-4 text-muted-foreground" />
                        )}
                      </div>
                    )}
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1 text-[9px] font-bold uppercase text-primary">
                        <span>{post.mentions[0].type}</span>
                        {post.mentions[0].year && <span>• {post.mentions[0].year}</span>}
                      </div>
                      <div className="font-semibold text-xs text-foreground truncate mt-0.5">
                        {post.mentions[0].title}
                      </div>
                      {post.mentions[0].subtitle && (
                        <div className="text-[10px] text-muted-foreground truncate">
                          {post.mentions[0].subtitle}
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Footer: Like, Comment, Words */}
                <div className="pt-3 border-t border-border/50 flex items-center justify-between text-xs text-muted-foreground">
                  <div className="flex items-center gap-3">
                    <span className="flex items-center gap-1 font-semibold text-rose-500">
                      <Heart className="w-3.5 h-3.5 fill-current" />
                      <span>{post.like_count || 0}</span>
                    </span>

                    <span className="flex items-center gap-1 font-medium">
                      <MessageSquare className="w-3.5 h-3.5" />
                      <span>{post.comment_count || (post.comments?.length || 0)}</span>
                    </span>
                  </div>

                  <span className="text-[11px] font-mono">
                    {words} words
                  </span>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default DashboardSavedPosts;
