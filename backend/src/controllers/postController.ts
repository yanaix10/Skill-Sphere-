import { Response } from 'express';
import Post, { IPost } from '../models/Post.js';
import PostLike from '../models/PostLike.js';
import { AuthenticatedRequest } from '../middleware/authMiddleware.js';

const MINIMUM_WORD_COUNT = 80;

/**
 * Helper to count words in plain text accurately
 */
export function countWords(text: string): number {
  if (!text) return 0;
  return text
    .trim()
    .replace(/\s+/g, ' ')
    .split(' ')
    .filter(word => word.length > 0).length;
}

/**
 * POST /api/posts
 * Creates a review post. Requires at least 80 words in content_plain.
 */
export async function createPost(req: AuthenticatedRequest, res: Response): Promise<any> {
  try {
    const { content_html, content_plain, mentions } = req.body;

    if (!content_html || typeof content_html !== 'string') {
      return res.status(400).json({ error: 'Missing or invalid content_html' });
    }

    if (!content_plain || typeof content_plain !== 'string') {
      return res.status(400).json({ error: 'Missing or invalid content_plain' });
    }

    // Server-side word count validation
    const words = countWords(content_plain);
    if (words < MINIMUM_WORD_COUNT) {
      return res.status(400).json({
        error: `Review must be at least ${MINIMUM_WORD_COUNT} words long. Current word count: ${words} words.`,
        currentWordCount: words,
        minimumRequired: MINIMUM_WORD_COUNT,
      });
    }

    // Extract user information
    const user = req.user || {};
    const authorId = user.uid || req.body.author_id || 'test-user-123';
    const authorName = user.name || req.body.author_name || user.email?.split('@')[0] || 'SkillSphere Reviewer';
    const authorAvatar = user.picture || req.body.author_avatar || '';

    // Sanitize mentions
    const sanitizedMentions = Array.isArray(mentions)
      ? mentions.map((m: any) => ({
          type: m.type === 'movie' ? 'movie' : 'book',
          external_id: String(m.external_id || ''),
          title: String(m.title || 'Untitled'),
          subtitle: String(m.subtitle || ''),
          cover_url: String(m.cover_url || ''),
          year: String(m.year || ''),
        })).filter(m => Boolean(m.external_id && m.title))
      : [];

    const newPost = new Post({
      author_id: authorId,
      author_name: authorName,
      author_avatar: authorAvatar,
      content_html,
      content_plain,
      like_count: 0,
      mentions: sanitizedMentions,
    });

    await newPost.save();

    return res.status(201).json({
      success: true,
      post: {
        id: String(newPost._id),
        author_id: newPost.author_id,
        author_name: newPost.author_name,
        author_avatar: newPost.author_avatar,
        content_html: newPost.content_html,
        content_plain: newPost.content_plain,
        like_count: newPost.like_count,
        mentions: newPost.mentions,
        created_at: newPost.created_at,
        hasLiked: false,
      }
    });
  } catch (err: any) {
    console.error('[PostController] Error creating post:', err);
    return res.status(500).json({ error: 'Failed to create post' });
  }
}

/**
 * GET /api/feed?sort=recent|popular&page=1&limit=10
 * Returns paginated feed reviews with author, mentions, and like states.
 */
export async function getFeed(req: AuthenticatedRequest, res: Response): Promise<any> {
  try {
    const sort = (req.query.sort as string || 'recent').toLowerCase();
    const page = Math.max(1, parseInt(req.query.page as string || '1', 10));
    const limit = Math.max(1, Math.min(50, parseInt(req.query.limit as string || '10', 10)));
    const skip = (page - 1) * limit;

    const currentUserId = req.user?.uid || (req.query.userId as string) || '';

    // Sort order definition
    const sortOption: Record<string, number> = sort === 'popular'
      ? { like_count: -1, created_at: -1 }
      : { created_at: -1 };

    const total = await Post.countDocuments();
    const rawPosts = await Post.find({})
      .sort(sortOption as any)
      .skip(skip)
      .limit(limit);

    // Check which posts are liked by the current user
    let userLikedPostIds = new Set<string>();
    if (currentUserId && rawPosts.length > 0) {
      const postIds = rawPosts.map((p: any) => String(p._id));
      const likes = await PostLike.find({
        user_id: currentUserId,
        post_id: { $in: postIds } as any
      });
      userLikedPostIds = new Set((likes || []).map((l: any) => String(l.post_id)));
    }

    const posts = rawPosts.map((p: any) => ({
      id: String(p._id),
      author_id: p.author_id,
      author_name: p.author_name,
      author_avatar: p.author_avatar,
      content_html: p.content_html,
      content_plain: p.content_plain,
      like_count: p.like_count || 0,
      mentions: p.mentions || [],
      created_at: p.created_at,
      hasLiked: userLikedPostIds.has(String(p._id)),
    }));

    return res.json({
      posts,
      total,
      page,
      limit,
      hasMore: skip + posts.length < total,
    });
  } catch (err: any) {
    console.error('[PostController] Error fetching feed:', err);
    return res.status(500).json({ error: 'Failed to fetch feed' });
  }
}

/**
 * POST /api/posts/:id/like
 * Idempotent like action
 */
export async function likePost(req: AuthenticatedRequest, res: Response): Promise<any> {
  try {
    const postId = req.params.id;
    const userId = req.user?.uid || req.body.userId || 'test-user-123';

    if (!postId) {
      return res.status(400).json({ error: 'Missing post ID' });
    }

    const post = await Post.findById(postId);
    if (!post) {
      return res.status(404).json({ error: 'Post not found' });
    }

    // Check existing like
    const existing = await PostLike.findOne({ post_id: postId, user_id: userId });
    if (!existing) {
      const newLike = new PostLike({ post_id: postId, user_id: userId });
      await newLike.save();

      post.like_count = (post.like_count || 0) + 1;
      await post.save();
    }

    return res.json({
      success: true,
      like_count: post.like_count,
      hasLiked: true,
    });
  } catch (err: any) {
    console.error('[PostController] Error liking post:', err);
    return res.status(500).json({ error: 'Failed to like post' });
  }
}

/**
 * DELETE /api/posts/:id/like
 * Idempotent unlike action
 */
export async function unlikePost(req: AuthenticatedRequest, res: Response): Promise<any> {
  try {
    const postId = req.params.id;
    const userId = req.user?.uid || req.body.userId || 'test-user-123';

    if (!postId) {
      return res.status(400).json({ error: 'Missing post ID' });
    }

    const post = await Post.findById(postId);
    if (!post) {
      return res.status(404).json({ error: 'Post not found' });
    }

    const existing = await PostLike.findOne({ post_id: postId, user_id: userId });
    if (existing) {
      await PostLike.deleteOne({ post_id: postId, user_id: userId });

      post.like_count = Math.max(0, (post.like_count || 1) - 1);
      await post.save();
    }

    return res.json({
      success: true,
      like_count: post.like_count,
      hasLiked: false,
    });
  } catch (err: any) {
    console.error('[PostController] Error unliking post:', err);
    return res.status(500).json({ error: 'Failed to unlike post' });
  }
}

