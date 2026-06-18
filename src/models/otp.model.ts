import mongoose, { Document, Schema } from 'mongoose';

export interface IOTP extends Document {
  userId?: mongoose.Types.ObjectId;
  type: 'email' | 'sms' | 'password_reset' | 'email_verification' | 'mfa' | 'registration';
  otp: string;
  expiresAt: Date;
  attempts: number;
  isVerified: boolean;
  ipAddress?: string;
  metadata?: any;
  createdAt: Date;
}

const otpSchema = new Schema<IOTP>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: false,
    },
    type: {
      type: String,
      enum: ['email', 'sms', 'password_reset', 'email_verification', 'mfa', 'registration'],
      required: true,
    },
    otp: {
      type: String,
      required: true,
    },
    expiresAt: {
      type: Date,
      required: true,
    },
    attempts: {
      type: Number,
      default: 0,
    },
    isVerified: {
      type: Boolean,
      default: false,
    },
    ipAddress: String,
    metadata: {
      type: Schema.Types.Mixed,
      required: false,
    },
  },
  {
    timestamps: true,
  }
);

otpSchema.index({ userId: 1, type: 1, isVerified: 1 });
otpSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

export const OTP = mongoose.model<IOTP>('OTP', otpSchema);
