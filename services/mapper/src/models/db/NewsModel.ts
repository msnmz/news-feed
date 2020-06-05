import mongoose, { Document } from 'mongoose';
import { IVideo } from './VideoModel';

const Schema = mongoose.Schema;
const { String, ObjectId } = Schema.Types;

export interface INews extends Document {
  [key: string]: any;
  source: {
    id: string;
    name: string;
    description: string;
    url: string;
    category: string;
    language: string;
    country: string;
  };
  author: string;
  title: string;
  description: string;
  url: string;
  urlToImage: string;
  publishedAt: string;
  content: string;
  videos: [IVideo['_id']];
}

const newsSchema = new Schema(
  {
    source: {
      id: { type: String },
      name: { type: String },
      description: { type: String },
      url: { type: String },
      category: { type: String },
      language: { type: String },
      country: { type: String },
    },
    author: { type: String },
    title: { type: String },
    description: { type: String },
    url: { type: String },
    urlToImage: { type: String },
    publishedAt: { type: String },
    content: { type: String },
    videos: [{ type: ObjectId, ref: 'Video' }],
  },
  { timestamps: true },
);

export default mongoose.model<INews>('News', newsSchema);
