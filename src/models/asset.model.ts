import mongoose, { Schema, Document } from 'mongoose';

export interface IAsset extends Document {
  name: string;
  code: string;
  companyId: string;
  category: string;
  type: string;
  description?: string;
  serialNumber?: string;
  purchaseDate?: Date;
  purchaseCost?: number;
  currentValue?: number;
  warrantyExpiry?: Date;
  status: 'available' | 'assigned' | 'in_repair' | 'retired' | 'lost';
  location?: string;
  assignedTo?: string;
  assignedDate?: Date;
  departmentId?: string;
  images?: string[];
  specifications?: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
}

const AssetSchema: Schema = new Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    code: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    companyId: {
      type: String,
      required: true,
      ref: 'Company',
    },
    category: {
      type: String,
      required: true,
      enum: ['electronics', 'furniture', 'vehicles', 'machinery', 'software', 'other'],
    },
    type: {
      type: String,
      required: true,
    },
    description: {
      type: String,
      trim: true,
    },
    serialNumber: {
      type: String,
      trim: true,
    },
    purchaseDate: {
      type: Date,
    },
    purchaseCost: {
      type: Number,
    },
    currentValue: {
      type: Number,
    },
    warrantyExpiry: {
      type: Date,
    },
    status: {
      type: String,
      enum: ['available', 'assigned', 'in_repair', 'retired', 'lost'],
      default: 'available',
    },
    location: {
      type: String,
    },
    assignedTo: {
      type: String,
      ref: 'Employee',
    },
    assignedDate: {
      type: Date,
    },
    departmentId: {
      type: String,
      ref: 'Department',
    },
    images: [
      {
        type: String,
      },
    ],
    specifications: {
      type: Schema.Types.Mixed,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes
AssetSchema.index({ companyId: 1 });
AssetSchema.index({ code: 1 });
AssetSchema.index({ status: 1 });
AssetSchema.index({ assignedTo: 1 });
AssetSchema.index({ category: 1 });

export default mongoose.model<IAsset>('Asset', AssetSchema);
