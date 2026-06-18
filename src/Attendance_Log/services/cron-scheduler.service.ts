import cron from "node-cron";
import { calculateDailyAttendance } from "../controllers/attendance-calculation.controller";

/**
 * Cron Scheduler Service
 * Runs daily attendance calculation at midnight
 */

export class CronSchedulerService {
  private dailyAttendanceJob: cron.ScheduledTask | null = null;

  startDailyAttendanceCalculation(): void {
    // Run every day at midnight (00:00)
    this.dailyAttendanceJob = cron.schedule("0 0 * * *", async () => {
      console.log("Starting daily attendance calculation...");
      
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const dateStr = yesterday.toISOString().split("T")[0];

      try {
        // Simulate request/response objects
        const mockReq = { body: { date: dateStr } } as any;
        const mockRes = {
          json: (data: any) => console.log("Daily attendance calculation result:", data),
          status: (code: number) => ({
            json: (data: any) => console.error(`Error ${code}:`, data)
          })
        } as any;

        await calculateDailyAttendance(mockReq, mockRes);
      } catch (error) {
        console.error("Error in daily attendance cron job:", error);
      }
    });

    console.log("Daily attendance calculation cron job scheduled for midnight");
  }

  stopDailyAttendanceCalculation(): void {
    if (this.dailyAttendanceJob) {
      this.dailyAttendanceJob.stop();
      this.dailyAttendanceJob = null;
      console.log("Daily attendance calculation cron job stopped");
    }
  }

  startAllJobs(): void {
    this.startDailyAttendanceCalculation();
  }

  stopAllJobs(): void {
    this.stopDailyAttendanceCalculation();
  }
}
