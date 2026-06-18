import mongoose, { Document, Schema } from 'mongoose';

export interface IHoliday extends Document {
  name: string;
  date: Date;
  type: 'public' | 'religious' | 'company';
  year: number;
  createdAt: Date;
  updatedAt: Date;
}

const holidaySchema = new Schema<IHoliday>(
  {
    name: {
      type: String,
      required: true,
    },
    date: {
      type: Date,
      required: true,
    },
    type: {
      type: String,
      required: true,
      enum: ['public', 'religious', 'company'],
    },
    year: {
      type: Number,
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

holidaySchema.index({ date: 1, year: 1 }, { unique: true });

export const Holiday = mongoose.model<IHoliday>('Holiday', holidaySchema);
