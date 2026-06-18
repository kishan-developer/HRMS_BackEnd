import mongoose, { Document, Schema } from 'mongoose';

export interface IPerformance extends Document {
  employeeId: string;
  cycle: string;
  year: number;
  overallScore: number;
  kpiAchievement: number;
  productivityScore: number;
  attendanceScore: number;
  status: 'High Performer' | 'On Track' | 'Needs Improvement' | 'Low Performer' | 'On Watchlist';
  managerComments?: string;
  warningHistory?: string;
  tags?: string[];
  createdAt: Date;
  updatedAt: Date;
}

const performanceSchema = new Schema<IPerformance>(
  {
    employeeId: {
      type: String,
      required: true,
      ref: 'Employee',
    },
    cycle: {
      type: String,
      required: true,
    },
    year: {
      type: Number,
      required: true,
    },
    overallScore: {
      type: Number,
      required: true,
    },
    kpiAchievement: {
      type: Number,
      required: true,
    },
    productivityScore: {
      type: Number,
      required: true,
    },
    attendanceScore: {
      type: Number,
      required: true,
    },
    status: {
      type: String,
      enum: ['High Performer', 'On Track', 'Needs Improvement', 'Low Performer', 'On Watchlist'],
      default: 'On Track',
    },
    managerComments: {
      type: String,
    },
    warningHistory: {
      type: String,
    },
    tags: {
      type: [String],
    },
  },
  {
    timestamps: true,
  }
);

export const Performance = mongoose.model<IPerformance>('Performance', performanceSchema);
