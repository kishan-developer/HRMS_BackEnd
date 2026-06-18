import mongoose from "mongoose";

const AttendanceSchema = new mongoose.Schema({
  employeeId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "AttendanceEmployee",
    required: true,
    index: true
  },
  biometricUserId: {
    type: Number,
    required: true,
    index: true
  },
  punchTime: {
    type: Date,
    required: true,
    index: true
  },
  verifyMode: {
    type: Number
  },
  deviceId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "AttendanceDevice",
    required: true
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
  source: {
    type: String,
    default: "biometric",
    enum: ["biometric", "manual", "mobile", "gps"]
  },
  punchType: {
    type: String,
    enum: ["IN", "OUT", "UNKNOWN"],
    default: "UNKNOWN"
  },
  processed: {
    type: Boolean,
    default: false
  },
  syncStatus: {
    type: String,
    enum: ["pending", "synced", "failed"],
    default: "synced"
  }
}, {
  timestamps: true
});

AttendanceSchema.index({ companyId: 1, branchId: 1, punchTime: -1 });
AttendanceSchema.index({ biometricUserId: 1, punchTime: 1 }, { unique: true });
AttendanceSchema.index({ employeeId: 1, punchTime: -1 });

export default mongoose.model("AttendanceLog", AttendanceSchema);
