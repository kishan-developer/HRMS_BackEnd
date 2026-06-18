import mongoose from "mongoose";

const EmployeeSchema = new mongoose.Schema({
  employeeCode: {
    type: String,
    required: true,
    unique: true
  },
  name: {
    type: String,
    required: true
  },
  department: {
    type: String
  },
  designation: {
    type: String
  },
  biometricUserId: {
    type: Number,
    required: true,
    index: true
  },
  branchId: {
    type: String,
    required: true,
    index: true
  },
  companyId: {
    type: String,
    required: true,
    index: true
  },
  departmentId: {
    type: String
  },
  active: {
    type: Boolean,
    default: true
  },
  shiftId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Shift"
  }
}, {
  timestamps: true
});

EmployeeSchema.index({ companyId: 1, branchId: 1 });
EmployeeSchema.index({ biometricUserId: 1 });

export default mongoose.model("AttendanceEmployee", EmployeeSchema);
