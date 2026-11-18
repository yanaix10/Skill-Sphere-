import React, { useState, useEffect } from 'react';
import {
  Heart,
  Bookmark,
  MessageSquare,
  BookOpen,
  Film,
  ExternalLink,
  Clock,
  Send,
  Loader2,
} from 'lucide-react';
import { Post, likePost, unlikePost, addComment, PostComment } from '../../services/feedService';
import { isPostSaved, toggleSavePost, SAVED_POSTS_EVENT } from '../../utils/savedPosts';
import AvatarCircles from '../ui/avatar-circles';
import { auth } from '../../firebase';

interface PostCardProps {
  post: Post;
  currentUserId?: string;
}

/**
 * Format full date and time (e.g. "Nov 18, 2026 • 7:15 PM")
 */
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

/**
 * Format relative time for comments (e.g. "Just now", "5m ago", "2h ago")
 */
function formatRelativeTime(dateString: string): string {
  try {
    const date = new Date(dateString);
    const now = new Date();
    const diffSec = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (diffSec < 60) return 'Just now';
    if (diffSec < 3600) return `${Math.floor(diffSec / 60)}m ago`;
    if (diffSec < 86400) return `${Math.floor(diffSec / 3600)}h ago`;
    return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
  } catch {
    return 'Recently';
  }
}

/**
 * Helper to compute external source URL for books and movies
 */
function getSourceUrl(mention: { type: 'book' | 'movie'; external_id: string; title: string }): string {
  if (mention.type === 'book') {
    if (mention.external_id.startsWith('/works/') || mention.external_id.startsWith('/books/')) {
      return `https://openlibrary.org${mention.external_id}`;
    }
    if (mention.external_id.startsWith('gbooks-')) {
      const gId = mention.external_id.replace('gbooks-', '');
      return `https://books.google.com/books?id=${gId}`;
    }
    return `https://openlibrary.org/search?q=${encodeURIComponent(mention.title)}`;
  } else {
    if (mention.external_id.startsWith('tmdb-')) {
      const tmdbId = mention.external_id.replace('tmdb-', '');
      return `https://www.themoviedb.org/movie/${tmdbId}`;
    }
    return `https://www.themoviedb.org/search/movie?query=${encodeURIComponent(mention.title)}`;
  }
}

