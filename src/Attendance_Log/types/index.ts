export interface DeviceConfig {
  ipAddress: string;
  port: number;
  timeout?: number;
  inport?: number;
}

export interface AttendanceLog {
  biometricUserId: number;
  punchTime: Date;
  verifyMode: number;
  deviceId: number;
  branchId: string;
  companyId: string;
  deviceIp: string;
}

export interface SyncConfig {
  deviceConfigs: Array<{
    ipAddress: string;
    port: number;
    deviceId: number;
    branchId: string;
    companyId: string;
  }>;
  apiUrl: string;
  apiToken: string;
  syncInterval: number;
}

export interface AttendanceStats {
  totalDays: number;
  present: number;
  absent: number;
  halfDay: number;
  lateEntry: number;
  earlyExit: number;
  overtime: number;
  totalWorkingHours: number;
}
