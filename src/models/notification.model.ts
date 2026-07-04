import mongoose, { Document, Schema } from 'mongoose';

// Notification Types
export enum NotificationType {
  GENERAL = 'General',
  ATTENDANCE = 'Attendance',
  LEAVE = 'Leave',
  PAYROLL = 'Payroll',
  HOLIDAY = 'Holiday',
  POLICY = 'Policy',
  MEETING = 'Meeting',
  BIRTHDAY = 'Birthday',
  DOCUMENT = 'Document',
  EMERGENCY = 'Emergency',
}

// Priority Levels
export enum NotificationPriority {
  LOW = 'Low',
  MEDIUM = 'Medium',
  HIGH = 'High',
  URGENT = 'Urgent',
}

// Notification Status
export enum NotificationStatus {
  DRAFT = 'Draft',
  SCHEDULED = 'Scheduled',
  SENT = 'Sent',
  FAILED = 'Failed',
  CANCELLED = 'Cancelled',
}

// Delivery Channels
export enum NotificationChannel {
  IN_APP = 'In-App',
  MOBILE = 'Mobile',
  EMAIL = 'Email',
  SMS = 'SMS',
  WHATSAPP = 'WhatsApp',
}

// Audience Types
export enum AudienceType {
  ALL_EMPLOYEES = 'All Employees',
  DEPARTMENT = 'Department',
  BRANCH = 'Branch',
  ROLE = 'Role',
  SPECIFIC_EMPLOYEES = 'Specific Employees',
  EMPLOYEES_ON_LEAVE = 'Employees on Leave',
  LATE_EMPLOYEES_TODAY = 'Late Employees Today',
  EMPLOYEES_WITH_MISSING_PUNCH = 'Employees with Missing Punch',
  NEW_JOINERS = 'New Joiners',
}

// Action Button Interface
export interface INotificationAction {
  label: string;
  url?: string;
  action?: string;
  style?: 'primary' | 'secondary' | 'danger';
}

// Attachment Interface
export interface INotificationAttachment {
  name: string;
  url: string;
  type: string;
  size: number;
}

// Audience Configuration Interface
export interface INotificationAudience {
  audienceType: AudienceType;
  departmentIds?: string[];
  branchIds?: string[];
  roleIds?: string[];
  employeeIds?: string[];
  filters?: {
    onLeave?: boolean;
    lateToday?: boolean;
    missingPunch?: boolean;
    newJoiners?: boolean;
    joinDateRange?: { start: Date; end: Date };
  };
}

// Schedule Configuration Interface
export interface INotificationSchedule {
  scheduledFor?: Date;
  timezone?: string;
  recurring?: {
    frequency: 'daily' | 'weekly' | 'monthly' | 'yearly';
    endDate?: Date;
  };
}

// Main Notification Interface
export interface INotification extends Document {
  // Basic Information
  title: string;
  message: string;
  type: NotificationType;
  priority: NotificationPriority;
  status: NotificationStatus;
  
  // Audience & Targeting
  audience: INotificationAudience;
  totalRecipients: number;
  
  // Delivery Channels
  channels: NotificationChannel[];
  
  // Scheduling
  schedule?: INotificationSchedule;
  sentAt?: Date;
  
  // Content Enhancement
  attachments?: INotificationAttachment[];
  actionButtons?: INotificationAction[];
  templateId?: string;
  
  // Tracking & Analytics
  readCount: number;
  failedCount: number;
  deliveryStats: {
    inApp: { sent: number; delivered: number; read: number; failed: number };
    mobile: { sent: number; delivered: number; read: number; failed: number };
    email: { sent: number; delivered: number; read: number; failed: number };
    sms: { sent: number; delivered: number; read: number; failed: number };
    whatsapp: { sent: number; delivered: number; read: number; failed: number };
  };
  
  // Creator & Context
  createdBy: string;
  companyId: string;
  
