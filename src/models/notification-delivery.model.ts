import mongoose, { Document, Schema } from 'mongoose';
import { NotificationChannel } from './notification.model';

// Delivery Status
export enum DeliveryStatus {
  PENDING = 'Pending',
  SENT = 'Sent',
  DELIVERED = 'Delivered',
  READ = 'Read',
  FAILED = 'Failed',
  BOUNCED = 'Bounced',
  EXPIRED = 'Expired',
}

// Read Status
export enum ReadStatus {
  UNREAD = 'Unread',
  READ = 'Read',
  ARCHIVED = 'Archived',
}

// Delivery Error Interface
export interface IDeliveryError {
  code: string;
  message: string;
  details?: any;
  timestamp: Date;
}

// Channel-specific Delivery Details
export interface IChannelDelivery {
  channel: NotificationChannel;
  status: DeliveryStatus;
  sentAt?: Date;
  deliveredAt?: Date;
  readAt?: Date;
  failedAt?: Date;
  error?: IDeliveryError;
  metadata?: {
    messageId?: string;
    provider?: string;
    cost?: number;
  };
}

// User Notification Delivery Interface
export interface INotificationDelivery extends Document {
  // Reference to notification
  notificationId: string;
  
  // Recipient Information
  userId: string;
  employeeId?: string;
  companyId: string;
  
  // Delivery Status
  overallStatus: DeliveryStatus;
  readStatus: ReadStatus;
  
  // Channel-specific delivery
  channelDeliveries: IChannelDelivery[];
  
  // Read tracking
  readAt?: Date;
  readCount: number;
  
  // Action tracking
  actionClicked?: boolean;
  actionClickedAt?: Date;
  actionUrl?: string;
  
  // Error tracking
  deliveryErrors: IDeliveryError[];
  retryCount: number;
  maxRetries: number;
  
  // Metadata
  deviceInfo?: {
    platform?: string;
    os?: string;
    browser?: string;
  };
  location?: {
    ip?: string;
    city?: string;
    country?: string;
  };
  
  // Timestamps
  createdAt: Date;
  updatedAt: Date;
  deletedAt?: Date;
}

const notificationDeliverySchema = new Schema<INotificationDelivery>(
  {
    // Reference to notification
    notificationId: {
      type: String,
      index: true,
    },
    
    // Recipient Information
    userId: {
      type: String,
      index: true,
    },
    employeeId: {
      type: String,
      index: true,
    },
    companyId: {
      type: String,
      index: true,
    },
    
    // Delivery Status
    overallStatus: {
      type: String,
      enum: Object.values(DeliveryStatus),
      default: DeliveryStatus.PENDING,
    },
    readStatus: {
      type: String,
      enum: Object.values(ReadStatus),
      default: ReadStatus.UNREAD,
    },
    
    // Channel-specific delivery
    channelDeliveries: [{
      channel: {
        type: String,
        enum: Object.values(NotificationChannel),
      },
      status: {
        type: String,
        enum: Object.values(DeliveryStatus),
        default: DeliveryStatus.PENDING,
      },
      sentAt: Date,
      deliveredAt: Date,
      readAt: Date,
      failedAt: Date,
      error: {
        code: String,
        message: String,
        details: Schema.Types.Mixed,
        timestamp: Date,
      },
      metadata: {
        messageId: String,
        provider: String,
        cost: Number,
      },
    }],
    
    // Read tracking
    readAt: Date,
    readCount: {
      type: Number,
      default: 0,
    },
    
    // Action tracking
    actionClicked: {
      type: Boolean,
      default: false,
    },
    actionClickedAt: Date,
    actionUrl: String,
    
    // Error tracking
    deliveryErrors: [{
      code: String,
      message: String,
      details: Schema.Types.Mixed,
      timestamp: {
        type: Date,
        default: Date.now,
      },
    }],
    retryCount: {
      type: Number,
      default: 0,
    },
    maxRetries: {
      type: Number,
      default: 3,
    },
    
    // Metadata
    deviceInfo: {
      platform: String,
      os: String,
      browser: String,
    },
    location: {
      ip: String,
      city: String,
      country: String,
    },
    
    // Soft Delete
    deletedAt: Date,
  },
  {
    timestamps: true,
  }
);

// Indexes for better query performance
notificationDeliverySchema.index({ notificationId: 1, userId: 1 });
notificationDeliverySchema.index({ userId: 1, readStatus: 1, createdAt: -1 });
notificationDeliverySchema.index({ companyId: 1, overallStatus: 1 });
notificationDeliverySchema.index({ notificationId: 1, overallStatus: 1 });
notificationDeliverySchema.index({ employeeId: 1, createdAt: -1 });
notificationDeliverySchema.index({ deletedAt: 1 });

// Compound index for user's unread notifications
notificationDeliverySchema.index({ userId: 1, readStatus: 1, deletedAt: 1 });

export const NotificationDelivery = mongoose.model<INotificationDelivery>('NotificationDelivery', notificationDeliverySchema);
