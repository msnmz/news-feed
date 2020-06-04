import mongoose, { Document } from 'mongoose';
import { ISource } from './SourceModel';

const Schema = mongoose.Schema;
const { ObjectId } = Schema.Types;

export interface IPublishedSource extends Document {
  sourceId: ISource['_id'];
  expireAt: Date;
}

const publishedSchema = new Schema(
  {
    sourceId: { type: ObjectId, ref: 'Source' },
    expireAt: { type: Date, default: Date.now(), index: { expires: '5m' } },
  },
  { timestamps: true },
);

export default mongoose.model<IPublishedSource>('PublishedSource', publishedSchema);
