# Realtime T 304F+ Biometric Device Integration Plan

## Executive Summary

This document provides a comprehensive professional development plan for integrating Realtime T 304F+ biometric attendance devices with a custom HRMS backend using Node.js, Express.js, TypeScript, and MongoDB.

---

## 1. Best Architecture for Realtime T 304F+ Integration

### Recommended Architecture: Hybrid Approach

**Primary Method: Cloud Push API with Local LAN Fallback**

```
┌─────────────────┐
│  Realtime T304F+│
│  Biometric Device│
└────────┬────────┘
         │
         │ HTTP Push (Port 80)
         │
    ┌────▼────┐
    │  NGINX  │ (SSL Termination, Load Balancing)
    └────┬────┘
         │
         │ HTTPS
         │
    ┌────▼──────────────────┐
    │  Node.js Express API   │
    │  (Device Push Endpoint)│
    └────┬──────────────────┘
         │
         │
    ┌────▼──────────────────┐
    │  MongoDB Database     │
    │  - RawDeviceLog       │
    │  - AttendanceLog      │
    │  - DeviceSyncStatus   │
    └───────────────────────┘
```

**Why This Architecture:**
- **Cloud Push API**: Realtime devices support HTTP push to configured server URL
- **Real-time Data**: Immediate attendance data transmission
- **Reliability**: Device retries on failure
- **Scalability**: NGINX load balancing for multiple devices
- **Security**: HTTPS encryption for data in transit

### Alternative: Local LAN Sync Service

Use if:
- Network restrictions prevent outbound connections
- Need faster local sync
- Air-gapped environment

---

## 2. Integration Method Selection

### Recommended: Device Server URL Configuration

**Configuration in Device:**
```
Server URL: https://your-api.com/api/v1/biometric/push
Port: 443 (HTTPS)
Push Interval: 30 seconds
Retry Count: 3
```

**Advantages:**
- No SDK required
- Device handles retry logic
- Minimal backend changes
- Real-time data flow

**Not Recommended:**
- SDK (Overkill, vendor lock-in)
- Local LAN only (No remote access)

---

## 3. Device Configuration Steps

### Device Setup Configuration

**Basic Settings:**
```
Machine No: 2
Machine Type: T 304F+
Serial No: RSS20220730466
Server Port No: 80 (Device listening port)
Machine Name: Head Office
Branch Name: HEAD OFFICE
Device Time Zone: UTC+05:30
Mode: In/Out
Access Control: In/Out Only
Auto Synchronization: Enabled
```

**Server URL Configuration:**
```
Primary Server: https://api.yourhrms.com/api/v1/biometric/push
Backup Server: https://api-backup.yourhrms.com/api/v1/biometric/push
Push Interval: 30 seconds
```

**Network Configuration:**
```
IP Address: Static (e.g., 192.168.1.201)
Subnet Mask: 255.255.255.0
Gateway: 192.168.1.1
DNS: 8.8.8.8, 8.8.4.4
```

---

## 4. Backend API Structure

### Folder Structure

```
BackEnd/src/
├── controllers/
│   ├── biometric-device.controller.ts
│   ├── attendance.controller.ts
│   └── device-sync.controller.ts
├── services/
│   ├── biometric-device.service.ts
│   ├── attendance-calculation.service.ts
│   ├── device-sync.service.ts
│   └── user-mapping.service.ts
├── models/
│   ├── attendance-machine.model.ts
│   ├── employee.model.ts
│   ├── device-user.model.ts
│   ├── attendance-log.model.ts
│   ├── raw-device-log.model.ts
│   └── device-sync-status.model.ts
├── routes/
│   └── v1/
│       ├── biometric-devices.routes.ts
│       ├── attendance.routes.ts
│       └── device-sync.routes.ts
├── middleware/
│   ├── device-auth.middleware.ts
│   └── device-validation.middleware.ts
├── validators/
│   ├── biometric-device.validator.ts
│   └── attendance.validator.ts
└── utils/
    ├── attendance-calculator.util.ts
    └── device-parser.util.ts
```

---

## 5. Database Models

### 5.1 AttendanceMachine Model

```typescript
// models/attendance-machine.model.ts
import mongoose, { Document, Schema } from 'mongoose';

export interface IAttendanceMachine extends Document {
  machineNo: string;
  machineType: string;
  serialNumber: string;
  name: string;
  branchName: string;
  ipAddress: string;
  port: number;
  serverUrl: string;
  serverPort: number;
  timezone: string;
  mode: 'IN' | 'OUT' | 'IN_OUT';
  accessControl: 'IN' | 'OUT' | 'IN_OUT';
  autoSyncEnabled: boolean;
  syncInterval: number;
  protocol: 'REALTIME' | 'ZKTECO' | 'COSEC';
  isActive: boolean;
  companyId: mongoose.Types.ObjectId;
  branchId: mongoose.Types.ObjectId;
  lastSyncTime?: Date;
  lastHeartbeat?: Date;
  connectionStatus: 'ONLINE' | 'OFFLINE' | 'ERROR';
  lastError?: string;
  createdAt: Date;
  updatedAt: Date;
}

const attendanceMachineSchema = new Schema<IAttendanceMachine>(
  {
    machineNo: { type: String, required: true, unique: true },
    machineType: { type: String, required: true },
    serialNumber: { type: String, required: true, unique: true },
    name: { type: String, required: true },
    branchName: { type: String, required: true },
    ipAddress: { type: String, required: true },
    port: { type: Number, required: true },
    serverUrl: { type: String, required: true },
    serverPort: { type: Number, required: true },
    timezone: { type: String, required: true, default: 'UTC+05:30' },
    mode: { type: String, enum: ['IN', 'OUT', 'IN_OUT'], default: 'IN_OUT' },
    accessControl: { type: String, enum: ['IN', 'OUT', 'IN_OUT'], default: 'IN_OUT' },
    autoSyncEnabled: { type: Boolean, default: true },
    syncInterval: { type: Number, default: 30 },
    protocol: { type: String, enum: ['REALTIME', 'ZKTECO', 'COSEC'], default: 'REALTIME' },
    isActive: { type: Boolean, default: true },
    companyId: { type: Schema.Types.ObjectId, ref: 'Company', required: true },
    branchId: { type: Schema.Types.ObjectId, ref: 'Branch' },
    lastSyncTime: { type: Date },
    lastHeartbeat: { type: Date },
    connectionStatus: { type: String, enum: ['ONLINE', 'OFFLINE', 'ERROR'], default: 'OFFLINE' },
    lastError: { type: String },
  },
  { timestamps: true }
);

attendanceMachineSchema.index({ serialNumber: 1 });
attendanceMachineSchema.index({ companyId: 1, isActive: 1 });
attendanceMachineSchema.index({ connectionStatus: 1 });

export const AttendanceMachine = mongoose.model<IAttendanceMachine>('AttendanceMachine', attendanceMachineSchema);
```

