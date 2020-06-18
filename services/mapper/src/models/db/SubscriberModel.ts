import mongoose, { Document } from 'mongoose';

const Schema = mongoose.Schema;
const { String, Boolean, Number } = Schema.Types;

export interface ISubscriber extends Document {
  host: string;
  port?: number;
  endpoint: string;
  method: string;
  prod: string;
  active: boolean;
  type?: string;
}

const subscriberSchema = new Schema(
  {
    host: { type: String },
    port: { type: Number },
    endpoint: { type: String },
    method: { type: String, default: 'POST' },
    prod: { type: String, default: 'development' },
    active: { type: Boolean, default: true },
    type: { type: String, enum: ['enhancer', 'client'], default: 'enhancer' },
  },
  { timestamps: true },
);

export default mongoose.model<ISubscriber>('Subscriber', subscriberSchema);
