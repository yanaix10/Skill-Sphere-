import mongoose, { Schema, Document } from 'mongoose';

export interface IPostMention {
  type: 'book' | 'movie';
  external_id: string;
  title: string;
  subtitle?: string;
  cover_url?: string;
  year?: string;
}

export interface IPostComment {
  _id?: string;
  id?: string;
  author_id: string;
  author_name: string;
  author_avatar?: string;
  text: string;
  created_at: Date;
}

export interface IPost extends Document {
  title: string;
  author_id: string;
  author_name: string;
  author_avatar?: string;
  content_html: string;
  content_plain: string;
  like_count: number;
  comments: IPostComment[];
  comment_count: number;
  mentions: IPostMention[];
  created_at: Date;
  updated_at: Date;
}

const postMentionSchema = new Schema<IPostMention>({
  type: { type: String, enum: ['book', 'movie'], required: true },
  external_id: { type: String, required: true },
  title: { type: String, required: true },
  subtitle: { type: String, default: '' },
  cover_url: { type: String, default: '' },
  year: { type: String, default: '' },
}, { _id: false });

const postCommentSchema = new Schema<IPostComment>({
  author_id: { type: String, required: true },
  author_name: { type: String, required: true },
  author_avatar: { type: String, default: '' },
  text: { type: String, required: true, trim: true },
  created_at: { type: Date, default: Date.now },
});

const postSchema = new Schema<IPost>({
  title: { type: String, default: '', trim: true },
  author_id: { type: String, required: true, index: true },
  author_name: { type: String, required: true },
  author_avatar: { type: String, default: '' },
  content_html: { type: String, required: true },
  content_plain: { type: String, required: true },
  like_count: { type: Number, default: 0, index: true },
  comments: { type: [postCommentSchema], default: [] },
  comment_count: { type: Number, default: 0 },
  mentions: { type: [postMentionSchema], default: [] },
}, {
  timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' }
});

// Indexes for feed querying and sorting
postSchema.index({ created_at: -1 });
postSchema.index({ like_count: -1, created_at: -1 });

const Post = mongoose.model<IPost>('Post', postSchema);
export default Post;