### 5.2 Employee Model (Updated)

```typescript
// models/employee.model.ts
export interface IEmployee extends Document {
  employeeId: string;
  userId: mongoose.Types.ObjectId;
  companyId: mongoose.Types.ObjectId;
  branchId: mongoose.Types.ObjectId;
  departmentId: mongoose.Types.ObjectId;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  biometricUserId?: number; // Mapped to device user ID
  biometricCardNumber?: string;
  fingerprintTemplate?: string;
  deviceId?: mongoose.Types.ObjectId; // Primary device
  isActive: boolean;
  joiningDate: Date;
  shiftId?: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

// Add to schema
biometricUserId: { type: Number, sparse: true },
biometricCardNumber: { type: String, sparse: true },
fingerprintTemplate: { type: String },
deviceId: { type: Schema.Types.ObjectId, ref: 'AttendanceMachine' },
```

### 5.3 DeviceUser Model

```typescript
// models/device-user.model.ts
export interface IDeviceUser extends Document {
  deviceId: mongoose.Types.ObjectId;
  deviceUserId: number;
  employeeId?: mongoose.Types.ObjectId;
  name: string;
  cardNumber: string;
  pin?: string;
  fingerprintData?: string;
  faceData?: string;
  privilege: number;
  enabled: boolean;
  enrollDate: Date;
  lastSyncDate: Date;
  createdAt: Date;
  updatedAt: Date;
}

const deviceUserSchema = new Schema<IDeviceUser>(
  {
    deviceId: { type: Schema.Types.ObjectId, ref: 'AttendanceMachine', required: true },
    deviceUserId: { type: Number, required: true },
    employeeId: { type: Schema.Types.ObjectId, ref: 'Employee', sparse: true },
    name: { type: String, required: true },
    cardNumber: { type: String, required: true },
    pin: { type: String },
    fingerprintData: { type: String },
    faceData: { type: String },
    privilege: { type: Number, default: 0 },
    enabled: { type: Boolean, default: true },
    enrollDate: { type: Date, default: Date.now },
    lastSyncDate: { type: Date },
  },
  { timestamps: true }
);

deviceUserSchema.index({ deviceId: 1, deviceUserId: 1 }, { unique: true });
deviceUserSchema.index({ employeeId: 1 });
deviceUserSchema.index({ cardNumber: 1 });

export const DeviceUser = mongoose.model<IDeviceUser>('DeviceUser', deviceUserSchema);
```

### 5.4 AttendanceLog Model

```typescript
// models/attendance-log.model.ts
export interface IAttendanceLog extends Document {
  employeeId: mongoose.Types.ObjectId;
  deviceId: mongoose.Types.ObjectId;
  deviceUserId: number;
  punchTime: Date;
  punchType: 'IN' | 'OUT';
  verifyMode: number; // 0=Fingerprint, 1=Card, 2=PIN, 3=Face
  workCode: number;
  processed: boolean;
  isLateEntry: boolean;
  isEarlyExit: boolean;
  isMissingCheckout: boolean;
  shiftId?: mongoose.Types.ObjectId;
  calculatedHours?: number;
  notes?: string;
  rawLogId: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const attendanceLogSchema = new Schema<IAttendanceLog>(
  {
    employeeId: { type: Schema.Types.ObjectId, ref: 'Employee', required: true },
    deviceId: { type: Schema.Types.ObjectId, ref: 'AttendanceMachine', required: true },
    deviceUserId: { type: Number, required: true },
    punchTime: { type: Date, required: true },
    punchType: { type: String, enum: ['IN', 'OUT'], required: true },
    verifyMode: { type: Number, required: true },
    workCode: { type: Number, default: 0 },
    processed: { type: Boolean, default: false },
    isLateEntry: { type: Boolean, default: false },
    isEarlyExit: { type: Boolean, default: false },
    isMissingCheckout: boolean,
    shiftId: { type: Schema.Types.ObjectId, ref: 'Shift' },
    calculatedHours: { type: Number },
    notes: { type: String },
    rawLogId: { type: Schema.Types.ObjectId, ref: 'RawDeviceLog' },
  },
  { timestamps: true }
);

attendanceLogSchema.index({ employeeId: 1, punchTime: -1 });
attendanceLogSchema.index({ deviceId: 1, punchTime: -1 });
attendanceLogSchema.index({ punchTime: 1 });
attendanceLogSchema.index({ processed: 1 });

export const AttendanceLog = mongoose.model<IAttendanceLog>('AttendanceLog', attendanceLogSchema);
```

### 5.5 RawDeviceLog Model

```typescript
// models/raw-device-log.model.ts
export interface IRawDeviceLog extends Document {
  deviceId: mongoose.Types.ObjectId;
  serialNumber: string;
  deviceUserId: number;
  timestamp: Date;
  ioMode: number; // 0=IN, 1=OUT
  verifyMode: number;
  workCode: number;
  rawPayload: object;
  receivedAt: Date;
  processed: boolean;
  error?: string;
  createdAt: Date;
}

const rawDeviceLogSchema = new Schema<IRawDeviceLog>(
  {
    deviceId: { type: Schema.Types.ObjectId, ref: 'AttendanceMachine', required: true },
    serialNumber: { type: String, required: true },
    deviceUserId: { type: Number, required: true },
    timestamp: { type: Date, required: true },
    ioMode: { type: Number, required: true },
    verifyMode: { type: Number, required: true },
    workCode: { type: Number, default: 0 },
    rawPayload: { type: Object, required: true },
    receivedAt: { type: Date, default: Date.now },
    processed: { type: Boolean, default: false },
    error: { type: String },
  },
  { timestamps: true }
);

rawDeviceLogSchema.index({ deviceId: 1, timestamp: -1 });
rawDeviceLogSchema.index({ processed: 1 });
rawDeviceLogSchema.index({ timestamp: 1 });

export const RawDeviceLog = mongoose.model<IRawDeviceLog>('RawDeviceLog', rawDeviceLogSchema);
```

### 5.6 DeviceSyncStatus Model

