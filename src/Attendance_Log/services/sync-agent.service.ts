import { AttendanceSyncService, SyncConfig } from "./attendance-sync.service";
import * as fs from "fs";
import * as path from "path";

export class SyncAgentService {
  private syncService: AttendanceSyncService;
  private syncIntervalId: NodeJS.Timeout | null = null;

  constructor() {
    const config = this.loadConfig();
    this.syncService = new AttendanceSyncService(config);
  }

  private loadConfig(): SyncConfig {
    const configPath = path.join(__dirname, "../../config/sync-agent.config.json");
    
    try {
      const configData = fs.readFileSync(configPath, "utf-8");
      return JSON.parse(configData);
    } catch (error) {
      console.error("Error loading sync agent config:", error);
      throw new Error("Failed to load sync agent configuration");
    }
  }

  async start(): Promise<void> {
    console.log("Starting Attendance Sync Agent...");
    
    try {
      // Perform initial sync
      await this.syncService.syncAttendance();
      
      // Start auto sync
      this.syncIntervalId = this.syncService.startAutoSync();
      
      console.log("Sync Agent started successfully");
    } catch (error) {
      console.error("Error starting sync agent:", error);
      throw error;
    }
  }

  async stop(): Promise<void> {
    console.log("Stopping Attendance Sync Agent...");
    
    if (this.syncIntervalId) {
      this.syncService.stopAutoSync(this.syncIntervalId);
      this.syncIntervalId = null;
    }
    
    console.log("Sync Agent stopped");
  }

  async manualSync(): Promise<void> {
    console.log("Performing manual sync...");
    await this.syncService.syncAttendance();
    console.log("Manual sync completed");
  }
}
