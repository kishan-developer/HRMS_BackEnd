import mongoose, { Document, Schema } from 'mongoose';
import { NotificationType, NotificationPriority, NotificationChannel } from './notification.model';

// Template Category
export enum TemplateCategory {
  ATTENDANCE = 'Attendance',
  LEAVE = 'Leave',
  PAYROLL = 'Payroll',
  HR = 'HR',
  GENERAL = 'General',
}

// Template Variable Interface
export interface ITemplateVariable {
  key: string;
  label: string;
  description?: string;
  isRequired: boolean;
  defaultValue?: string;
}

// Template Channel Configuration
export interface ITemplateChannelConfig {
  channel: NotificationChannel;
  enabled: boolean;
  subject?: string; // For email
  template?: string; // Channel-specific template
}

// Notification Template Interface
export interface INotificationTemplate extends Document {
  // Basic Information
  name: string;
  description: string;
  category: TemplateCategory;
  type: NotificationType;
  priority: NotificationPriority;
  
  // Template Content
  title: string;
  message: string;
  variables: ITemplateVariable[];
  
  // Channel Configuration
  channelConfigs: ITemplateChannelConfig[];
  
  // Default Settings
  defaultChannels: NotificationChannel[];
  defaultAudience: string;
  
  // Usage Tracking
  usageCount: number;
  lastUsedAt?: Date;
  
  // Creator & Context
  createdBy: string;
  companyId: string;
  isSystemTemplate: boolean;
  
  // Organization
  tags: string[];
  
  // Timestamps
  createdAt: Date;
  updatedAt: Date;
  deletedAt?: Date;
}

const notificationTemplateSchema = new Schema<INotificationTemplate>(
  {
    // Basic Information
    name: {
      type: String,
      trim: true,
      maxlength: 100,
    },
    description: {
      type: String,
      trim: true,
      maxlength: 500,
    },
    category: {
      type: String,
      enum: Object.values(TemplateCategory),
    },
    type: {
      type: String,
      enum: Object.values(NotificationType),
    },
    priority: {
      type: String,
      enum: Object.values(NotificationPriority),
      default: NotificationPriority.MEDIUM,
    },
    
    // Template Content
    title: {
      type: String,
      trim: true,
      maxlength: 200,
    },
    message: {
      type: String,
      trim: true,
      maxlength: 5000,
    },
    variables: [{
      key: {
        type: String,
        trim: true,
      },
      label: {
        type: String,
        trim: true,
      },
      description: String,
      isRequired: {
        type: Boolean,
        default: false,
      },
      defaultValue: String,
    }],
    
    // Channel Configuration
    channelConfigs: [{
      channel: {
        type: String,
        enum: Object.values(NotificationChannel),
      },
      enabled: {
        type: Boolean,
        default: true,
      },
      subject: String,
      template: String,
    }],
    
    // Default Settings
    defaultChannels: [{
      type: String,
      enum: Object.values(NotificationChannel),
    }],
    defaultAudience: {
      type: String,
      default: 'All Employees',
    },
    
    // Usage Tracking
    usageCount: {
      type: Number,
      default: 0,
    },
    lastUsedAt: Date,
    
    // Creator & Context
    createdBy: {
      type: String,
    },
    companyId: {
      type: String,
    },
    isSystemTemplate: {
      type: Boolean,
      default: false,
    },
    
    // Organization
    tags: [String],
    
    // Soft Delete
    deletedAt: Date,
  },
  {
    timestamps: true,
  }
);

// Indexes for better query performance
notificationTemplateSchema.index({ companyId: 1, category: 1 });
notificationTemplateSchema.index({ createdBy: 1, createdAt: -1 });
notificationTemplateSchema.index({ isSystemTemplate: 1, category: 1 });
notificationTemplateSchema.index({ deletedAt: 1 });

export const NotificationTemplate = mongoose.model<INotificationTemplate>('NotificationTemplate', notificationTemplateSchema);