```typescript
// models/device-sync-status.model.ts
export interface IDeviceSyncStatus extends Document {
  deviceId: mongoose.Types.ObjectId;
  syncType: 'USERS' | 'ATTENDANCE' | 'HEARTBEAT';
  status: 'SUCCESS' | 'FAILED' | 'IN_PROGRESS';
  recordsProcessed: number;
  recordsFailed: number;
  startTime: Date;
  endTime?: Date;
  duration?: number;
  errorMessage?: string;
  lastSyncedLogId?: string;
  createdAt: Date;
}

const deviceSyncStatusSchema = new Schema<IDeviceSyncStatus>(
  {
    deviceId: { type: Schema.Types.ObjectId, ref: 'AttendanceMachine', required: true },
    syncType: { type: String, enum: ['USERS', 'ATTENDANCE', 'HEARTBEAT'], required: true },
    status: { type: String, enum: ['SUCCESS', 'FAILED', 'IN_PROGRESS'], required: true },
    recordsProcessed: { type: Number, default: 0 },
    recordsFailed: { type: Number, default: 0 },
    startTime: { type: Date, required: true },
    endTime: { type: Date },
    duration: { type: Number },
    errorMessage: { type: String },
    lastSyncedLogId: { type: String },
  },
  { timestamps: true }
);

deviceSyncStatusSchema.index({ deviceId: 1, createdAt: -1 });
deviceSyncStatusSchema.index({ status: 1 });

export const DeviceSyncStatus = mongoose.model<IDeviceSyncStatus>('DeviceSyncStatus', deviceSyncStatusSchema);
```

---

## 6. Required Backend APIs

### 6.1 Add/Edit Machine API

**Endpoint:** `POST /api/v1/biometric/machines`
**Method:** POST

**Request Payload:**
```json
{
  "machineNo": "2",
  "machineType": "T 304F+",
  "serialNumber": "RSS20220730466",
  "name": "Head Office",
  "branchName": "HEAD OFFICE",
  "ipAddress": "192.168.1.201",
  "port": 4370,
  "serverUrl": "https://api.yourhrms.com/api/v1/biometric/push",
  "serverPort": 443,
  "timezone": "UTC+05:30",
  "mode": "IN_OUT",
  "accessControl": "IN_OUT",
  "autoSyncEnabled": true,
  "syncInterval": 30,
  "protocol": "REALTIME",
  "companyId": "507f1f77bcf86cd799439011",
  "branchId": "507f1f77bcf86cd799439012"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "_id": "507f1f77bcf86cd799439013",
    "machineNo": "2",
    "serialNumber": "RSS20220730466",
    "connectionStatus": "OFFLINE",
    "createdAt": "2024-01-15T10:30:00.000Z"
  },
  "message": "Machine added successfully"
}
```

### 6.2 Device Registration API

**Endpoint:** `POST /api/v1/biometric/register`
**Method:** POST

**Request Payload:**
```json
{
  "serialNumber": "RSS20220730466",
  "machineNo": "2",
  "registrationKey": "REG_KEY_FROM_DEVICE"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "deviceId": "507f1f77bcf86cd799439013",
    "authToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "pushEndpoint": "https://api.yourhrms.com/api/v1/biometric/push"
  },
  "message": "Device registered successfully"
}
```

### 6.3 Device Heartbeat/Status API

**Endpoint:** `POST /api/v1/biometric/heartbeat`
**Method:** POST

**Request Payload:**
```json
{
  "serialNumber": "RSS20220730466",
  "machineNo": "2",
  "timestamp": "2024-01-15T10:30:00.000Z",
  "status": "ONLINE",
  "memoryUsage": 45,
  "storageUsage": 30
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "acknowledged": true,
    "serverTime": "2024-01-15T10:30:05.000Z",
    "nextSyncIn": 30
  },
  "message": "Heartbeat received"
}
```

### 6.4 Fetch User Enrollment Data API

**Endpoint:** `GET /api/v1/biometric/machines/:id/users`
**Method:** GET

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "deviceUserId": 1,
      "name": "John Doe",
      "cardNumber": "1234567890",
      "pin": "1234",
      "privilege": 0,
      "enabled": true,
      "enrollDate": "2024-01-01T00:00:00.000Z",
      "employeeId": "507f1f77bcf86cd799439014"
    },
    {
      "deviceUserId": 2,
      "name": "Jane Smith",
      "cardNumber": "0987654321",
      "pin": "5678",
      "privilege": 0,
      "enabled": true,
      "enrollDate": "2024-01-01T00:00:00.000Z",
      "employeeId": "507f1f77bcf86cd799439015"
    }
  ],
  "message": "Users retrieved successfully"
}
```

### 6.5 Sync Attendance Logs API (Device Push)

**Endpoint:** `POST /api/v1/biometric/push`
**Method:** POST

**Request Payload:**
```json
{
  "serialNumber": "RSS20220730466",
  "machineNo": "2",
  "timestamp": "2024-01-15T10:30:00.000Z",
  "logs": [
    {
      "deviceUserId": 1,
      "timestamp": "2024-01-15T09:15:00.000Z",
      "ioMode": 0,
      "verifyMode": 1,
      "workCode": 0
    },
    {
      "deviceUserId": 2,
      "timestamp": "2024-01-15T09:20:00.000Z",
      "ioMode": 0,
      "verifyMode": 1,
      "workCode": 0
    }
  ]
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "received": 2,
    "processed": 2,
    "failed": 0,
    "lastSyncTime": "2024-01-15T10:30:00.000Z"
  },
  "message": "Attendance logs synced successfully"
}
```

### 6.6 Manual Sync API

**Endpoint:** `POST /api/v1/biometric/machines/:id/sync`
**Method:** POST

**Response:**
```json
{
  "success": true,
  "data": {
    "syncId": "507f1f77bcf86cd799439016",
    "status": "IN_PROGRESS",
    "startTime": "2024-01-15T10:30:00.000Z"
  },
  "message": "Sync started"
}
```

### 6.7 Attendance Daily Report API

**Endpoint:** `GET /api/v1/attendance/daily?date=2024-01-15&branchId=xxx`
**Method:** GET

**Response:**
```json
{
  "success": true,
  "data": {
    "date": "2024-01-15",
    "totalEmployees": 150,
    "present": 142,
    "absent": 8,
    "lateEntries": 12,
    "earlyExits": 5,
    "records": [
      {
        "employeeId": "507f1f77bcf86cd799439014",
        "employeeName": "John Doe",
        "firstCheckIn": "2024-01-15T09:15:00.000Z",
        "lastCheckOut": "2024-01-15T18:30:00.000Z",
        "workingHours": 9.25,
        "isLateEntry": true,
        "isEarlyExit": false,
        "status": "PRESENT"
      }
    ]
  }
}
```

### 6.8 Attendance Monthly Report API

**Endpoint:** `GET /api/v1/attendance/monthly?month=01&year=2024&employeeId=xxx`
**Method:** GET

**Response:**
```json
{
  "success": true,
  "data": {
    "month": "01",
    "year": 2024,
    "totalDays": 22,
    "presentDays": 20,
    "absentDays": 2,
    "lateEntries": 3,
    "earlyExits": 1,
    "totalWorkingHours": 176,
    "averageWorkingHours": 8.8,
    "dailyRecords": [...]
  }
}
```

### 6.9 Missing Punch Report API

**Endpoint:** `GET /api/v1/attendance/missing-punches?startDate=2024-01-01&endDate=2024-01-31`
**Method:** GET

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "employeeId": "507f1f77bcf86cd799439014",
      "employeeName": "John Doe",
      "date": "2024-01-15",
      "missingType": "CHECKOUT",
      "lastCheckIn": "2024-01-15T09:15:00.000Z"
    }
  ]
}
```

