import mongoose, { Document, Schema } from 'mongoose';

export interface IBiometricDevice extends Document {
  name: string;
  brand: string;
  deviceModel: string;
  deviceId: string;
  ipAddress: string;
  port: number;
  gateway: string;
  serialNumber: string;
  cloudId?: string;
  location?: string;
  branchId?: string;
  companyId?: string;
  isActive: boolean;
  lastSyncTime?: Date;
  syncInterval: number; // in minutes
  protocol: 'zkteco' | 'realtime' | 'custom';
  connectionStatus: 'connected' | 'disconnected' | 'error';
  lastError?: string;
  createdAt: Date;
  updatedAt: Date;
}

const biometricDeviceSchema = new Schema<IBiometricDevice>(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    brand: {
      type: String,
      required: true,
      trim: true,
    },
    deviceModel: {
      type: String,
      required: true,
      trim: true,
    },
    deviceId: {
      type: String,
      required: true,
      unique: true,
    },
    ipAddress: {
      type: String,
      required: true,
    },
    port: {
      type: Number,
      required: true,
    },
    gateway: {
      type: String,
      required: true,
    },
    serialNumber: {
      type: String,
      required: true,
      unique: true,
    },
    cloudId: {
      type: String,
    },
    location: {
      type: String,
    },
    branchId: {
      type: String,
      ref: 'Branch',
    },
    companyId: {
      type: String,
      ref: 'Company',
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    lastSyncTime: {
      type: Date,
    },
    syncInterval: {
      type: Number,
      default: 30, // 30 minutes
    },
    protocol: {
      type: String,
      enum: ['zkteco', 'realtime', 'custom'],
      default: 'zkteco',
    },
    connectionStatus: {
      type: String,
      enum: ['connected', 'disconnected', 'error'],
      default: 'disconnected',
    },
    lastError: {
      type: String,
    },
  },
  {
    timestamps: true,
  }
);

biometricDeviceSchema.index({ deviceId: 1 });
biometricDeviceSchema.index({ serialNumber: 1 });
biometricDeviceSchema.index({ companyId: 1, isActive: 1 });

export const BiometricDevice = mongoose.model<IBiometricDevice>('BiometricDevice', biometricDeviceSchema);
