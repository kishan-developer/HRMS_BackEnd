import mongoose from "mongoose";

const DeviceSchema = new mongoose.Schema({
  branchId: {
    type: String,
    required: true,
    index: true
  },
  deviceName: {
    type: String,
    required: true
  },
  deviceId: {
    type: Number,
    required: true,
    unique: true
  },
  ipAddress: {
    type: String,
    required: true
  },
  port: {
    type: Number,
    default: 4370
  },
  serialNumber: {
    type: String
  },
  status: {
    type: String,
    enum: ["online", "offline", "error"],
    default: "offline"
  },
  lastSyncAt: {
    type: Date
  },
  companyId: {
    type: String,
    required: true,
    index: true
  },
  location: {
    type: String
  }
}, {
  timestamps: true
});

DeviceSchema.index({ companyId: 1, branchId: 1 });
DeviceSchema.index({ deviceId: 1 });

export default mongoose.model("AttendanceDevice", DeviceSchema);