---

## 7. Biometric User ID to Employee ID Mapping

### Mapping Strategy

**Primary Mapping Method: Card Number**

```typescript
// services/user-mapping.service.ts
export class UserMappingService {
  
  /**
   * Map device user ID to employee ID using card number
   */
  async mapDeviceUserToEmployee(deviceUserId: number, cardNumber: string): Promise<string | null> {
    // Method 1: Direct card number match
    const employee = await Employee.findOne({ 
      biometricCardNumber: cardNumber,
      isActive: true 
    });
    
    if (employee) {
      // Update employee's biometric user ID if not set
      if (!employee.biometricUserId) {
        await Employee.findByIdAndUpdate(employee._id, {
          biometricUserId: deviceUserId
        });
      }
      return employee._id.toString();
    }
    
    // Method 2: Device user mapping table
    const deviceUser = await DeviceUser.findOne({ cardNumber });
    if (deviceUser && deviceUser.employeeId) {
      return deviceUser.employeeId.toString();
    }
    
    return null;
  }
  
  /**
   * Bulk sync device users to employees
   */
  async syncDeviceUsers(deviceId: string): Promise<{ matched: number, unmatched: number }> {
    const deviceUsers = await DeviceUser.find({ deviceId });
    let matched = 0;
    let unmatched = 0;
    
    for (const deviceUser of deviceUsers) {
      const employeeId = await this.mapDeviceUserToEmployee(
        deviceUser.deviceUserId,
        deviceUser.cardNumber
      );
      
      if (employeeId) {
        await DeviceUser.findByIdAndUpdate(deviceUser._id, {
          employeeId,
          lastSyncDate: new Date()
        });
        matched++;
      } else {
        unmatched++;
      }
    }
    
    return { matched, unmatched };
  }
}
```

### Manual Mapping Interface

**Endpoint:** `POST /api/v1/biometric/map-user`
**Request:**
```json
{
  "deviceUserId": 1,
  "employeeId": "507f1f77bcf86cd799439014",
  "deviceId": "507f1f77bcf86cd799439013"
}
```

---

## 8. IN/OUT Punch Handling

### Punch Processing Logic

```typescript
// services/attendance-processing.service.ts
export class AttendanceProcessingService {
  
  /**
   * Process incoming punch from device
   */
  async processPunch(rawLog: IRawDeviceLog): Promise<IAttendanceLog> {
    // 1. Map device user to employee
    const employeeId = await this.mapToEmployee(rawLog.deviceUserId, rawLog.serialNumber);
    
    if (!employeeId) {
      throw new Error(`No employee mapped for device user ${rawLog.deviceUserId}`);
    }
    
    // 2. Determine punch type (IN/OUT)
    const punchType = rawLog.ioMode === 0 ? 'IN' : 'OUT';
    
    // 3. Check for duplicate punch
    const isDuplicate = await this.checkDuplicatePunch(
      employeeId,
      rawLog.timestamp,
      punchType
    );
    
    if (isDuplicate) {
      throw new Error('Duplicate punch detected');
    }
    
    // 4. Get employee shift
    const shift = await this.getEmployeeShift(employeeId);
    
    // 5. Calculate attendance metrics
    const metrics = await this.calculateMetrics(rawLog.timestamp, shift);
    
    // 6. Create attendance log
    const attendanceLog = await AttendanceLog.create({
      employeeId,
      deviceId: rawLog.deviceId,
      deviceUserId: rawLog.deviceUserId,
      punchTime: rawLog.timestamp,
      punchType,
      verifyMode: rawLog.verifyMode,
      workCode: rawLog.workCode,
      processed: true,
      isLateEntry: metrics.isLateEntry,
      isEarlyExit: metrics.isEarlyExit,
      shiftId: shift?._id,
      calculatedHours: metrics.calculatedHours,
      rawLogId: rawLog._id,
    });
    
    // 7. Mark raw log as processed
    await RawDeviceLog.findByIdAndUpdate(rawLog._id, { processed: true });
    
    return attendanceLog;
  }
  
  /**
   * Check for duplicate punch within 5 minutes
   */
  private async checkDuplicatePunch(
    employeeId: string,
    timestamp: Date,
    punchType: 'IN' | 'OUT'
  ): Promise<boolean> {
    const fiveMinutesAgo = new Date(timestamp.getTime() - 5 * 60 * 1000);
    const fiveMinutesLater = new Date(timestamp.getTime() + 5 * 60 * 1000);
    
    const existingPunch = await AttendanceLog.findOne({
      employeeId,
      punchType,
      punchTime: { $gte: fiveMinutesAgo, $lte: fiveMinutesLater }
    });
    
    return !!existingPunch;
  }
}
```

---

## 9. Attendance Calculations

### 9.1 First Check-in

```typescript
async getFirstCheckIn(employeeId: string, date: Date): Promise<Date | null> {
  const startOfDay = new Date(date);
  startOfDay.setHours(0, 0, 0, 0);
  
  const endOfDay = new Date(date);
  endOfDay.setHours(23, 59, 59, 999);
  
  const firstPunch = await AttendanceLog.findOne({
    employeeId,
    punchType: 'IN',
    punchTime: { $gte: startOfDay, $lte: endOfDay }
  }).sort({ punchTime: 1 });
  
  return firstPunch?.punchTime || null;
}
```

### 9.2 Last Check-out

```typescript
async getLastCheckOut(employeeId: string, date: Date): Promise<Date | null> {
  const startOfDay = new Date(date);
  startOfDay.setHours(0, 0, 0, 0);
  
  const endOfDay = new Date(date);
  endOfDay.setHours(23, 59, 59, 999);
  
  const lastPunch = await AttendanceLog.findOne({
    employeeId,
    punchType: 'OUT',
    punchTime: { $gte: startOfDay, $lte: endOfDay }
  }).sort({ punchTime: -1 });
  
  return lastPunch?.punchTime || null;
}
```

