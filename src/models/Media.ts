// models/Media.ts
import mongoose, { Document, Model, Types } from 'mongoose';

export interface IMedia extends Document {
  uploadedBy: Types.ObjectId;
  mediaType: 'image' | 'video' | 'thumbnail';
  filename: string;
  url: string;
  thumbnailUrl?: string; // Optional: only for video assets
  createdAt: Date;
}

const MediaSchema = new mongoose.Schema<IMedia>({
  uploadedBy: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    ref: 'User', // Adjust reference if your user model is named differently
  },
  mediaType: {
    type: String,
    enum: ['image', 'video', 'thumbnail'],
    required: true,
  },
  filename: {
    type: String,
    required: true,
  },
  url: {
    type: String,
    required: true,
  },
  thumbnailUrl: {
    type: String,
    // This field is optional and can be used to store video thumbnails
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

const Media: Model<IMedia> =
  mongoose.models.Media || mongoose.model<IMedia>('Media', MediaSchema);

export default Media;
