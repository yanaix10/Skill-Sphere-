import React, { useState } from 'react';
import {
  X,
  Heart,
  Bookmark,
  BookOpen,
  Film,
  ExternalLink,
  Clock,
  Send,
  Loader2,
} from 'lucide-react';
import { Post, likePost, unlikePost, addComment, PostComment } from '../../services/feedService';
import { isPostSaved, toggleSavePost } from '../../utils/savedPosts';
import AvatarCircles from '../ui/avatar-circles';

interface PostDetailModalProps {
  post: Post | null;
  isOpen: boolean;
  onClose: () => void;
  onPostUpdated?: (updatedPost: Post) => void;
}

function formatDateTime(dateString: string): string {
  try {
    const date = new Date(dateString);
    return (
      date.toLocaleDateString(undefined, {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      }) +
      ' • ' +
      date.toLocaleTimeString(undefined, {
        hour: 'numeric',
        minute: '2-digit',
        hour12: true,
      })
    );
  } catch {
    return 'Recently';
  }
}

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

function getSourceUrl(mention: { type: 'book' | 'movie'; external_id: string; title: string }): string {
  if (mention.type === 'book') {
    if (mention.external_id.startsWith('/works/') || mention.external_id.startsWith('/books/')) {
      return `https://openlibrary.org${mention.external_id}`;
    }
    if (mention.external_id.startsWith('gbooks-')) {
      return `https://books.google.com/books?id=${mention.external_id.replace('gbooks-', '')}`;
    }
    return `https://openlibrary.org/search?q=${encodeURIComponent(mention.title)}`;
  } else {
    if (mention.external_id.startsWith('tmdb-')) {
      return `https://www.themoviedb.org/movie/${mention.external_id.replace('tmdb-', '')}`;
    }
    return `https://www.themoviedb.org/search/movie?query=${encodeURIComponent(mention.title)}`;
  }
}