### 9.3 Total Working Hours

```typescript
async calculateWorkingHours(employeeId: string, date: Date): Promise<number> {
  const punches = await AttendanceLog.find({
    employeeId,
    punchTime: {
      $gte: new Date(date.setHours(0, 0, 0, 0)),
      $lte: new Date(date.setHours(23, 59, 59, 999))
    }
  }).sort({ punchTime: 1 });
  
  let totalHours = 0;
  let lastInTime: Date | null = null;
  
  for (const punch of punches) {
    if (punch.punchType === 'IN') {
      lastInTime = punch.punchTime;
    } else if (punch.punchType === 'OUT' && lastInTime) {
      const diff = punch.punchTime.getTime() - lastInTime.getTime();
      totalHours += diff / (1000 * 60 * 60); // Convert to hours
      lastInTime = null;
    }
  }
  
  return Math.round(totalHours * 100) / 100; // Round to 2 decimal places
}
```

### 9.4 Late Entry

```typescript
async checkLateEntry(checkInTime: Date, shiftStartTime: string): Promise<boolean> {
  const [hours, minutes] = shiftStartTime.split(':').map(Number);
  const shiftStart = new Date(checkInTime);
  shiftStart.setHours(hours, minutes, 0, 0);
  
  // Allow 15 minutes grace period
  const gracePeriod = 15 * 60 * 1000; // 15 minutes in ms
  
  return checkInTime.getTime() > (shiftStart.getTime() + gracePeriod);
}
```

### 9.5 Early Exit

```typescript
async checkEarlyExit(checkOutTime: Date, shiftEndTime: string): Promise<boolean> {
  const [hours, minutes] = shiftEndTime.split(':').map(Number);
  const shiftEnd = new Date(checkOutTime);
  shiftEnd.setHours(hours, minutes, 0, 0);
  
  // Allow 15 minutes grace period
  const gracePeriod = 15 * 60 * 1000; // 15 minutes in ms
  
  return checkOutTime.getTime() < (shiftEnd.getTime() - gracePeriod);
}
```

### 9.6 Missing Checkout

```typescript
async checkMissingCheckout(employeeId: string, date: Date): Promise<boolean> {
  const hasCheckIn = await AttendanceLog.findOne({
    employeeId,
    punchType: 'IN',
    punchTime: {
      $gte: new Date(date.setHours(0, 0, 0, 0)),
      $lte: new Date(date.setHours(23, 59, 59, 999))
    }
  });
  
  const hasCheckOut = await AttendanceLog.findOne({
    employeeId,
    punchType: 'OUT',
    punchTime: {
      $gte: new Date(date.setHours(0, 0, 0, 0)),
      $lte: new Date(date.setHours(23, 59, 59, 999))
    }
  });
  
  return !!hasCheckIn && !hasCheckOut;
}
```

### 9.7 Multiple Punches

```typescript
async handleMultiplePunches(employeeId: string, date: Date): Promise<any> {
  const punches = await AttendanceLog.find({
    employeeId,
    punchTime: {
      $gte: new Date(date.setHours(0, 0, 0, 0)),
      $lte: new Date(date.setHours(23, 59, 59, 999))
    }
  }).sort({ punchTime: 1 });
  
  // Group by IN/OUT pairs
  const pairs = [];
  let currentIn: any = null;
  
  for (const punch of punches) {
    if (punch.punchType === 'IN') {
      currentIn = punch;
    } else if (punch.punchType === 'OUT' && currentIn) {
      pairs.push({
        in: currentIn.punchTime,
        out: punch.punchTime,
        hours: (punch.punchTime.getTime() - currentIn.punchTime.getTime()) / (1000 * 60 * 60)
      });
      currentIn = null;
    }
  }
  
  return {
    totalPunches: punches.length,
    inPunches: punches.filter(p => p.punchType === 'IN').length,
    outPunches: punches.filter(p => p.punchType === 'OUT').length,
    pairs,
    totalHours: pairs.reduce((sum, p) => sum + p.hours, 0)
  };
}
```

### 9.8 Night Shift Attendance

```typescript
async calculateNightShiftAttendance(employeeId: string, date: Date): Promise<any> {
  // Night shift: 10 PM to 6 AM (next day)
  const shiftStart = new Date(date);
  shiftStart.setHours(22, 0, 0, 0);
  
  const shiftEnd = new Date(date);
  shiftEnd.setDate(shiftEnd.getDate() + 1);
  shiftEnd.setHours(6, 0, 0, 0);
  
  const punches = await AttendanceLog.find({
    employeeId,
    punchTime: { $gte: shiftStart, $lte: shiftEnd }
  }).sort({ punchTime: 1 });
  
  // Calculate hours spanning two days
  let totalHours = 0;
  let lastInTime: Date | null = null;
  
  for (const punch of punches) {
    if (punch.punchType === 'IN') {
      lastInTime = punch.punchTime;
    } else if (punch.punchType === 'OUT' && lastInTime) {
      const diff = punch.punchTime.getTime() - lastInTime.getTime();
      totalHours += diff / (1000 * 60 * 60);
      lastInTime = null;
    }
  }
  
  return {
    shiftStart,
    shiftEnd,
    totalHours: Math.round(totalHours * 100) / 100,
    punches: punches.length
  };
}
```

---

## 10. Validation and Duplicate Prevention

### 10.1 Input Validation

```typescript
// validators/biometric-device.validator.ts
import { body, param, validationResult } from 'express-validator';

export const validateMachineAdd = [
  body('machineNo').trim().notEmpty().withMessage('Machine number is required'),
  body('serialNumber').trim().notEmpty().withMessage('Serial number is required'),
  body('name').trim().notEmpty().withMessage('Machine name is required'),
  body('ipAddress').isIP().withMessage('Valid IP address required'),
  body('port').isInt({ min: 1, max: 65535 }).withMessage('Valid port required'),
  body('serverUrl').isURL().withMessage('Valid server URL required'),
  body('protocol').isIn(['REALTIME', 'ZKTECO', 'COSEC']).withMessage('Invalid protocol'),
];

export const validateDevicePush = [
  body('serialNumber').trim().notEmpty().withMessage('Serial number required'),
  body('machineNo').trim().notEmpty().withMessage('Machine number required'),
  body('timestamp').isISO8601().withMessage('Valid timestamp required'),
  body('logs').isArray().withMessage('Logs must be an array'),
  body('logs.*.deviceUserId').isInt().withMessage('Valid device user ID required'),
  body('logs.*.timestamp').isISO8601().withMessage('Valid log timestamp required'),
  body('logs.*.ioMode').isIn([0, 1]).withMessage('Valid IO mode required'),
];
```

