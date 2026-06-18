/**
 * Utility functions for attendance calculations
 */

export interface ShiftConfig {
  startTime: string; // "09:00"
  endTime: string;   // "18:00"
  gracePeriod: number; // minutes
  halfDayThreshold: number; // hours
}

export const DEFAULT_SHIFT: ShiftConfig = {
  startTime: "09:00",
  endTime: "18:00",
  gracePeriod: 15,
  halfDayThreshold: 4
};

export const calculateWorkingHours = (checkIn: Date, checkOut: Date): number => {
  const diffMs = checkOut.getTime() - checkIn.getTime();
  return Math.round((diffMs / (1000 * 60 * 60)) * 100) / 100;
};

export const calculateLateMinutes = (
  checkIn: Date,
  shiftStart: string,
  gracePeriod: number
): number => {
  const [hours, minutes] = shiftStart.split(":").map(Number);
  const shiftStartDate = new Date(checkIn);
  shiftStartDate.setHours(hours, minutes, 0, 0);

  if (checkIn > shiftStartDate) {
    const lateMs = checkIn.getTime() - shiftStartDate.getTime();
    const lateMinutes = Math.round(lateMs / (1000 * 60));
    return Math.max(0, lateMinutes - gracePeriod);
  }

  return 0;
};

export const calculateEarlyExitMinutes = (
  checkOut: Date,
  shiftEnd: string,
  gracePeriod: number
): number => {
  const [hours, minutes] = shiftEnd.split(":").map(Number);
  const shiftEndDate = new Date(checkOut);
  shiftEndDate.setHours(hours, minutes, 0, 0);

  if (checkOut < shiftEndDate) {
    const earlyMs = shiftEndDate.getTime() - checkOut.getTime();
    const earlyMinutes = Math.round(earlyMs / (1000 * 60));
    return Math.max(0, earlyMinutes - gracePeriod);
  }

  return 0;
};

export const calculateOvertimeMinutes = (
  checkOut: Date,
  shiftEnd: string,
  overtimeThreshold: number = 30
): number => {
  const [hours, minutes] = shiftEnd.split(":").map(Number);
  const shiftEndDate = new Date(checkOut);
  shiftEndDate.setHours(hours, minutes, 0, 0);

  if (checkOut > shiftEndDate) {
    const overtimeMs = checkOut.getTime() - shiftEndDate.getTime();
    const overtimeMinutes = Math.round(overtimeMs / (1000 * 60));
    return Math.max(0, overtimeMinutes - overtimeThreshold);
  }

  return 0;
};

export const determineAttendanceStatus = (
  workingHours: number,
  lateMinutes: number,
  earlyExitMinutes: number,
  overtimeMinutes: number,
  halfDayThreshold: number
): string => {
  if (workingHours < halfDayThreshold) {
    return "half-day";
  }

  if (overtimeMinutes > 0) {
    return "overtime";
  }

  if (lateMinutes > 0) {
    return "late-entry";
  }

  if (earlyExitMinutes > 0) {
    return "early-exit";
  }

  return "present";
};
