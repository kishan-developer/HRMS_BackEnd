import mongoose, { Document, Schema } from 'mongoose';

// Notification Category for Settings
export enum NotificationSettingCategory {
  ATTENDANCE = 'Attendance',
  LEAVE = 'Leave',
  PAYROLL = 'Payroll',
  HR = 'HR',
  GENERAL = 'General',
}

// Notification Rule Interface
export interface INotificationRule {
  ruleId: string;
  name: string;
  description: string;
  enabled: boolean;
  channels: string[];
  schedule?: {
    time?: string;
    timezone?: string;
  };
  conditions?: {
    departmentIds?: string[];
    roleIds?: string[];
    employeeIds?: string[];
  };
}

// Attendance Notification Settings
export interface IAttendanceSettings {
  checkInReminder: {
    enabled: boolean;
    time: string;
    channels: string[];
  };
  checkOutReminder: {
    enabled: boolean;
    time: string;
    channels: string[];
  };
  lateArrivalAlert: {
    enabled: boolean;
    threshold: number; // minutes
    channels: string[];
  };
  missingPunchAlert: {
    enabled: boolean;
    time: string;
    channels: string[];
  };
  regularizationApproval: {
    enabled: boolean;
    channels: string[];
  };
  regularizationRejection: {
    enabled: boolean;
    channels: string[];
  };
}

// Leave Notification Settings
export interface ILeaveSettings {
  leaveRequestSubmitted: {
    enabled: boolean;
    channels: string[];
    notifyTo: string[]; // manager, hr, employee
  };
  leaveApproved: {
    enabled: boolean;
    channels: string[];
  };
  leaveRejected: {
    enabled: boolean;
    channels: string[];
  };
  leaveBalanceUpdated: {
    enabled: boolean;
    channels: string[];
  };
  leaveReminder: {
    enabled: boolean;
    daysBefore: number;
    channels: string[];
  };
}

// Payroll Notification Settings
export interface IPayrollSettings {
  payslipGenerated: {
    enabled: boolean;
    channels: string[];
  };
  salaryCredited: {
    enabled: boolean;
    channels: string[];
  };
  reimbursementApproved: {
    enabled: boolean;
    channels: string[];
  };
  loanEMIDeducted: {
    enabled: boolean;
    channels: string[];
  };
  payrollProcessing: {
    enabled: boolean;
    channels: string[];
  };
}

// HR Notification Settings
export interface IHRSettings {
  newPolicyUploaded: {
    enabled: boolean;
    channels: string[];
  };
  documentVerificationPending: {
    enabled: boolean;
    channels: string[];
  };
  birthdayNotification: {
    enabled: boolean;
    channels: string[];
    time: string;
  };
  workAnniversary: {
    enabled: boolean;
    channels: string[];
  };
  holidayAnnouncement: {
    enabled: boolean;
    channels: string[];
    daysBefore: number;
  };
  onboardingReminder: {
    enabled: boolean;
    channels: string[];
  };
}

// Main Notification Settings Interface
export interface INotificationSettings extends Document {
  companyId: string;
  
  // Category-specific settings
  attendance: IAttendanceSettings;
  leave: ILeaveSettings;
  payroll: IPayrollSettings;
  hr: IHRSettings;
  
  // Global settings
  defaultChannels: string[];
  quietHours: {
    enabled: boolean;
    startTime: string;
    endTime: string;
    timezone: string;
  };
  
  // Custom rules
  customRules: INotificationRule[];
  
  // Metadata
  updatedBy: string;
  
  // Timestamps
  createdAt: Date;
  updatedAt: Date;
}