### 10.2 Duplicate Prevention Middleware

```typescript
// middleware/duplicate-prevention.middleware.ts
export const duplicatePunchPrevention = async (req: any, res: any, next: any) => {
  const { logs } = req.body;
  
  for (const log of logs) {
    const existingLog = await RawDeviceLog.findOne({
      serialNumber: req.body.serialNumber,
      deviceUserId: log.deviceUserId,
      timestamp: log.timestamp,
      ioMode: log.ioMode
    });
    
    if (existingLog) {
      return res.status(409).json({
        success: false,
        message: 'Duplicate log detected',
        data: { duplicateLog: log }
      });
    }
  }
  
  next();
};
```

---

## 11. Sample API Request/Response Payloads

### 11.1 Device Push (Real-time)

**Request:**
```http
POST /api/v1/biometric/push HTTP/1.1
Host: api.yourhrms.com
Content-Type: application/json
Authorization: Bearer device_auth_token

{
  "serialNumber": "RSS20220730466",
  "machineNo": "2",
  "timestamp": "2024-01-15T10:30:00.000Z",
  "logs": [
    {
      "deviceUserId": 1,
      "timestamp": "2024-01-15T09:15:00.000Z",
      "ioMode": 0,
      "verifyMode": 1,
      "workCode": 0
    }
  ]
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "received": 1,
    "processed": 1,
    "failed": 0,
    "processedLogs": [
      {
        "deviceUserId": 1,
        "employeeId": "507f1f77bcf86cd799439014",
        "punchTime": "2024-01-15T09:15:00.000Z",
        "punchType": "IN",
        "isLateEntry": false
      }
    ],
    "lastSyncTime": "2024-01-15T10:30:00.000Z"
  },
  "message": "Attendance logs synced successfully"
}
```

### 11.2 Manual Sync Request

**Request:**
```http
POST /api/v1/biometric/machines/507f1f77bcf86cd799439013/sync HTTP/1.1
Host: api.yourhrms.com
Content-Type: application/json
Authorization: Bearer user_auth_token

{
  "syncType": "ATTENDANCE",
  "startDate": "2024-01-01",
  "endDate": "2024-01-15"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "syncId": "507f1f77bcf86cd799439016",
    "status": "IN_PROGRESS",
    "startTime": "2024-01-15T10:30:00.000Z",
    "estimatedDuration": 120
  },
  "message": "Sync started"
}
```

---

## 12. MongoDB Schema Examples

### 12.1 AttendanceLog Indexes

```typescript
// Compound indexes for common queries
attendanceLogSchema.index({ employeeId: 1, punchTime: -1 });
attendanceLogSchema.index({ deviceId: 1, punchTime: -1 });
attendanceLogSchema.index({ punchTime: 1, processed: 1 });
attendanceLogSchema.index({ employeeId: 1, processed: 1 });

// Text index for search
attendanceLogSchema.index({ notes: 'text' });
```

### 12.2 RawDeviceLog TTL Index

```typescript
// Auto-delete raw logs after 90 days
rawDeviceLogSchema.index({ createdAt: 1 }, { expireAfterSeconds: 90 * 24 * 60 * 60 });
```

---

## 13. Express Route Structure

```typescript
// routes/v1/biometric-devices.routes.ts
import { Router } from 'express';
import { authMiddleware } from '../../middleware/auth.middleware';
import { deviceAuthMiddleware } from '../../middleware/device-auth.middleware';
import { validateMachineAdd, validateDevicePush } from '../../validators/biometric-device.validator';
import { duplicatePunchPrevention } from '../../middleware/duplicate-prevention.middleware';
import * as controller from '../../controllers/biometric-device.controller';

const router = Router();

// Public device endpoints (with device auth)
router.post('/push', deviceAuthMiddleware, validateDevicePush, duplicatePunchPrevention, controller.devicePush);
router.post('/heartbeat', deviceAuthMiddleware, controller.deviceHeartbeat);
router.post('/register', controller.deviceRegistration);

// Admin endpoints (require auth)
router.use(authMiddleware);

router.get('/machines', controller.getMachines);
router.post('/machines', validateMachineAdd, controller.addMachine);
router.get('/machines/:id', controller.getMachineById);
router.put('/machines/:id', validateMachineAdd, controller.updateMachine);
router.delete('/machines/:id', controller.deleteMachine);
router.post('/machines/:id/sync', controller.syncMachine);
router.get('/machines/:id/users', controller.getDeviceUsers);
router.get('/machines/:id/logs', controller.getDeviceLogs);
router.get('/machines/:id/sync-status', controller.getSyncStatus);
router.post('/map-user', controller.mapUserToEmployee);

export default router;
```

---

## 14. Controller and Service Layer Plan

### 14.1 Controller Layer

```typescript
// controllers/biometric-device.controller.ts
export class BiometricDeviceController {
  
  async devicePush(req: Request, res: Response) {
    // 1. Validate device
    const device = await AttendanceMachine.findOne({ 
      serialNumber: req.body.serialNumber 
    });
    
    if (!device) {
      return res.status(404).json({ success: false, message: 'Device not registered' });
    }
    
    // 2. Process logs
    const result = await biometricDeviceService.processLogs(req.body.logs, device);
    
    // 3. Update device heartbeat
    await AttendanceMachine.findByIdAndUpdate(device._id, {
      lastHeartbeat: new Date(),
      connectionStatus: 'ONLINE',
      lastError: null
    });
    
    return res.json({ success: true, data: result });
  }
  
  async addMachine(req: Request, res: Response) {
    const machine = await AttendanceMachine.create(req.body);
    return res.status(201).json({ success: true, data: machine });
  }
  
  async syncMachine(req: Request, res: Response) {
    const { id } = req.params;
    const syncResult = await deviceSyncService.syncDevice(id);
    return res.json({ success: true, data: syncResult });
  }
}
```

### 14.2 Service Layer

```typescript
// services/biometric-device.service.ts
export class BiometricDeviceService {
  
  async processLogs(logs: any[], device: IAttendanceMachine): Promise<any> {
    const processed = [];
    const failed = [];
    
    for (const log of logs) {
      try {
        // Save raw log
        const rawLog = await RawDeviceLog.create({
          deviceId: device._id,
          serialNumber: device.serialNumber,
          ...log,
          receivedAt: new Date()
        });
        
        // Process attendance
        const attendanceLog = await attendanceProcessingService.processPunch(rawLog);
        processed.push(attendanceLog);
      } catch (error) {
        failed.push({ log, error: error.message });
      }
    }
    
    return { processed, failed };
  }
}
```

