import { DeviceConnectionService } from "./device-connection.service";
import axios from "axios";

export interface AttendanceLog {
  userId: number;
  recordTime: Date;
  verifyMode: number;
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
  syncInterval: number; // in seconds
}

export class AttendanceSyncService {
  private syncConfig: SyncConfig;
  private isSyncing: boolean = false;

  constructor(config: SyncConfig) {
    this.syncConfig = config;
  }

  async syncAttendance(): Promise<void> {
    if (this.isSyncing) {
      console.log("Sync already in progress, skipping...");
      return;
    }

    this.isSyncing = true;

    try {
      for (const deviceConfig of this.syncConfig.deviceConfigs) {
        await this.syncDevice(deviceConfig);
      }
    } catch (error) {
      console.error("Error during attendance sync:", error);
    } finally {
      this.isSyncing = false;
    }
  }

  private async syncDevice(deviceConfig: any): Promise<void> {
    const deviceService = new DeviceConnectionService({
      ipAddress: deviceConfig.ipAddress,
      port: deviceConfig.port
    });

    try {
      await deviceService.connect();
      const zk = deviceService.getZKInstance();
      const logs = await zk.getAttendances();

      console.log(`Retrieved ${logs.length} logs from device ${deviceConfig.ipAddress}`);

      if (logs.length > 0) {
        await this.pushToAPI(logs, deviceConfig);
      }

      await deviceService.disconnect();
    } catch (error) {
      console.error(`Error syncing device ${deviceConfig.ipAddress}:`, error);
      await deviceService.disconnect();
    }
  }

  private async pushToAPI(logs: any[], deviceConfig: any): Promise<void> {
    try {
      const formattedLogs = logs.map((log: any) => ({
        biometricUserId: log.userId,
        punchTime: new Date(log.recordTime),
        verifyMode: log.verifyMode,
        deviceId: deviceConfig.deviceId,
        branchId: deviceConfig.branchId,
        companyId: deviceConfig.companyId,
        deviceIp: deviceConfig.ipAddress
      }));

      const response = await axios.post(
        `${this.syncConfig.apiUrl}/api/v1/attendance-log/sync`,
        { logs: formattedLogs },
        {
          headers: {
            Authorization: `Bearer ${this.syncConfig.apiToken}`,
            "Content-Type": "application/json"
          }
        }
      );

      console.log(`Successfully synced ${logs.length} logs to API`);
      return response.data;
    } catch (error) {
      console.error("Error pushing logs to API:", error);
      throw error;
    }
  }

  startAutoSync(): NodeJS.Timeout {
    console.log(`Starting auto sync every ${this.syncConfig.syncInterval} seconds`);
    return setInterval(() => {
      this.syncAttendance();
    }, this.syncConfig.syncInterval * 1000);
  }

  stopAutoSync(intervalId: NodeJS.Timeout): void {
    clearInterval(intervalId);
    console.log("Auto sync stopped");
  }
}
