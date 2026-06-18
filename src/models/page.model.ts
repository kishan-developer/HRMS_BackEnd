import mongoose, { Schema, Document } from 'mongoose';

export interface IPage extends Document {
  pageName: string;
  route: string;
  category?: string;
  icon?: string;
  description?: string;
  createdAt: Date;
  updatedAt: Date;
}

const PageSchema = new Schema<IPage>(
  {
    pageName: {
      type: String,
      required: true,
      unique: true,
    },
    route: {
      type: String,
      required: true,
      unique: true,
    },
    category: {
      type: String,
      default: 'general',
    },
    icon: {
      type: String,
    },
    description: {
      type: String,
      default: '',
    },
  },
  {
    timestamps: true,
  }
);

export default mongoose.model<IPage>('Page', PageSchema);
