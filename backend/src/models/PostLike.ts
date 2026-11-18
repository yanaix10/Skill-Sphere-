import mongoose, { Schema, Document } from 'mongoose';

export interface IPostLike extends Document {
  post_id: string;
  user_id: string;
  created_at: Date;
}

const postLikeSchema = new Schema<IPostLike>({
  post_id: { type: String, required: true, index: true },
  user_id: { type: String, required: true, index: true },
  created_at: { type: Date, default: Date.now },
});

// Composite unique index so a user can like a post at most once
postLikeSchema.index({ post_id: 1, user_id: 1 }, { unique: true });

const PostLike = mongoose.model<IPostLike>('PostLike', postLikeSchema);
export default PostLike;

