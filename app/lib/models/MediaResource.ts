// models/MediaResource.ts
import mongoose, { Schema, Document } from 'mongoose';

export interface IMediaResource extends Document {
  name: string;
  url: string;
  description?: string;
  category: 'video' | 'image' | 'audio' | 'other';
  isPinned: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const MediaResourceSchema = new Schema<IMediaResource>(
  {
    name:        { type: String, required: true, trim: true, maxlength: 120 },
    url:         { type: String, required: true, trim: true },
    description: { type: String, trim: true, maxlength: 300 },
    category:    { type: String, enum: ['video', 'image', 'audio', 'other'], default: 'other' },
    isPinned:    { type: Boolean, default: false },
  },
  { timestamps: true }
);

export const MediaResource =
  mongoose.models.MediaResource ?? mongoose.model<IMediaResource>('MediaResource', MediaResourceSchema);