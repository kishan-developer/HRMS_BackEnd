import mongoose, { Document, Schema } from 'mongoose';

export interface IDevice extends Document {
  userId: mongoose.Types.ObjectId;
  name: string;
  deviceType: string;
  browser: string;
  os: string;
  userAgent: string;
  ipAddress: string;
  location: {
    country?: string;
    city?: string;
  };
  lastUsed: Date;
  isTrusted: boolean;
  isBlocked: boolean;
  createdAt: Date;
}

const deviceSchema = new Schema<IDevice>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    name: {
      type: String,
      required: true,
    },
    deviceType: {
      type: String,
      enum: ['desktop', 'mobile', 'tablet'],
      required: true,
    },
    browser: String,
    os: String,
    userAgent: String,
    ipAddress: String,
    location: {
      country: String,
      city: String,
    },
    lastUsed: {
      type: Date,
      default: Date.now,
    },
    isTrusted: {
      type: Boolean,
      default: false,
    },
    isBlocked: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

deviceSchema.index({ userId: 1, isBlocked: 1 });
deviceSchema.index({ userId: 1, lastUsed: -1 });

export const Device = mongoose.model<IDevice>('Device', deviceSchema);