---

## 15. Error Handling and Logging Strategy

### 15.1 Error Handling

```typescript
// utils/error-handler.util.ts
export class ApiError extends Error {
  constructor(
    public statusCode: number,
    public message: string,
    public details?: any
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

export const asyncHandler = (fn: Function) => (req: any, res: any, next: any) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

export const errorHandler = (err: any, req: any, res: any, next: any) => {
  logger.error('API Error:', {
    error: err.message,
    stack: err.stack,
    url: req.url,
    method: req.method,
    body: req.body
  });
  
  res.status(err.statusCode || 500).json({
    success: false,
    message: err.message || 'Internal server error',
    details: process.env.NODE_ENV === 'development' ? err.stack : undefined
  });
};
```

### 15.2 Logging Strategy

```typescript
// utils/logger.util.ts
import winston from 'winston';

export const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  transports: [
    new winston.transports.File({ filename: 'logs/error.log', level: 'error' }),
    new winston.transports.File({ filename: 'logs/combined.log' }),
    new winston.transports.Console({
      format: winston.format.simple()
    })
  ]
});

// Structured logging
logger.info('Device connected', {
  serialNumber: 'RSS20220730466',
  ipAddress: '192.168.1.201',
  timestamp: new Date().toISOString()
});

logger.error('Sync failed', {
  deviceId: '507f1f77bcf86cd799439013',
  error: 'Connection timeout',
  retryCount: 3
});
```

---

## 16. Device Testing Checklist

### 16.1 Pre-Deployment Testing

- [ ] Device network connectivity test
- [ ] Device IP ping test from server
- [ ] Port accessibility test (telnet IP port)
- [ ] Device registration test
- [ ] Heartbeat endpoint test
- [ ] Single punch push test
- [ ] Bulk punch push test (100 logs)
- [ ] Duplicate punch prevention test
- [ ] User mapping test
- [ ] Attendance calculation test
- [ ] Error handling test (device offline)
- [ ] Retry logic test
- [ ] Concurrent device sync test

### 16.2 Test Commands

```bash
# Test device connectivity
curl -X POST http://192.168.1.201:80/api/test

# Test push endpoint
curl -X POST https://api.yourhrms.com/api/v1/biometric/push \
  -H "Content-Type: application/json" \
  -d '{
    "serialNumber": "RSS20220730466",
    "machineNo": "2",
    "timestamp": "2024-01-15T10:30:00.000Z",
    "logs": [{
      "deviceUserId": 1,
      "timestamp": "2024-01-15T09:15:00.000Z",
      "ioMode": 0,
      "verifyMode": 1,
      "workCode": 0
    }]
  }'

# Test heartbeat
curl -X POST https://api.yourhrms.com/api/v1/biometric/heartbeat \
  -H "Content-Type: application/json" \
  -d '{
    "serialNumber": "RSS20220730466",
    "machineNo": "2",
    "timestamp": "2024-01-15T10:30:00.000Z",
    "status": "ONLINE"
  }'
```

---

## 17. Production Deployment Checklist

### 17.1 VPS Setup

```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Node.js
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install -y nodejs

# Install MongoDB
wget -qO - https://www.mongodb.org/static/pgp/server-6.0.asc | sudo apt-key add -
echo "deb [ arch=amd64,arm64 ] https://repo.mongodb.org/apt/ubuntu focal/mongodb-org/6.0 multiverse" | sudo tee /etc/apt/sources.list.d/mongodb-org-6.0.list
sudo apt update
sudo apt install -y mongodb-org
sudo systemctl start mongod
sudo systemctl enable mongod

# Install NGINX
sudo apt install -y nginx

# Install PM2
sudo npm install -g pm2
```

### 17.2 NGINX Configuration

```nginx
# /etc/nginx/sites-available/hrms-api
server {
    listen 443 ssl http2;
    server_name api.yourhrms.com;

    ssl_certificate /etc/ssl/certs/yourhrms.com.crt;
    ssl_certificate_key /etc/ssl/private/yourhrms.com.key;

    client_max_body_size 10M;

    location /api/v1/biometric/push {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        
        # Device push specific settings
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }

    location /api/ {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}

# HTTP to HTTPS redirect
server {
    listen 80;
    server_name api.yourhrms.com;
    return 301 https://$server_name$request_uri;
}
```

### 17.3 PM2 Configuration

```javascript
// ecosystem.config.js
module.exports = {
  apps: [{
    name: 'hrms-api',
    script: './dist/app.js',
    instances: 'max',
    exec_mode: 'cluster',
    env: {
      NODE_ENV: 'production',
      PORT: 3000,
      MONGODB_URI: 'mongodb://localhost:27017/hrms',
      JWT_SECRET: 'your-jwt-secret',
      DEVICE_AUTH_SECRET: 'your-device-auth-secret'
    },
    error_file: './logs/pm2-error.log',
    out_file: './logs/pm2-out.log',
    log_date_format: 'YYYY-MM-DD HH:mm:ss',
    merge_logs: true,
    max_memory_restart: '1G',
    autorestart: true,
    watch: false
  }]
};
```

### 17.4 Deployment Commands

```bash
# Build application
npm run build

# Start with PM2
pm2 start ecosystem.config.js

# Save PM2 configuration
pm2 save

# Setup PM2 startup script
pm2 startup

# Restart NGINX
sudo systemctl restart nginx

# Enable firewall
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw allow 22/tcp
sudo ufw enable
```

---

## 18. Debugging Steps

### 18.1 Attendance Data Not Coming

**Step 1: Check Device Configuration**
```bash
# Verify device is configured with correct server URL
# Access device web interface: http://192.168.1.201
# Check: Settings > Network > Server URL
# Should be: https://api.yourhrms.com/api/v1/biometric/push
```

**Step 2: Check Network Connectivity**
```bash
# Test from device (if accessible)
ping api.yourhrms.com
telnet api.yourhrms.com 443

# Test from server
ping 192.168.1.201
telnet 192.168.1.201 4370
```

**Step 3: Check Server Logs**
```bash
# Check NGINX logs
sudo tail -f /var/log/nginx/access.log
sudo tail -f /var/log/nginx/error.log

# Check application logs
pm2 logs hrms-api

# Check MongoDB logs
sudo tail -f /var/log/mongodb/mongod.log
```

**Step 4: Test Push Endpoint**
```bash
# Manual test
curl -X POST https://api.yourhrms.com/api/v1/biometric/push \
  -H "Content-Type: application/json" \
  -d @test-payload.json -v
```

