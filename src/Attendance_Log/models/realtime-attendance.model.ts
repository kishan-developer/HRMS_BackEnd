import mongoose from "mongoose";

const RealtimeAttendanceSchema = new mongoose.Schema({
  employee_code: {
    type: String,
    required: true,
    index: true
  },
  log_datetime: {
    type: String,
    required: true
  },
  log_time: {
    type: String,
    required: true
  },
  downloaded_at: {
    type: String,
    required: true
  },
  device_sn: {
    type: String,
    required: true,
    index: true
  },
  // Additional fields for internal tracking
  processed: {
    type: Boolean,
    default: false
  },
  syncStatus: {
    type: String,
    enum: ["pending", "synced", "failed"],
    default: "synced"
  },
  // Store parsed date for easier querying
  parsedLogDateTime: {
    type: Date
  },
  // Branch and company for multi-tenant support
  branchId: {
    type: String,
    index: true
  },
  companyId: {
    type: String,
    index: true
  }
}, {
  timestamps: true
});

// Compound index for duplicate prevention
RealtimeAttendanceSchema.index({ employee_code: 1, log_datetime: 1, device_sn: 1 }, { unique: true });
RealtimeAttendanceSchema.index({ companyId: 1, branchId: 1, parsedLogDateTime: -1 });

export default mongoose.model("RealtimeAttendance", RealtimeAttendanceSchema);
