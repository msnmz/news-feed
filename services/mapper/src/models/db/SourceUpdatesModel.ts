import mongoose, { Document } from 'mongoose';

const Schema = mongoose.Schema;
const { Boolean } = Schema.Types;

export interface ISourceUpdate extends Document {
  updated: boolean;
  amount: number;
}

const updatedSourceSchema = new Schema(
  {
    updated: { type: Boolean, default: false },
    amount: { type: Number, default: 0 },
  },
  { timestamps: true },
);

export default mongoose.model<ISourceUpdate>('SourceUpdate', updatedSourceSchema);
