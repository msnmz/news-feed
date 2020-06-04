import mongoose, { Document } from 'mongoose';

const Schema = mongoose.Schema;
const { String, Date, Number } = Schema.Types;

export interface IThumbnail extends Document {
  url: string;
  width: number;
  height: number;
}

const thumbnailSchema = new Schema<IThumbnail>({
  url: { type: String },
  width: { type: Number },
  height: { type: Number },
});

export interface IVideo extends Document {
  youtubeId: {
    kind: string;
    videoId: string;
  };
  publishedAt: Date;
  publishedTime: Date;
  channelId: string;
  channelTitle: string;
  title: string;
  description: string;
  thumbnails: {
    default: IThumbnail;
    medium: IThumbnail;
    high: IThumbnail;
  };
}

const videoSchema = new Schema(
  {
    youtubeId: {
      kind: { type: String }, // "youtube#video"
      videoId: { type: String }, //"vHM_xzbHHrY"
    },
    publishedAt: { type: Date },
    publishedTime: { type: Date },
    channelId: { type: String },
    channelTitle: { type: String },
    title: { type: String },
    description: { type: String },
    thumbnails: {
      default: { type: thumbnailSchema },
      medium: { type: thumbnailSchema },
      high: { type: thumbnailSchema },
    },
  },
  { timestamps: true },
);

export default mongoose.model<IVideo>('Video', videoSchema);
