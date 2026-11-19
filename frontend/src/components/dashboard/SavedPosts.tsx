import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { LazyImage } from '../ui/lazy-image';
import { AvatarCircles } from '../ui/avatar-circles';
import { Post } from '../../services/feedService';
import { getSavedPosts, unsavePost, SAVED_POSTS_EVENT } from '../../utils/savedPosts';
import PostDetailModal from '../feed/PostDetailModal';
import { Bookmark, Heart, MessageSquare, Trash2, BookOpen } from 'lucide-react';

const SAMPLE_LIKER_AVATARS = [
  'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=80&h=80&fit=crop&crop=faces',
  'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=80&h=80&fit=crop&crop=faces',
  'https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?w=80&h=80&fit=crop&crop=faces',
];

const CURATED_DEFAULT_POSTS: Post[] = [
  {
    id: 'demo-1',
    title: 'Design Systems That Scale',
    author_id: 'ava-1',
    author_name: 'Ava Mitchell',
    content_html: '<p>Learn how to build and maintain scalable design systems that empower teams to move faster while staying consistent across products.</p>',
    content_plain: 'Learn how to build and maintain scalable design systems that empower teams to move faster while staying consistent across products.',
    like_count: 8,
    mentions: [{ type: 'book', external_id: 'ds-1', title: 'Design Systems', cover_url: 'https://cdn.21st.dev/assets/mirror/f2/f2b2a055966c6c1681569e43db628e02b5f32ce532c436bd05b2889a78914819.jpg' }],
    created_at: '2025-08-25',
  },
  {
    id: 'demo-2',
    title: 'The Psychology of Color in UI',
    author_id: 'liam-2',
    author_name: 'Liam Carter',
    content_html: '<p>Explore how different colors influence user perception, emotion, and conversion in digital product design.</p>',
    content_plain: 'Explore how different colors influence user perception, emotion, and conversion in digital product design.',
    like_count: 5,
    mentions: [{ type: 'book', external_id: 'color-2', title: 'Interaction of Color', cover_url: 'https://cdn.21st.dev/assets/mirror/1c/1c9069d4c0e2ec6e906649d4872849733f11e1d5bc9acc77afa11d51300e042f.jpg' }],
    created_at: '2025-07-14',
  },
  {
    id: 'demo-3',
    title: 'Microinteractions That Delight',
    author_id: 'sophia-3',
    author_name: 'Sophia Kim',
    content_html: '<p>Discover how subtle animations and interactions can enhance usability and bring joy to your users.</p>',
    content_plain: 'Discover how subtle animations and interactions can enhance usability and bring joy to your users.',
    like_count: 12,
    mentions: [{ type: 'movie', external_id: 'micro-3', title: 'Subtle Arts', cover_url: 'https://cdn.21st.dev/assets/mirror/02/02f7ddc201e97fad2664c317fa4182a86cd41174d0618f09d41b712cafd243be.jpg' }],
    created_at: '2025-06-30',
  },
  {
    id: 'demo-4',
    title: 'Accessibility Beyond Compliance',
    author_id: 'ethan-4',
    author_name: 'Ethan Rodriguez',
    content_html: '<p>Practical steps to make your UI accessible, not just legally compliant, but genuinely inclusive for everyone.</p>',
    content_plain: 'Practical steps to make your UI accessible, not just legally compliant, but genuinely inclusive for everyone.',
    like_count: 6,
    mentions: [{ type: 'book', external_id: 'a11y-4', title: 'Inclusive Design Patterns', cover_url: 'https://cdn.21st.dev/assets/mirror/ba/ba0e6341e9bf5eefa9dd354dce1cdc4a0ca745a5b6f338b0271000f1b7fc3248.jpg' }],
    created_at: '2025-06-18',
  },
  {
    id: 'demo-5',
    title: 'Dark Mode Done Right',
    author_id: 'maya-5',
    author_name: 'Maya Chen',
    content_html: '<p>Tips and tricks to design beautiful and functional dark mode experiences that users will love.</p>',
    content_plain: 'Tips and tricks to design beautiful and functional dark mode experiences that users will love.',
    like_count: 15,
    mentions: [{ type: 'book', external_id: 'dm-5', title: 'Dark Interfaces', cover_url: 'https://cdn.21st.dev/assets/mirror/c1/c12cf6dc6daca5173fd0bfc4b1562743c92e8f1fb17efa224098180d940ba880.jpg' }],
    created_at: '2025-05-20',
  },
  {
    id: 'demo-6',
    title: 'Typography That Speaks',
    author_id: 'noah-6',
    author_name: 'Noah Patel',
    content_html: '<p>How to select and pair typefaces that enhance readability, hierarchy, and brand personality.</p>',
    content_plain: 'How to select and pair typefaces that enhance readability, hierarchy, and brand personality.',
    like_count: 9,
    mentions: [{ type: 'book', external_id: 'typo-6', title: 'Elements of Typographic Style', cover_url: 'https://cdn.21st.dev/assets/mirror/03/03e08e6b748cd888b6c4bb295b1348148830b5cfc87cce5ecb1ad62b4dd79fb3.jpg' }],
    created_at: '2025-05-02',
  },
];

export const SavedPosts: React.FC = () => {
  const [savedPosts, setSavedPosts] = useState<Post[]>(getSavedPosts);
  const [selectedPost, setSelectedPost] = useState<Post | null>(null);
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

  const handleUnsave = (e: React.MouseEvent, postId: string) => {
    e.stopPropagation();
    unsavePost(postId);
    setSavedPosts(getSavedPosts());
  };

  const displayPosts = savedPosts.length > 0 ? savedPosts : CURATED_DEFAULT_POSTS;

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
              ? `You have ${savedPosts.length} bookmarked reviews in your personal library.`
              : 'Explore curated reviews or bookmark posts in the Feed to build your reading list.'}
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

      {/* 21st.dev Blog Cards Grid */}
      <div className="grid p-4 md:grid-cols-2 lg:grid-cols-3 z-10 gap-4 sm:gap-5">
        {displayPosts.map((blog) => {
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
                  {savedPosts.some((p) => p.id === blog.id) && (
                    <button
                      type="button"
                      onClick={(e) => handleUnsave(e, blog.id)}
                      className="absolute top-2 right-2 p-1.5 rounded-lg bg-black/60 hover:bg-rose-500 text-white backdrop-blur-md opacity-0 group-hover:opacity-100 transition-all cursor-pointer border-none"
                      title="Remove from saved"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
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
