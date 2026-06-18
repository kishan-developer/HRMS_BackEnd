import mongoose, { Schema, Document } from 'mongoose';

export interface IEmployeeDraft extends Document {
  joiningFormId: mongoose.Types.ObjectId;
  employeeData: {
    // Personal Information
    firstName: string;
    lastName: string;
    fatherName: string;
    motherName: string;
    dateOfBirth: Date;
    gender: string;
    maritalStatus: string;
    bloodGroup?: string;

    // Contact Information
    mobileNumber: string;
    alternativeMobile?: string;
    personalEmail: string;
    officialEmail?: string;
    currentAddress: string;
    permanentAddress: string;

    // Identity Documents
    aadhaarNumber: string;
    panNumber: string;

    // Employment Details
    employeeId?: string;
    departmentId: mongoose.Types.ObjectId;
    designation: string;
    reportingManager?: mongoose.Types.ObjectId;
    joiningDate: Date;
    employmentType: string;

    // Banking Details
    bankName: string;
    accountHolderName: string;
    accountNumber: string;
    ifscCode: string;
    branchName?: string;

    // Emergency Contact
    emergencyContactName: string;
    emergencyRelationship: string;
    emergencyPhoneNumber: string;

    // Education
    highestQualification: string;
    collegeName: string;
    passingYear: string;

    // Previous Employment
    previousEmployment?: {
      companyName?: string;
      designation?: string;
      experience?: string;
      lastSalary?: string;
    };
  };
  uploadedDocuments: {
    passportPhoto?: string;
    resume?: string;
    aadhaarFront?: string;
    aadhaarBack?: string;
    panCard?: string;
    cancelledCheque?: string;
    experienceLetter?: string;
    offerLetter?: string;
    educationalCertificates?: string[];
  };
  status: 'submitted' | 'reviewed' | 'approved' | 'rejected';
  referenceId: string;
  createdAt: Date;
  updatedAt: Date;
}

const employeeDraftSchema = new Schema<IEmployeeDraft>(
  {
    joiningFormId: {
      type: Schema.Types.ObjectId,
      ref: 'JoiningForm',
      required: true,
      unique: true,
    },
    employeeData: {
      // Personal Information
      firstName: { type: String, required: true },
      lastName: { type: String, required: true },
      fatherName: { type: String, required: true },
      motherName: { type: String, required: true },
      dateOfBirth: { type: Date, required: true },
      gender: { type: String, required: true },
      maritalStatus: { type: String, required: true },
      bloodGroup: { type: String },

      // Contact Information
      mobileNumber: { type: String, required: true },
      alternativeMobile: { type: String },
      personalEmail: { type: String, required: true },
      officialEmail: { type: String },
      currentAddress: { type: String, required: true },
      permanentAddress: { type: String, required: true },

      // Identity Documents
      aadhaarNumber: { type: String, required: true },
      panNumber: { type: String, required: true },

      // Employment Details
      employeeId: { type: String },
      departmentId: { type: Schema.Types.ObjectId, ref: 'Department', required: true },
      designation: { type: String, required: true },
      reportingManager: { type: Schema.Types.ObjectId, ref: 'User' },
      joiningDate: { type: Date, required: true },
      employmentType: { type: String, required: true },
    },
    uploadedDocuments: {
      passportPhoto: { type: String },
      resume: { type: String },
      aadhaarFront: { type: String },
      aadhaarBack: { type: String },
      panCard: { type: String },
      cancelledCheque: { type: String },
      experienceLetter: { type: String },
      offerLetter: { type: String },
      educationalCertificates: { type: [String] },
    },
    status: {
      type: String,
      enum: ['submitted', 'reviewed', 'approved', 'rejected'],
      default: 'submitted',
      index: true,
    },
    referenceId: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

export const EmployeeDraft = mongoose.model<IEmployeeDraft>('EmployeeDraft', employeeDraftSchema);
