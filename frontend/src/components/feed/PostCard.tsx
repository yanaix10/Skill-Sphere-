import React, { useState } from 'react';
import {
  Heart,
  BookOpen,
  Film,
  ExternalLink,
  Share2,
  Check,
} from 'lucide-react';
import { Post, likePost, unlikePost } from '../../services/feedService';

interface PostCardProps {
  post: Post;
  currentUserId?: string;
}

/**
 * Format relative time (e.g. "Just now", "5m ago", "2h ago", "Yesterday")
 */
function formatRelativeTime(dateString: string): string {
  try {
    const date = new Date(dateString);
    const now = new Date();
    const diffSec = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (diffSec < 60) return 'Just now';
    if (diffSec < 3600) return `${Math.floor(diffSec / 60)}m ago`;
    if (diffSec < 86400) return `${Math.floor(diffSec / 3600)}h ago`;
    if (diffSec < 172800) return 'Yesterday';
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
    // Movie
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
  const [copied, setCopied] = useState<boolean>(false);

  // Optimistic like/unlike toggle
  const handleToggleLike = async () => {
    if (isLiking) return;

    const previousLiked = hasLiked;
    const previousCount = likeCount;

    // Apply optimistic update immediately
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
      // Revert on error
      console.warn('[PostCard] Like toggle failed, rolling back:', err);
      setHasLiked(previousLiked);
      setLikeCount(previousCount);
    } finally {
      setIsLiking(false);
    }
  };

  const handleShare = () => {
    const textToCopy = `${post.author_name}'s review on SkillSphere:\n\n${post.content_plain.slice(0, 150)}...\n\nRead more on SkillSphere Feed!`;
    navigator.clipboard?.writeText(textToCopy);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const authorInitial = (post.author_name || 'U').charAt(0).toUpperCase();

  return (
    <article className="w-full bg-card border border-border rounded-2xl p-5 sm:p-6 shadow-sm hover:shadow-md transition-all flex flex-col gap-4 text-card-foreground">
      {/* Post Header: Author + Timestamp */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          {/* Avatar */}
          <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-emerald-500 to-teal-400 flex items-center justify-center font-bold text-sm text-white ring-2 ring-primary/20 shadow-xs shrink-0 overflow-hidden">
            {post.author_avatar ? (
              <img
                src={post.author_avatar}
                alt={post.author_name}
                className="w-full h-full object-cover"
                onError={(e) => { (e.target as HTMLElement).style.display = 'none'; }}
              />
            ) : (
              authorInitial
            )}
          </div>

          <div className="flex flex-col">
            <span className="font-bold text-sm text-foreground leading-tight hover:underline cursor-pointer">
              {post.author_name}
            </span>
            <span className="text-[11px] text-muted-foreground mt-0.5">
              {formatRelativeTime(post.created_at)}
            </span>
          </div>
        </div>

        {/* Share Button */}
        <button
          onClick={handleShare}
          className="p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors cursor-pointer border-none bg-transparent"
          title="Share Review"
        >
          {copied ? <Check className="w-4 h-4 text-emerald-500" /> : <Share2 className="w-4 h-4" />}
        </button>
      </div>

      {/* Rendered Review Text */}
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
                  <div className="w-20 sm:w-24 aspect-[2/3] shrink-0 rounded-lg overflow-hidden bg-muted border border-border/50 shadow-sm relative flex items-center justify-center">
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
                    ) : (
                      isBook ? (
                        <BookOpen className="w-6 h-6 text-muted-foreground opacity-50" />
                      ) : (
                        <Film className="w-6 h-6 text-muted-foreground opacity-50" />
                      )
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
                      <span>{isBook ? 'Open Library' : 'TMDB'}</span>
                      <ExternalLink className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
                    </div>
                  </div>
                </a>
              );
            })}
          </div>
        </div>
      )}

      {/* Post Footer: Like Button with Count */}
      <div className="flex items-center justify-between pt-3 border-t border-border/40 text-xs">
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

        <span className="text-[11px] text-muted-foreground">
          {post.content_plain.trim().split(/\s+/).filter(Boolean).length} words
        </span>
      </div>
    </article>
  );
};

export default PostCard;