export const PostCard: React.FC<PostCardProps> = ({ post }) => {
  const [likeCount, setLikeCount] = useState<number>(post.like_count || 0);
  const [hasLiked, setHasLiked] = useState<boolean>(Boolean(post.hasLiked));
  const [isLiking, setIsLiking] = useState<boolean>(false);

  // Saved state
  const [isSaved, setIsSaved] = useState<boolean>(() => isPostSaved(post.id));

  // Comments state
  const [comments, setComments] = useState<PostComment[]>(post.comments || []);
  const [commentCount, setCommentCount] = useState<number>(
    post.comment_count || (post.comments?.length || 0)
  );
  const [showComments, setShowComments] = useState<boolean>(false);
  const [commentInput, setCommentInput] = useState<string>('');
  const [isSubmittingComment, setIsSubmittingComment] = useState<boolean>(false);

  // Sync saved state when other components update saved posts
  useEffect(() => {
    const handleStorageUpdate = () => {
      setIsSaved(isPostSaved(post.id));
    };
    window.addEventListener(SAVED_POSTS_EVENT, handleStorageUpdate);
    window.addEventListener('storage', handleStorageUpdate);
    return () => {
      window.removeEventListener(SAVED_POSTS_EVENT, handleStorageUpdate);
      window.removeEventListener('storage', handleStorageUpdate);
    };
  }, [post.id]);

  // Read time & word count
  const wordCount = (post.content_plain || '').trim().split(/\s+/).filter(Boolean).length;
  const readTimeMinutes = Math.max(1, Math.ceil(wordCount / 180));

  // Optimistic like toggle
  const handleToggleLike = async () => {
    if (isLiking) return;

    const previousLiked = hasLiked;
    const previousCount = likeCount;

    const nextLiked = !hasLiked;
    const nextCount = nextLiked ? previousCount + 1 : Math.max(0, previousCount - 1);

    setHasLiked(nextLiked);
    setLikeCount(nextCount);
    setIsLiking(true);

    try {
      if (nextLiked) {
        const res = await likePost(post.id);
        setLikeCount(res.like_count);
        setHasLiked(res.hasLiked);
      } else {
        const res = await unlikePost(post.id);
        setLikeCount(res.like_count);
        setHasLiked(res.hasLiked);
      }
    } catch (err) {
      console.warn('[PostCard] Like toggle failed, rolling back:', err);
      setHasLiked(previousLiked);
      setLikeCount(previousCount);
    } finally {
      setIsLiking(false);
    }
  };

  // Toggle Save button
  const handleToggleSave = () => {
    const nextState = toggleSavePost(post);
    setIsSaved(nextState);
  };

  // Add Comment
  const handleCommentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentInput.trim() || isSubmittingComment) return;

    const textToSubmit = commentInput.trim();
    setIsSubmittingComment(true);

    try {
      const res = await addComment(post.id, textToSubmit);
      setComments((prev) => [...prev, res.comment]);
      setCommentCount(res.comment_count);
      setCommentInput('');
    } catch (err) {
      console.error('[PostCard] Error adding comment:', err);
    } finally {
      setIsSubmittingComment(false);
    }
  };

  const authorInitial = (post.author_name || 'U').charAt(0).toUpperCase();

  return (
    <article className="w-full bg-card border border-border rounded-2xl p-5 sm:p-6 shadow-xs hover:shadow-md transition-all flex flex-col gap-4 text-card-foreground">
      {/* Post Header: Author, Date & Time, Min Read Time, and Save Button */}
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-3 min-w-0">
          {/* Avatar */}
          <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-emerald-500 to-teal-400 flex items-center justify-center font-bold text-sm text-white ring-2 ring-primary/20 shadow-xs shrink-0 overflow-hidden">
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

          <div className="flex flex-col min-w-0">
            <span className="font-bold text-sm text-foreground leading-tight truncate">
              {post.author_name}
            </span>
            <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground font-mono mt-0.5">
              <span>{formatDateTime(post.created_at)}</span>
              <span>•</span>
              <span className="flex items-center gap-0.5 text-primary font-medium">
                <Clock className="w-3 h-3" />
                {readTimeMinutes} min read
              </span>
            </div>
          </div>
        </div>

        {/* Save to Dashboard Button */}
        <button
          onClick={handleToggleSave}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer border ${
            isSaved
              ? 'bg-primary/10 border-primary/30 text-primary shadow-xs'
              : 'border-border/60 hover:bg-muted text-muted-foreground hover:text-foreground bg-transparent'
          }`}
          title={isSaved ? 'Saved to Dashboard (Click to unsave)' : 'Save to Dashboard'}
        >
          <Bookmark className={`w-3.5 h-3.5 transition-transform ${isSaved ? 'fill-primary' : ''}`} />
          <span>{isSaved ? 'Saved' : 'Save'}</span>
        </button>
      </div>

      {/* Post Title */}
      {post.title ? (
        <h2 className="text-base sm:text-lg font-bold text-foreground tracking-tight leading-snug">
          {post.title}
        </h2>
      ) : (
        <h2 className="text-base sm:text-lg font-bold text-foreground tracking-tight leading-snug">
          Book & Movie Review
        </h2>
      )}

      {/* Rendered Review HTML */}
      <div
        className="prose dark:prose-invert prose-sm max-w-none text-foreground/90 leading-relaxed font-normal space-y-2 break-words"
        dangerouslySetInnerHTML={{ __html: post.content_html }}
      />

      {/* Embedded Media Cards for Mentions */}
      {post.mentions && post.mentions.length > 0 && (
        <div className="flex flex-col gap-3 pt-2 border-t border-border/50">
          <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
            <span>Reviewed Media</span>
          </span>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {post.mentions.map((item, idx) => {
              const sourceUrl = getSourceUrl(item);
              const isBook = item.type === 'book';

              return (
                <a
                  key={`${item.external_id}-${idx}`}
                  href={sourceUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-stretch gap-3 p-3 rounded-xl bg-muted/40 hover:bg-muted/70 border border-border/70 hover:border-border transition-all group no-underline text-card-foreground shadow-xs cursor-pointer"
                >
                  {/* 2:3 Cover Poster Thumbnail */}
                  <div className="w-20 sm:w-24 aspect-[2/3] shrink-0 rounded-lg overflow-hidden bg-muted border border-border/50 shadow-xs relative flex items-center justify-center">
                    {item.cover_url ? (
                      <img
                        src={item.cover_url}
                        alt={item.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        loading="lazy"
                        onError={(e) => {
                          (e.target as HTMLElement).style.display = 'none';
                        }}
                      />
                    ) : isBook ? (
                      <BookOpen className="w-6 h-6 text-muted-foreground opacity-50" />
                    ) : (
                      <Film className="w-6 h-6 text-muted-foreground opacity-50" />
                    )}
                  </div>

                  {/* Media Details */}
                  <div className="flex-1 min-w-0 flex flex-col justify-between py-0.5">
                    <div>
                      {/* Badge */}
                      <div className="flex items-center gap-1.5 mb-1">
                        <span
                          className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider ${
                            isBook
                              ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20'
                              : 'bg-sky-500/10 text-sky-600 dark:text-sky-400 border border-sky-500/20'
                          }`}
                        >
                          {isBook ? <BookOpen className="w-2.5 h-2.5" /> : <Film className="w-2.5 h-2.5" />}
                          <span>{item.type}</span>
                        </span>
                        {item.year && (
                          <span className="text-[10px] text-muted-foreground font-mono">
                            {item.year}
                          </span>
                        )}
                      </div>

                      {/* Title */}
                      <h4 className="font-bold text-xs sm:text-sm text-foreground line-clamp-2 leading-snug group-hover:text-primary transition-colors">
                        {item.title}
                      </h4>

                      {/* Subtitle / Author */}
                      {item.subtitle && (
                        <p className="text-[11px] text-muted-foreground line-clamp-2 mt-1 leading-normal">
                          {item.subtitle}
                        </p>
                      )}
                    </div>

                    {/* Source Link */}
                    <div className="mt-2 flex items-center gap-1 text-[11px] font-semibold text-primary group-hover:underline">
                      <span>{isBook ? 'Open Library' : 'View details'}</span>
                      <ExternalLink className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
                    </div>
                  </div>
                </a>
              );
            })}
          </div>
        </div>
      )}

      {/* Post Actions: Like, Comment, Words & Read time */}
      <div className="flex items-center justify-between pt-3 border-t border-border/50 text-xs">
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Like Button */}
          <button
            onClick={handleToggleLike}
            disabled={isLiking}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl transition-all cursor-pointer border ${
              hasLiked
                ? 'bg-rose-500/10 border-rose-500/30 text-rose-600 dark:text-rose-400 font-bold'
                : 'border-border/60 hover:bg-muted text-muted-foreground hover:text-foreground font-medium'
            }`}
            title={hasLiked ? 'Unlike review' : 'Like review'}
          >
            <Heart
              className={`w-4 h-4 transition-transform ${
                hasLiked ? 'fill-current scale-110' : 'group-hover:scale-110'
              }`}
            />
            <span>{likeCount}</span>
          </button>

          {likeCount > 0 && (
            <AvatarCircles
              avatarUrls={[
                'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=80&h=80&fit=crop&crop=faces',
                'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=80&h=80&fit=crop&crop=faces',
                'https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?w=80&h=80&fit=crop&crop=faces',
              ].slice(0, Math.min(3, likeCount))}
              numPeople={likeCount > 3 ? likeCount - 3 : undefined}
            />
          )}

          {/* Comment Button */}
          <button
            onClick={() => setShowComments((prev) => !prev)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl transition-all cursor-pointer border ${
              showComments
                ? 'bg-primary/10 border-primary/30 text-primary font-bold'
                : 'border-border/60 hover:bg-muted text-muted-foreground hover:text-foreground font-medium'
            }`}
            title="Comments"
          >
            <MessageSquare className="w-4 h-4" />
            <span>{commentCount}</span>
          </button>
        </div>

        {/* Word count & Read time */}
        <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground font-mono">
          <span>{wordCount} words</span>
          <span>•</span>
          <span>{readTimeMinutes} min</span>
        </div>
      </div>

      {/* Expandable Comments Drawer */}
      {showComments && (
        <div className="pt-3 border-t border-border/40 space-y-3 animate-in fade-in duration-200">
          {/* Add Comment Input Form */}
          <form onSubmit={handleCommentSubmit} className="flex items-center gap-2">
            <input
              type="text"
              placeholder="Write a thoughtful comment..."
              value={commentInput}
              onChange={(e) => setCommentInput(e.target.value)}
              className="flex-1 px-3.5 py-2 rounded-xl bg-muted/40 border border-border text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary transition-colors"
            />
            <button
              type="submit"
              disabled={!commentInput.trim() || isSubmittingComment}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-primary text-primary-foreground text-xs font-bold hover:bg-primary/90 transition-all disabled:opacity-50 cursor-pointer border-none shadow-xs"
            >
              {isSubmittingComment ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <>
                  <Send className="w-3.5 h-3.5" />
                  <span>Reply</span>
                </>
              )}
            </button>
          </form>

          {/* Comment List */}
          {comments.length > 0 ? (
            <div className="space-y-2.5 pt-1">
              {comments.map((c, i) => (
                <div
                  key={c.id || i}
                  className="p-3 rounded-xl bg-muted/30 border border-border/50 text-xs flex flex-col gap-1"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-foreground text-[11px]">
                      {c.author_name}
                    </span>
                    <span className="text-[10px] text-muted-foreground font-mono">
                      {formatRelativeTime(c.created_at)}
                    </span>
                  </div>
                  <p className="text-foreground/90 text-xs leading-relaxed break-words">
                    {c.text}
                  </p>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-[11px] text-muted-foreground text-center py-2">
              No comments yet. Start the conversation!
            </p>
          )}
        </div>
      )}
    </article>
  );
};

export default PostCard;
