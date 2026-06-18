import mongoose, { Schema, Document } from 'mongoose';

export interface INewJoining extends Document {
  formId: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  dateOfBirth: Date;
  gender: string;
  address: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
  department: string;
  designation: string;
  joiningDate: Date;
  employeeType: string;
  salary: number;
  bankName: string;
  accountNumber: string;
  ifscCode: string;
  education?: string;
  previousExperience?: string;
  emergencyContactName: string;
  emergencyContactPhone: string;
  emergencyContactRelation: string;
  bloodGroup?: string;
  medicalConditions?: string;
  allergies?: string;
  maritalStatus?: string;
  spouseName?: string;
  spousePhone?: string;
  spouseOccupation?: string;
  children?: string;
  fatherName?: string;
  fatherPhone?: string;
  fatherOccupation?: string;
  motherName?: string;
  motherPhone?: string;
  motherOccupation?: string;
  status: 'pending' | 'approved' | 'rejected';
  submittedAt: Date;
  reviewedAt?: Date;
}

const NewJoiningSchema = new Schema<INewJoining>(
  {
    formId: {
      type: String,
      required: true,
      unique: true,
    },
    firstName: {
      type: String,
      required: true,
    },
    lastName: {
      type: String,
      required: true,
    },
    email: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
    },
    phone: {
      type: String,
      required: true,
    },
    dateOfBirth: {
      type: Date,
      required: true,
    },
    gender: {
      type: String,
      required: true,
      enum: ['male', 'female', 'other'],
    },
    address: {
      type: String,
      required: true,
    },
    city: {
      type: String,
      required: true,
    },
    state: {
      type: String,
      required: true,
    },
    postalCode: {
      type: String,
      required: true,
    },
    country: {
      type: String,
      required: true,
    },
    department: {
      type: String,
      required: true,
    },
    designation: {
      type: String,
      required: true,
    },
    joiningDate: {
      type: Date,
      required: true,
    },
    employeeType: {
      type: String,
      required: true,
      enum: ['full-time', 'part-time', 'contract', 'intern'],
    },
    salary: {
      type: Number,
      required: false,
    },
    bankName: {
      type: String,
      required: true,
    },
    accountNumber: {
      type: String,
      required: true,
    },
    ifscCode: {
      type: String,
      required: true,
    },
    education: {
      type: String,
    },
    previousExperience: {
      type: String,
    },
    emergencyContactName: {
      type: String,
      required: true,
    },
    emergencyContactPhone: {
      type: String,
      required: true,
    },
    emergencyContactRelation: {
      type: String,
      required: true,
    },
    bloodGroup: {
      type: String,
    },
    medicalConditions: {
      type: String,
    },
    allergies: {
      type: String,
    },
    maritalStatus: {
      type: String,
    },
    spouseName: {
      type: String,
    },
    spousePhone: {
      type: String,
    },
    spouseOccupation: {
      type: String,
    },
    children: {
      type: String,
    },
    fatherName: {
      type: String,
    },
    fatherPhone: {
      type: String,
    },
    fatherOccupation: {
      type: String,
    },
    motherName: {
      type: String,
    },
    motherPhone: {
      type: String,
    },
    motherOccupation: {
      type: String,
    },
    status: {
      type: String,
      required: true,
      enum: ['pending', 'approved', 'rejected'],
      default: 'pending',
    },
    submittedAt: {
      type: Date,
      default: Date.now,
    },
    reviewedAt: {
      type: Date,
    },
  },
  {
    timestamps: true,
  }
);

const NewJoining = mongoose.model<INewJoining>('NewJoining', NewJoiningSchema);

export default NewJoining;
