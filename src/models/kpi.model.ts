import mongoose, { Document, Schema } from 'mongoose';

export interface IKPI extends Document {
  employeeId: string;
  title: string;
  description?: string;
  category: string;
  target: number;
  targetUnit?: string;
  currentAchievement: number;
  achievementPercent: number;
  dueDate: Date;
  status: 'Not Started' | 'On Track' | 'At Risk' | 'Achieved' | 'Missed';
  measurementMethod?: string;
  startDate?: Date;
  cycle: string;
  year: number;
  notes?: string;
  attachments?: string[];
  createdAt: Date;
  updatedAt: Date;
}

const kpiSchema = new Schema<IKPI>(
  {
    employeeId: {
      type: String,
      required: true,
      ref: 'Employee',
    },
    title: {
      type: String,
      required: true,
    },
    description: {
      type: String,
    },
    category: {
      type: String,
      required: true,
    },
    target: {
      type: Number,
      required: true,
    },
    targetUnit: {
      type: String,
    },
    currentAchievement: {
      type: Number,
      default: 0,
    },
    achievementPercent: {
      type: Number,
      default: 0,
    },
    dueDate: {
      type: Date,
      required: true,
    },
    status: {
      type: String,
      enum: ['Not Started', 'On Track', 'At Risk', 'Achieved', 'Missed'],
      default: 'Not Started',
    },
    measurementMethod: {
      type: String,
    },
    startDate: {
      type: Date,
    },
    cycle: {
      type: String,
      required: true,
    },
    year: {
      type: Number,
      required: true,
    },
    notes: {
      type: String,
    },
    attachments: {
      type: [String],
    },
  },
  {
    timestamps: true,
  }
);

export const KPI = mongoose.model<IKPI>('KPI', kpiSchema);