  // Metadata
  metadata?: {
    category?: string;
    tags?: string[];
    relatedEntityId?: string;
    relatedEntityType?: string;
  };
  
  // Timestamps
  createdAt: Date;
  updatedAt: Date;
  deletedAt?: Date;
}


const notificationSchema = new Schema<INotification>(
  {
    // Basic Information
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
    type: {
      type: String,
      enum: Object.values(NotificationType),
    },
    priority: {
      type: String,
      enum: Object.values(NotificationPriority),
      default: NotificationPriority.MEDIUM,
    },
    status: {
      type: String,
      enum: Object.values(NotificationStatus),
      default: NotificationStatus.DRAFT,
    },
    
    // Audience & Targeting
    audience: {
      audienceType: {
        type: String,
        enum: Object.values(AudienceType),
      },
      departmentIds: [String],
      branchIds: [String],
      roleIds: [String],
      employeeIds: [String],
      filters: {
        onLeave: Boolean,
        lateToday: Boolean,
        missingPunch: Boolean,
        newJoiners: Boolean,
        joinDateRange: {
          start: Date,
          end: Date,
        },
      },
    },
    totalRecipients: {
      type: Number,
      default: 0,
    },
    
    // Delivery Channels
    channels: [{
      type: String,
      enum: Object.values(NotificationChannel),
    }],
    
    // Scheduling
    schedule: {
      scheduledFor: Date,
      timezone: {
        type: String,
        default: 'UTC',
      },
      recurring: {
        frequency: {
          type: String,
          enum: ['daily', 'weekly', 'monthly', 'yearly'],
        },
        endDate: Date,
      },
    },
    sentAt: Date,
    
    // Content Enhancement
    attachments: [{
      name: String,
      url: String,
      type: String,
      size: Number,
    }],
    actionButtons: [{
      label: String,
      url: String,
      action: String,
      style: {
        type: String,
        enum: ['primary', 'secondary', 'danger'],
      },
    }],
    templateId: {
      type: Schema.Types.ObjectId,
      ref: 'NotificationTemplate',
    },
    
    // Tracking & Analytics
    readCount: {
      type: Number,
      default: 0,
    },
    failedCount: {
      type: Number,
      default: 0,
    },
    deliveryStats: {
      inApp: {
        sent: { type: Number, default: 0 },
        delivered: { type: Number, default: 0 },
        read: { type: Number, default: 0 },
        failed: { type: Number, default: 0 },
      },
      mobile: {
        sent: { type: Number, default: 0 },
        delivered: { type: Number, default: 0 },
        read: { type: Number, default: 0 },
        failed: { type: Number, default: 0 },
      },
      email: {
        sent: { type: Number, default: 0 },
        delivered: { type: Number, default: 0 },
        read: { type: Number, default: 0 },
        failed: { type: Number, default: 0 },
      },
      sms: {
        sent: { type: Number, default: 0 },
        delivered: { type: Number, default: 0 },
        read: { type: Number, default: 0 },
        failed: { type: Number, default: 0 },
      },
      whatsapp: {
        sent: { type: Number, default: 0 },
        delivered: { type: Number, default: 0 },
        read: { type: Number, default: 0 },
        failed: { type: Number, default: 0 },
      },
    },
    
    // Creator & Context
    createdBy: {
      type: String,
    },
    companyId: {
      type: String,
    },
    
    // Metadata
    metadata: {
      category: String,
      tags: [String],
      relatedEntityId: String,
      relatedEntityType: String,
    },
    
    // Soft Delete
    deletedAt: Date,
  },
  {
    timestamps: true,
  }
);

// Indexes for better query performance
notificationSchema.index({ companyId: 1, status: 1 });
notificationSchema.index({ createdBy: 1, createdAt: -1 });
notificationSchema.index({ 'schedule.scheduledFor': 1, status: 1 });
notificationSchema.index({ type: 1, priority: 1 });
notificationSchema.index({ deletedAt: 1 });

export const Notification = mongoose.model<INotification>('Notification', notificationSchema);
