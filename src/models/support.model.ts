import mongoose, { Schema, Document } from 'mongoose';

// Support Ticket Interface
export interface ISupportTicket extends Document {
  ticketId: string;
  title: string;
  description: string;
  category: 'Technical' | 'HR' | 'Payroll' | 'IT' | 'General';
  priority: 'Low' | 'Medium' | 'High' | 'Urgent';
  status: 'Open' | 'In Progress' | 'Resolved' | 'Closed';
  assignedTo?: string;
  createdBy: string;
  companyId?: string;
  attachments?: string[];
  resolution?: string;
  resolvedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

// Support Request Interface
export interface ISupportRequest extends Document {
  requestId: string;
  subject: string;
  description: string;
  type: 'Information' | 'Service' | 'Complaint' | 'Feedback';
  status: 'Pending' | 'In Review' | 'Completed' | 'Rejected';
  createdBy: string;
  companyId?: string;
  priority: 'Low' | 'Medium' | 'High';
  createdAt: Date;
  updatedAt: Date;
}

// Knowledge Base Article Interface
export interface IKnowledgeBase extends Document {
  articleId: string;
  title: string;
  content: string;
  category: string;
  tags: string[];
  author: string;
  companyId?: string;
  isPublished: boolean;
  views: number;
  helpfulCount: number;
  createdAt: Date;
  updatedAt: Date;
}

// Announcement Interface
export interface IAnnouncement extends Document {
  announcementId: string;
  title: string;
  content: string;
  type: 'General' | 'Urgent' | 'Information' | 'Policy Update';
  targetAudience: 'All' | 'Employees' | 'Managers' | 'HR' | 'Support';
  createdBy: string;
  companyId?: string;
  isPublished: boolean;
  publishDate?: Date;
  expiryDate?: Date;
  attachments?: string[];
  createdAt: Date;
  updatedAt: Date;
}

// Technical Issue Interface
export interface ITechnicalIssue extends Document {
  issueId: string;
  title: string;
  description: string;
  severity: 'Low' | 'Medium' | 'High' | 'Critical';
  status: 'Reported' | 'Investigating' | 'In Progress' | 'Resolved';
  category: string;
  reportedBy: string;
  assignedTo?: string;
  companyId?: string;
  resolution?: string;
  resolvedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

// Live Chat Session Interface
export interface ILiveChat extends Document {
  sessionId: string;
  userId: string;
  agentId?: string;
  status: 'Active' | 'Waiting' | 'Closed';
  messages: {
    sender: 'User' | 'Agent';
    message: string;
    timestamp: Date;
  }[];
  startedAt: Date;
  endedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

// Support Ticket Schema
const SupportTicketSchema: Schema = new Schema(
  {
    ticketId: {
      type: String,
      required: true,
      unique: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      required: true,
    },
    category: {
      type: String,
      enum: ['Technical', 'HR', 'Payroll', 'IT', 'General'],
      required: true,
    },
    priority: {
      type: String,
      enum: ['Low', 'Medium', 'High', 'Urgent'],
      default: 'Medium',
    },
    status: {
      type: String,
      enum: ['Open', 'In Progress', 'Resolved', 'Closed'],
      default: 'Open',
    },
    assignedTo: {
      type: String,
      ref: 'Employee',
    },
    createdBy: {
      type: String,
      required: true,
      ref: 'Employee',
    },
    companyId: {
      type: String,
      ref: 'Company',
    },
    attachments: [String],
    resolution: String,
    resolvedAt: Date,
  },
  {
    timestamps: true,
  }
);

// Support Request Schema
const SupportRequestSchema: Schema = new Schema(
  {
    requestId: {
      type: String,
      required: true,
      unique: true,
    },
    subject: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      required: true,
    },
    type: {
      type: String,
      enum: ['Information', 'Service', 'Complaint', 'Feedback'],
      required: true,
    },
    status: {
      type: String,
      enum: ['Pending', 'In Review', 'Completed', 'Rejected'],
      default: 'Pending',
    },
    createdBy: {
      type: String,
      required: true,
      ref: 'Employee',
    },
    companyId: {
      type: String,
      ref: 'Company',
    },
    priority: {
      type: String,
      enum: ['Low', 'Medium', 'High'],
      default: 'Medium',
    },
  },
  {
    timestamps: true,
  }
);

// Knowledge Base Schema
const KnowledgeBaseSchema: Schema = new Schema(
  {
    articleId: {
      type: String,
      required: true,
      unique: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
    },
    content: {
      type: String,
      required: true,
    },
    category: {
      type: String,
      required: true,
    },
    tags: [String],
    author: {
      type: String,
      required: true,
      ref: 'Employee',
    },
    companyId: {
      type: String,
      ref: 'Company',
    },
    isPublished: {
      type: Boolean,
      default: false,
    },
    views: {
      type: Number,
      default: 0,
    },
    helpfulCount: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  }
);

// Announcement Schema
const AnnouncementSchema: Schema = new Schema(
  {
    announcementId: {
      type: String,
      required: true,
      unique: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
    },
    content: {
      type: String,
      required: true,
    },
    type: {
      type: String,
      enum: ['General', 'Urgent', 'Information', 'Policy Update'],
      default: 'General',
    },
    targetAudience: {
      type: String,
      enum: ['All', 'Employees', 'Managers', 'HR', 'Support'],
      default: 'All',
    },
    createdBy: {
      type: String,
      required: true,
      ref: 'Employee',
    },
    companyId: {
      type: String,
      ref: 'Company',
    },
    isPublished: {
      type: Boolean,
      default: false,
    },
    publishDate: Date,
    expiryDate: Date,
    attachments: [String],
  },
  {
    timestamps: true,
  }
);

// Technical Issue Schema
const TechnicalIssueSchema: Schema = new Schema(
  {
    issueId: {
      type: String,
      required: true,
      unique: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      required: true,
    },
    severity: {
      type: String,
      enum: ['Low', 'Medium', 'High', 'Critical'],
      required: true,
    },
    status: {
      type: String,
      enum: ['Reported', 'Investigating', 'In Progress', 'Resolved'],
      default: 'Reported',
    },
    category: {
      type: String,
      required: true,
    },
    reportedBy: {
      type: String,
      required: true,
      ref: 'Employee',
    },
    assignedTo: {
      type: String,
      ref: 'Employee',
    },
    companyId: {
      type: String,
      ref: 'Company',
    },
    resolution: String,
    resolvedAt: Date,
  },
  {
    timestamps: true,
  }
);

// Live Chat Schema
const LiveChatSchema: Schema = new Schema(
  {
    sessionId: {
      type: String,
      required: true,
      unique: true,
    },
    userId: {
      type: String,
      required: true,
      ref: 'Employee',
    },
    agentId: {
      type: String,
      ref: 'Employee',
    },
    status: {
      type: String,
      enum: ['Active', 'Waiting', 'Closed'],
      default: 'Waiting',
    },
    messages: [
      {
        sender: {
          type: String,
          enum: ['User', 'Agent'],
          required: true,
        },
        message: {
          type: String,
          required: true,
        },
        timestamp: {
          type: Date,
          default: Date.now,
        },
      },
    ],
    startedAt: {
      type: Date,
      default: Date.now,
    },
    endedAt: Date,
  },
  {
    timestamps: true,
  }
);

// Indexes
SupportTicketSchema.index({ status: 1 });
SupportTicketSchema.index({ priority: 1 });
SupportTicketSchema.index({ createdBy: 1 });

SupportRequestSchema.index({ status: 1 });

KnowledgeBaseSchema.index({ category: 1 });
KnowledgeBaseSchema.index({ isPublished: 1 });

AnnouncementSchema.index({ isPublished: 1 });
AnnouncementSchema.index({ targetAudience: 1 });

TechnicalIssueSchema.index({ status: 1 });
TechnicalIssueSchema.index({ severity: 1 });

LiveChatSchema.index({ status: 1 });
LiveChatSchema.index({ userId: 1 });

export const SupportTicket = mongoose.model<ISupportTicket>('SupportTicket', SupportTicketSchema);
export const SupportRequest = mongoose.model<ISupportRequest>('SupportRequest', SupportRequestSchema);
export const KnowledgeBase = mongoose.model<IKnowledgeBase>('KnowledgeBase', KnowledgeBaseSchema);
export const Announcement = mongoose.model<IAnnouncement>('Announcement', AnnouncementSchema);
export const TechnicalIssue = mongoose.model<ITechnicalIssue>('TechnicalIssue', TechnicalIssueSchema);
export const LiveChat = mongoose.model<ILiveChat>('LiveChat', LiveChatSchema);
