import mongoose, { Document } from 'mongoose';

const Schema = mongoose.Schema;
const { String, Number } = Schema.Types;

export interface ISource extends Document {
  id: string;
  name: string;
  description: string;
  url: string;
  category: string;
  language: string;
  country: string;
  seqNum: number;
}

const sourceSchema = new Schema(
  {
    id: { type: String },
    name: { type: String },
    description: { type: String },
    url: { type: String },
    category: { type: String },
    language: { type: String },
    country: { type: String },
    seqNum: { type: Number, default: 0 },
  },
  { id: false, timestamps: true },
);

export default mongoose.model<ISource>('Source', sourceSchema);
