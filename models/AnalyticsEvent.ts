// Analytics Event model
import mongoose, { Schema, Model } from 'mongoose';
import { AnalyticsEvent as IAnalyticsEvent } from '@/types';

const analyticsEventSchema = new Schema<IAnalyticsEvent>(
  {
    type: {
      type: String,
      required: true,
      index: true,
    },
    payload: {
      type: Schema.Types.Mixed,
      default: {},
    },
    ts: {
      type: Date,
      default: Date.now,
      index: true,
    },
    category: {
      type: String,
      enum: ['visit', 'session', 'payment', 'booking', 'event'],
      index: true,
    },
  },
  {
    timestamps: false,
  }
);

// Prevent model re-compilation during serverless function invocations
const AnalyticsEvent: Model<IAnalyticsEvent> =
  mongoose.models.AnalyticsEvent ||
  mongoose.model<IAnalyticsEvent>('AnalyticsEvent', analyticsEventSchema);

export default AnalyticsEvent;