**Step 5: Check Database**
```bash
# Check if device is registered
mongo hrms
db.attendancemachines.find({ serialNumber: "RSS20220730466" })

# Check raw logs
db.rawdevicelogs.find({ serialNumber: "RSS20220730466" }).sort({ createdAt: -1 }).limit(10)

# Check processed logs
db.attendancelogs.find({ createdAt: { $gte: new Date(Date.now() - 24*60*60*1000) } })
```

**Step 6: Check Device Status**
```bash
# Check device heartbeat
db.attendancemachines.find({ serialNumber: "RSS20220730466" }, { connectionStatus: 1, lastHeartbeat: 1 })

# Check sync status
db.devicesyncstatus.find({ deviceId: ObjectId("...") }).sort({ createdAt: -1 }).limit(5)
```

---

## 19. Security Best Practices

### 19.1 Device Authentication

```typescript
// middleware/device-auth.middleware.ts
import crypto from 'crypto';

export const deviceAuthMiddleware = async (req: any, res: any, next: any) => {
  const authHeader = req.headers.authorization;
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ success: false, message: 'Device authentication required' });
  }
  
  const token = authHeader.substring(7);
  
  // Verify device token
  const device = await AttendanceMachine.findOne({ 
    authToken: token,
    isActive: true 
  });
  
  if (!device) {
    return res.status(401).json({ success: false, message: 'Invalid device token' });
  }
  
  // Add device to request
  req.device = device;
  next();
};
```

### 19.2 Rate Limiting

```typescript
// middleware/rate-limit.middleware.ts
import rateLimit from 'express-rate-limit';

export const deviceRateLimit = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 100, // 100 requests per minute
  message: 'Too many requests from device',
  standardHeaders: true,
  legacyHeaders: false,
});

// Apply to device endpoints
router.post('/push', deviceRateLimit, deviceAuthMiddleware, controller.devicePush);
```

### 19.3 Data Encryption

```typescript
// Encrypt sensitive data in transit
// Always use HTTPS (TLS 1.2+)

// Encrypt sensitive data at rest
import crypto from 'crypto';

const algorithm = 'aes-256-gcm';
const key = crypto.scryptSync(process.env.ENCRYPTION_KEY, 'salt', 32);

function encrypt(text: string): string {
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv(algorithm, key, iv);
  let encrypted = cipher.update(text, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  const authTag = cipher.getAuthTag();
  return iv.toString('hex') + ':' + authTag.toString('hex') + ':' + encrypted;
}
```

### 19.4 Input Sanitization

```typescript
import { sanitize } from 'sanitize-html';

// Sanitize device input
const sanitizedName = sanitize(deviceUser.name);
const sanitizedNotes = sanitize(attendanceLog.notes);
```

---

## 20. Step-by-Step Implementation Roadmap

### Phase 1: Foundation (Week 1)

**Day 1-2: Database Models**
- [ ] Create all MongoDB models
- [ ] Define indexes
- [ ] Create model relationships
- [ ] Write model unit tests

**Day 3-4: Basic API Structure**
- [ ] Set up Express routes
- [ ] Create controller skeletons
- [ ] Implement validation
- [ ] Add error handling

**Day 5: Authentication**
- [ ] Implement device auth middleware
- [ ] Create device registration
- [ ] Generate auth tokens
- [ ] Test authentication flow

### Phase 2: Device Integration (Week 2)

**Day 6-7: Device Service**
- [ ] Implement biometric device service
- [ ] Add TCP connection handling
- [ ] Implement protocol parsing
- [ ] Add retry logic

**Day 8-9: Push Endpoint**
- [ ] Create device push endpoint
- [ ] Implement log processing
- [ ] Add duplicate prevention
- [ ] Test with real device

**Day 10: User Mapping**
- [ ] Implement user mapping service
- [ ] Create mapping interface
- [ ] Add bulk sync
- [ ] Test user mapping

### Phase 3: Attendance Processing (Week 3)

**Day 11-12: Attendance Processing**
- [ ] Implement punch processing
- [ ] Add IN/OUT logic
- [ ] Create attendance calculator
- [ ] Test calculations

**Day 13-14: Reports**
- [ ] Daily report API
- [ ] Monthly report API
- [ ] Missing punch report
- [ ] Test reports

**Day 15: Validation**
- [ ] Add shift validation
- [ ] Implement late/early logic
- [ ] Add missing checkout detection
- [ ] Test edge cases

### Phase 4: Testing & Deployment (Week 4)

**Day 16-17: Testing**
- [ ] Unit tests
- [ ] Integration tests
- [ ] Load testing
- [ ] Device testing

**Day 18-19: Deployment**
- [ ] Set up VPS
- [ ] Configure NGINX
- [ ] Set up PM2
- [ ] Deploy application

**Day 20: Monitoring**
- [ ] Set up logging
- [ ] Add monitoring
- [ ] Create alerts
- [ ] Documentation

---

## Quick Start Implementation

### 1. Install Dependencies

```bash
npm install express mongoose dotenv cors helmet morgan
npm install express-rate-limit express-validator
npm install winston
npm install --save-dev @types/node @types/express @types/mongoose typescript ts-node
```

### 2. Environment Variables

```env
# .env
NODE_ENV=production
PORT=3000
MONGODB_URI=mongodb://localhost:27017/hrms
JWT_SECRET=your-jwt-secret
DEVICE_AUTH_SECRET=your-device-auth-secret
ENCRYPTION_KEY=your-encryption-key
LOG_LEVEL=info
```

### 3. Start Application

```bash
# Development
npm run dev

# Production
npm run build
pm2 start ecosystem.config.js
```

---

## Conclusion

This comprehensive plan provides a production-ready architecture for integrating Realtime T 304F+ biometric devices with your HRMS backend. The hybrid approach using cloud push API with local LAN fallback ensures reliability and real-time data synchronization.

**Key Takeaways:**
1. Use device server URL configuration for push-based integration
2. Implement proper user mapping between device and HRMS
3. Add duplicate prevention and validation
4. Calculate attendance metrics accurately
5. Deploy with NGINX, PM2, and HTTPS for production
6. Monitor and log all device activities
7. Test thoroughly before production deployment

**Next Steps:**
1. Review and approve this plan
2. Set up development environment
3. Implement Phase 1 (Foundation)
4. Test with real device (RSS20220730466)
5. Iterate based on testing results
6. Deploy to production

---

**Document Version:** 1.0  
**Last Updated:** 2024-01-15  
**Author:** Senior Backend Developer  
**Device Model:** Realtime T 304F+  
**Serial Number:** RSS20220730466