const notificationSettingsSchema = new Schema<INotificationSettings>(
  {
    companyId: {
      type: String,
      unique: true,
    },
    
    // Attendance Settings
    attendance: {
      checkInReminder: {
        enabled: { type: Boolean, default: true },
        time: { type: String, default: '09:30' },
        channels: { type: [String], default: ['In-App', 'Mobile'] },
      },
      checkOutReminder: {
        enabled: { type: Boolean, default: true },
        time: { type: String, default: '18:30' },
        channels: { type: [String], default: ['In-App', 'Mobile'] },
      },
      lateArrivalAlert: {
        enabled: { type: Boolean, default: true },
        threshold: { type: Number, default: 15 },
        channels: { type: [String], default: ['In-App', 'Email'] },
      },
      missingPunchAlert: {
        enabled: { type: Boolean, default: true },
        time: { type: String, default: '19:00' },
        channels: { type: [String], default: ['In-App', 'Email'] },
      },
      regularizationApproval: {
        enabled: { type: Boolean, default: true },
        channels: { type: [String], default: ['In-App', 'Email'] },
      },
      regularizationRejection: {
        enabled: { type: Boolean, default: true },
        channels: { type: [String], default: ['In-App', 'Email'] },
      },
    },
    
    // Leave Settings
    leave: {
      leaveRequestSubmitted: {
        enabled: { type: Boolean, default: true },
        channels: { type: [String], default: ['In-App', 'Email'] },
        notifyTo: { type: [String], default: ['manager', 'hr'] },
      },
      leaveApproved: {
        enabled: { type: Boolean, default: true },
        channels: { type: [String], default: ['In-App', 'Email', 'Mobile'] },
      },
      leaveRejected: {
        enabled: { type: Boolean, default: true },
        channels: { type: [String], default: ['In-App', 'Email', 'Mobile'] },
      },
      leaveBalanceUpdated: {
        enabled: { type: Boolean, default: true },
        channels: { type: [String], default: ['In-App'] },
      },
      leaveReminder: {
        enabled: { type: Boolean, default: false },
        daysBefore: { type: Number, default: 7 },
        channels: { type: [String], default: ['In-App', 'Email'] },
      },
    },
    
    // Payroll Settings
    payroll: {
      payslipGenerated: {
        enabled: { type: Boolean, default: true },
        channels: { type: [String], default: ['In-App', 'Email'] },
      },
      salaryCredited: {
        enabled: { type: Boolean, default: true },
        channels: { type: [String], default: ['In-App', 'Email', 'Mobile', 'SMS'] },
      },
      reimbursementApproved: {
        enabled: { type: Boolean, default: true },
        channels: { type: [String], default: ['In-App', 'Email'] },
      },
      loanEMIDeducted: {
        enabled: { type: Boolean, default: true },
        channels: { type: [String], default: ['In-App', 'Email'] },
      },
      payrollProcessing: {
        enabled: { type: Boolean, default: true },
        channels: { type: [String], default: ['In-App'] },
      },
    },
    
    // HR Settings
    hr: {
      newPolicyUploaded: {
        enabled: { type: Boolean, default: true },
        channels: { type: [String], default: ['In-App', 'Email'] },
      },
      documentVerificationPending: {
        enabled: { type: Boolean, default: true },
        channels: { type: [String], default: ['In-App', 'Email'] },
      },
      birthdayNotification: {
        enabled: { type: Boolean, default: true },
        channels: { type: [String], default: ['In-App', 'Email'] },
        time: { type: String, default: '09:00' },
      },
      workAnniversary: {
        enabled: { type: Boolean, default: true },
        channels: { type: [String], default: ['In-App', 'Email'] },
      },
      holidayAnnouncement: {
        enabled: { type: Boolean, default: true },
        channels: { type: [String], default: ['In-App', 'Email'] },
        daysBefore: { type: Number, default: 7 },
      },
      onboardingReminder: {
        enabled: { type: Boolean, default: true },
        channels: { type: [String], default: ['In-App', 'Email'] },
      },
    },
    
    // Global Settings
    defaultChannels: {
      type: [String],
      default: ['In-App'],
    },
    quietHours: {
      enabled: { type: Boolean, default: false },
      startTime: { type: String, default: '22:00' },
      endTime: { type: String, default: '08:00' },
      timezone: { type: String, default: 'UTC' },
    },
    
    // Custom Rules
    customRules: [{
      ruleId: String,
      name: String,
      description: String,
      enabled: { type: Boolean, default: true },
      channels: [String],
      schedule: {
        time: String,
        timezone: String,
      },
      conditions: {
        departmentIds: [String],
        roleIds: [String],
        employeeIds: [String],
      },
    }],
    
    // Metadata
    updatedBy: {
      type: String,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes for better query performance
notificationSettingsSchema.index({ companyId: 1 }, { unique: true });

export const NotificationSettings = mongoose.model<INotificationSettings>('NotificationSettings', notificationSettingsSchema);
