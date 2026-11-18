import mongoose, { Schema, Document } from 'mongoose';

export interface IMediaCache extends Document {
  external_id: string;
  type: 'book' | 'movie';
  title: string;
  subtitle: string;
  cover_url: string;
  year: string;
  fetched_at: Date;
}

const mediaCacheSchema = new Schema<IMediaCache>({
  external_id: { type: String, required: true, unique: true, index: true },
  type: { type: String, enum: ['book', 'movie'], required: true, index: true },
  title: { type: String, required: true, index: true },
  subtitle: { type: String, default: '' },
  cover_url: { type: String, default: '' },
  year: { type: String, default: '' },
  fetched_at: { type: Date, default: Date.now, index: true },
});

const MediaCache = mongoose.model<IMediaCache>('MediaCache', mediaCacheSchema);
export default MediaCache;

