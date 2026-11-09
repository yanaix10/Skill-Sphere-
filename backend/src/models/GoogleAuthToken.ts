import mongoose, { Schema, Document } from 'mongoose';

export interface IGoogleAuthToken extends Document {
  userId: string;
  email?: string;
  accessToken: string;
  refreshToken?: string;
  expiryDate?: number;
  scope?: string;
  createdAt: Date;
  updatedAt: Date;
}

const googleAuthTokenSchema = new Schema<IGoogleAuthToken>({
  userId: { type: String, required: true, unique: true },
  email: { type: String },
  accessToken: { type: String, required: true },
  refreshToken: { type: String },
  expiryDate: { type: Number },
  scope: { type: String },
}, { timestamps: true });

export default mongoose.model<IGoogleAuthToken>('GoogleAuthToken', googleAuthTokenSchema);