export const PostDetailModal: React.FC<PostDetailModalProps> = ({
  post,
  isOpen,
  onClose,
  onPostUpdated,
}) => {
  if (!isOpen || !post) return null;

  const [likeCount, setLikeCount] = useState<number>(post.like_count || 0);
  const [hasLiked, setHasLiked] = useState<boolean>(Boolean(post.hasLiked));
  const [isLiking, setIsLiking] = useState<boolean>(false);
  const [isSaved, setIsSaved] = useState<boolean>(() => isPostSaved(post.id));

  // Comments
  const [comments, setComments] = useState<PostComment[]>(post.comments || []);
  const [commentInput, setCommentInput] = useState<string>('');
  const [isSubmittingComment, setIsSubmittingComment] = useState<boolean>(false);

  const wordCount = (post.content_plain || '').trim().split(/\s+/).filter(Boolean).length;
  const readTimeMinutes = Math.max(1, Math.ceil(wordCount / 180));
  const authorInitial = (post.author_name || 'U').charAt(0).toUpperCase();

  const handleToggleLike = async () => {
    if (isLiking) return;
    const nextLiked = !hasLiked;
    const nextCount = nextLiked ? likeCount + 1 : Math.max(0, likeCount - 1);
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
    } catch {
      setHasLiked(!nextLiked);
      setLikeCount(likeCount);
    } finally {
      setIsLiking(false);
    }
  };

  const handleToggleSave = () => {
    const next = toggleSavePost(post);
    setIsSaved(next);
  };

  const handleCommentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentInput.trim() || isSubmittingComment) return;

    const text = commentInput.trim();
    setIsSubmittingComment(true);

    try {
      const res = await addComment(post.id, text);
      setComments((prev) => [...prev, res.comment]);
      setCommentInput('');
      if (onPostUpdated) {
        onPostUpdated({
          ...post,
          comments: [...comments, res.comment],
          comment_count: res.comment_count,
        });
      }
    } catch (err) {
      console.error('Failed to submit comment:', err);
    } finally {
      setIsSubmittingComment(false);
    }
  };

  // Sample avatar URLs for liker bubbles
  const likerAvatars = [
    'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=80&h=80&fit=crop&crop=faces',
    'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=80&h=80&fit=crop&crop=faces',
    'https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?w=80&h=80&fit=crop&crop=faces',
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-2xl bg-card border border-border rounded-2xl shadow-2xl flex flex-col overflow-hidden max-h-[90vh] text-card-foreground">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border bg-muted/20">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-emerald-500 to-teal-400 flex items-center justify-center font-bold text-xs text-white shrink-0 overflow-hidden ring-1 ring-primary/20">
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
              <div className="font-bold text-sm text-foreground truncate">
                {post.author_name}
              </div>
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

          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={handleToggleSave}
              className={`p-2 rounded-xl transition-colors cursor-pointer border ${
                isSaved
                  ? 'border-primary/30 bg-primary/10 text-primary'
                  : 'border-border/60 hover:bg-muted text-muted-foreground hover:text-foreground'
              }`}
              title={isSaved ? 'Saved to Dashboard' : 'Save post'}
            >
              <Bookmark className={`w-4 h-4 ${isSaved ? 'fill-primary' : ''}`} />
            </button>

            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-xl text-muted-foreground hover:text-foreground hover:bg-muted transition-colors cursor-pointer border-none bg-transparent"
              title="Close"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Scrollable Body */}
        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5">
          {/* Title */}
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground leading-snug">
            {post.title || 'Book & Movie Review'}
          </h1>

          {/* Full Plain/HTML Content Paragraph */}
          <div
            className="prose dark:prose-invert prose-sm sm:prose-base max-w-none text-foreground/90 leading-relaxed font-normal space-y-3 break-words"
            dangerouslySetInnerHTML={{ __html: post.content_html }}
          />

          {/* Attached Media Covers */}
          {post.mentions && post.mentions.length > 0 && (
            <div className="pt-4 border-t border-border/60 space-y-3">
              <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                Reviewed Media
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {post.mentions.map((item, idx) => (
                  <a
                    key={`${item.external_id}-${idx}`}
                    href={getSourceUrl(item)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-stretch gap-3 p-3 rounded-xl bg-muted/40 hover:bg-muted/70 border border-border/70 transition-all group no-underline text-card-foreground shadow-2xs"
                  >
                    <div className="w-16 sm:w-20 aspect-[2/3] shrink-0 rounded-lg overflow-hidden bg-muted border border-border/50 relative flex items-center justify-center">
                      {item.cover_url ? (
                        <img
                          src={item.cover_url}
                          alt={item.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                          loading="lazy"
                          onError={(e) => {
                            (e.target as HTMLElement).style.display = 'none';
                          }}
                        />
                      ) : item.type === 'book' ? (
                        <BookOpen className="w-5 h-5 text-muted-foreground opacity-50" />
                      ) : (
                        <Film className="w-5 h-5 text-muted-foreground opacity-50" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0 flex flex-col justify-between py-0.5">
                      <div>
                        <span className="text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded bg-primary/10 text-primary border border-primary/20">
                          {item.type}
                        </span>
                        <h4 className="font-bold text-xs sm:text-sm text-foreground line-clamp-2 mt-1">
                          {item.title}
                        </h4>
                        {item.subtitle && (
                          <p className="text-[11px] text-muted-foreground line-clamp-1 mt-0.5">
                            {item.subtitle}
                          </p>
                        )}
                      </div>
                      <div className="mt-2 flex items-center gap-1 text-[11px] font-semibold text-primary group-hover:underline">
                        <span>{item.type === 'book' ? 'Open Library' : 'View details'}</span>
                        <ExternalLink className="w-3 h-3" />
                      </div>
                    </div>
                  </a>
                ))}
              </div>
            </div>
          )}

          {/* Likes & AvatarCircles Bar */}
          <div className="pt-4 border-t border-border/60 flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={handleToggleLike}
                disabled={isLiking}
                className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl transition-all cursor-pointer border ${
                  hasLiked
                    ? 'bg-rose-500/10 border-rose-500/30 text-rose-600 dark:text-rose-400 font-bold'
                    : 'border-border/60 hover:bg-muted text-muted-foreground hover:text-foreground font-medium'
                }`}
              >
                <Heart className={`w-4 h-4 ${hasLiked ? 'fill-current scale-110' : ''}`} />
                <span>{likeCount}</span>
              </button>

              {likeCount > 0 && (
                <div className="flex items-center gap-2">
                  <AvatarCircles
                    avatarUrls={likerAvatars.slice(0, Math.min(3, likeCount))}
                    numPeople={likeCount > 3 ? likeCount - 3 : undefined}
                  />
                  <span className="text-[11px] text-muted-foreground font-medium hidden sm:inline">
                    liked by {likeCount === 1 ? '1 student' : `${likeCount} people`}
                  </span>
                </div>
              )}
            </div>

            <span className="text-xs text-muted-foreground font-mono">
              {wordCount} words
            </span>
          </div>

          {/* Comments Thread */}
          <div className="pt-4 border-t border-border/60 space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
              Comments ({comments.length})
            </h3>

            {/* Comment Form */}
            <form onSubmit={handleCommentSubmit} className="flex items-center gap-2">
              <input
                type="text"
                placeholder="Share your thoughts..."
                value={commentInput}
                onChange={(e) => setCommentInput(e.target.value)}
                className="flex-1 px-3.5 py-2 rounded-xl bg-muted/40 border border-border text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary"
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
                    <span>Post</span>
                  </>
                )}
              </button>
            </form>

            {/* Comment List */}
            {comments.length > 0 ? (
              <div className="space-y-2 pt-1">
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
              <p className="text-[11px] text-muted-foreground py-2 text-center">
                No comments yet. Be the first to share your perspective!
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default PostDetailModal;

