# Biometric Device Integration Guide

## Overview
This integration allows your HRMS to connect with Realtime T304F+ biometric devices for automated attendance tracking.

## Device Information
- **Brand**: Realtime Biometric
- **Model**: T304F+
- **Device ID**: 1
- **TCP Port**: 5005
- **IP Address**: 192.168.1.225
- **Gateway**: 192.168.1.224
- **Serial/Cloud ID**: RSS20220730466

## API Endpoints

### Device Management

#### Register Device
```http
POST /api/v1/biometric/devices
Content-Type: application/json

{
  "name": "Office Main Entrance",
  "brand": "Realtime",
  "deviceModel": "T304F+",
  "deviceId": "1",
  "ipAddress": "192.168.1.225",
  "port": 5005,
  "gateway": "192.168.1.224",
  "serialNumber": "RSS20220730466",
  "cloudId": "RSS20220730466",
  "location": "Main Office",
  "syncInterval": 30,
  "protocol": "zkteco"
}
```

#### Get All Devices
```http
GET /api/v1/biometric/devices
```

#### Get Single Device
```http
GET /api/v1/biometric/devices/:deviceId
```

#### Update Device
```http
PUT /api/v1/biometric/devices/:deviceId
Content-Type: application/json

{
  "name": "Updated Device Name",
  "syncInterval": 15
}
```

#### Delete Device
```http
DELETE /api/v1/biometric/devices/:deviceId
```

### Device Connection

#### Connect to Device
```http
POST /api/v1/biometric/devices/:deviceId/connect
```

#### Disconnect from Device
```http
POST /api/v1/biometric/devices/:deviceId/disconnect
```

#### Test Connection
```http
POST /api/v1/biometric/devices/:deviceId/test
```

### Device Information

#### Get Device Info
```http
GET /api/v1/biometric/devices/:deviceId/info
```

#### Get Device Users
```http
GET /api/v1/biometric/devices/:deviceId/users
```

#### Get Device Logs (without syncing)
```http
GET /api/v1/biometric/devices/:deviceId/logs
```

### Attendance Synchronization

#### Sync Attendance from Single Device
```http
POST /api/v1/biometric/devices/:deviceId/sync
```

#### Sync All Devices
```http
POST /api/v1/biometric/sync-all
```

#### Convenience Endpoints (via Attendance Routes)
```http
POST /api/v1/attendance/biometric/sync/:deviceId
POST /api/v1/attendance/biometric/sync-all
```

## Setup Instructions

### 1. Register Your Device
Use the device information provided above to register your biometric device:

```bash
curl -X POST http://localhost:3000/api/v1/biometric/devices \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "name": "Office Main Entrance",
    "brand": "Realtime",
    "deviceModel": "T304F+",
    "deviceId": "1",
    "ipAddress": "192.168.1.225",
    "port": 5005,
    "gateway": "192.168.1.224",
    "serialNumber": "RSS20220730466",
    "cloudId": "RSS20220730466",
    "location": "Main Office",
    "syncInterval": 30,
    "protocol": "zkteco"
  }'
```

### 2. Test Connection
Before syncing, test the connection to ensure the device is reachable:

```bash
curl -X POST http://localhost:3000/api/v1/biometric/devices/1/test \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### 3. Sync Attendance
Once connected, sync attendance data:

```bash
curl -X POST http://localhost:3000/api/v1/biometric/devices/1/sync \
  -H "Authorization: Bearer YOUR_TOKEN"
```

## User Mapping

For the biometric integration to work correctly, you need to map device users to HRMS users. There are two ways to do this:

### Option 1: Using biometricUserId field
Add the `biometricUserId` field to your User documents to match the device user ID.

### Option 2: Using employeeId
Ensure that the device user ID matches the employeeId in your HRMS system.

## Automated Sync

You can set up automated sync using cron jobs or a scheduler:

### Example Cron Job (sync every 30 minutes)
```bash
*/30 * * * * curl -X POST http://localhost:3000/api/v1/biometric/devices/1/sync \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### Example Node.js Cron Job
```javascript
const cron = require('node-cron');
const axios = require('axios');

cron.schedule('*/30 * * * *', async () => {
  try {
    await axios.post('http://localhost:3000/api/v1/biometric/devices/1/sync', {}, {
      headers: { Authorization: `Bearer ${process.env.HRMS_TOKEN}` }
    });
    console.log('Biometric sync completed');
  } catch (error) {
    console.error('Biometric sync failed:', error.message);
  }
});
```

## Attendance Data Structure

The integration stores attendance records with the following additional fields:

```typescript
{
  biometricInfo: {
    biometricDeviceId: string,    // Device ID that captured the punch
    biometricUserId: string,      // User ID on the biometric device
    verifyMode: string,           // Verification method (fingerprint, face, etc.)
    ioMode: string,               // Check-in/check-out mode
    workCode: number              // Work code from device
  }
}
```

## Troubleshooting

### Connection Issues
- Ensure the device IP (192.168.1.225) is accessible from your server
- Check that port 5005 is not blocked by firewall
- Verify the device is powered on and connected to the network

### Sync Issues
- Ensure users are properly mapped (biometricUserId or employeeId)
- Check device logs to verify attendance data is being recorded
- Review server logs for specific error messages

### Protocol Compatibility
- Realtime T304F+ typically uses ZKTeco protocol
- If sync fails, try changing protocol to 'realtime' in device configuration

## Security Considerations

- All endpoints require authentication
- Device credentials should be stored securely
- Consider using VPN for remote device access
- Regularly rotate API tokens
- Monitor sync logs for unusual activity

## Files Modified/Created

1. **Model**: `src/models/biometric-device.model.ts` - Device configuration storage
2. **Service**: `src/services/biometric.service.ts` - Device communication logic
3. **Controller**: `src/controllers/biometric.controller.ts` - API endpoint handlers
4. **Routes**: `src/routes/v1/biometric.routes.ts` - API route definitions
5. **Types**: `src/types/zklib-js.d.ts` - TypeScript definitions for zklib-js
6. **Attendance Model**: Updated to include biometricInfo field
7. **Attendance Routes**: Added convenience sync endpoints

## Dependencies

- `zklib-js` - Biometric device communication library
