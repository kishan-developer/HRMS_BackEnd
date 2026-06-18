import mongoose, { Document, Schema } from 'mongoose';

export interface ILoginHistory extends Document {
  userId: mongoose.Types.ObjectId;
  email: string;
  status: 'success' | 'failed' | 'locked';
  failureReason?: string;
  ipAddress: string;
  deviceInfo: {
    userAgent: string;
    browser: string;
    os: string;
    device: string;
  };
  location: {
    country?: string;
    city?: string;
  };
  sessionId?: mongoose.Types.ObjectId;
  createdAt: Date;
}

const loginHistorySchema = new Schema<ILoginHistory>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    email: {
      type: String,
      required: true,
    },
    status: {
      type: String,
      enum: ['success', 'failed', 'locked'],
      required: true,
    },
    failureReason: String,
    ipAddress: {
      type: String,
      required: true,
    },
    deviceInfo: {
      userAgent: String,
      browser: String,
      os: String,
      device: String,
    },
    location: {
      country: String,
      city: String,
    },
    sessionId: {
      type: Schema.Types.ObjectId,
      ref: 'Session',
    },
  },
  {
    timestamps: true,
  }
);

loginHistorySchema.index({ userId: 1, createdAt: -1 });
loginHistorySchema.index({ email: 1, status: 1, createdAt: -1 });
loginHistorySchema.index({ createdAt: -1 });

export const LoginHistory = mongoose.model<ILoginHistory>('LoginHistory', loginHistorySchema);
