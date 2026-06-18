import mongoose from "mongoose";

const DailyAttendanceSchema = new mongoose.Schema({
  employeeId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "AttendanceEmployee",
    required: true,
    index: true
  },
  date: {
    type: Date,
    required: true,
    index: true
  },
  checkIn: {
    type: Date
  },
  checkOut: {
    type: Date
  },
  workingHours: {
    type: Number,
    default: 0
  },
  status: {
    type: String,
    enum: ["present", "absent", "half-day", "late-entry", "early-exit", "overtime"],
    default: "absent"
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
  deviceId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "AttendanceDevice"
  },
  lateMinutes: {
    type: Number,
    default: 0
  },
  earlyExitMinutes: {
    type: Number,
    default: 0
  },
  overtimeMinutes: {
    type: Number,
    default: 0
  },
  shiftId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Shift"
  }
}, {
  timestamps: true
});

DailyAttendanceSchema.index({ companyId: 1, branchId: 1, date: -1 });
DailyAttendanceSchema.index({ employeeId: 1, date: 1 }, { unique: true });

export default mongoose.model("DailyAttendance", DailyAttendanceSchema);
