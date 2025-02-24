import mongoose, { Document, Model, Types } from 'mongoose';

export interface IBook extends Document {
  title: string;
  description?: string;
  thumbnail: string;
  contents: Types.ObjectId[];
  isDraft: boolean;
  isTrash: boolean;
  createdAt: Date;
  updatedAt: Date;
  createdBy: Types.ObjectId;
  tags: string[];
  genre?: string;
  publishedAt?: Date;
  views: number;
  favorites: number;
  ratings: {
    average: number;
    count: number;
  };
}

const BookSchema = new mongoose.Schema<IBook>({
  title: { type: String, required: true },
  description: { type: String },
  thumbnail: { type: String, required: true },
  contents: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Content', required: true }],
  isDraft: { type: Boolean, default: true },
  isTrash: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
  createdBy: { type: mongoose.Schema.Types.ObjectId, required: true },
  tags: { type: [String], default: [] },
  genre: { type: String },
  publishedAt: { type: Date },
  views: { type: Number, default: 0 },
  favorites: { type: Number, default: 0 },
  ratings: {
    average: { type: Number, default: 0 },
    count: { type: Number, default: 0 }
  }
});

const Book: Model<IBook> =
  mongoose.models.Book || mongoose.model<IBook>('Book', BookSchema);

export default Book;
