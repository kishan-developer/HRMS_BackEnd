import { format, startOfDay, endOfDay, startOfMonth, endOfMonth, startOfYear, endOfYear, subDays, subMonths, subYears } from 'date-fns';

export const formatDate = (date: Date | string): string => {
  const d = typeof date === 'string' ? new Date(date) : date;
  return format(d, 'yyyy-MM-dd');
};

export const formatDateTime = (date: Date | string): string => {
  const d = typeof date === 'string' ? new Date(date) : date;
  return format(d, 'yyyy-MM-dd HH:mm:ss');
};

export const formatTime = (date: Date | string): string => {
  const d = typeof date === 'string' ? new Date(date) : date;
  return format(d, 'HH:mm:ss');
};

export const getStartOfDay = (date: Date | string): Date => {
  const d = typeof date === 'string' ? new Date(date) : date;
  return startOfDay(d);
};

export const getEndOfDay = (date: Date | string): Date => {
  const d = typeof date === 'string' ? new Date(date) : date;
  return endOfDay(d);
};

export const getStartOfMonth = (date: Date | string): Date => {
  const d = typeof date === 'string' ? new Date(date) : date;
  return startOfMonth(d);
};

export const getEndOfMonth = (date: Date | string): Date => {
  const d = typeof date === 'string' ? new Date(date) : date;
  return endOfMonth(d);
};

export const getStartOfYear = (date: Date | string): Date => {
  const d = typeof date === 'string' ? new Date(date) : date;
  return startOfYear(d);
};

export const getEndOfYear = (date: Date | string): Date => {
  const d = typeof date === 'string' ? new Date(date) : date;
  return endOfYear(d);
};

export const subtractDays = (date: Date | string, days: number): Date => {
  const d = typeof date === 'string' ? new Date(date) : date;
  return subDays(d, days);
};

export const subtractMonths = (date: Date | string, months: number): Date => {
  const d = typeof date === 'string' ? new Date(date) : date;
  return subMonths(d, months);
};

export const subtractYears = (date: Date | string, years: number): Date => {
  const d = typeof date === 'string' ? new Date(date) : date;
  return subYears(d, years);
};

export const calculateDaysBetween = (startDate: Date | string, endDate: Date | string): number => {
  const start = typeof startDate === 'string' ? new Date(startDate) : startDate;
  const end = typeof endDate === 'string' ? new Date(endDate) : endDate;
  const diffTime = Math.abs(end.getTime() - start.getTime());
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays;
};

export const calculateHoursBetween = (startTime: string, endTime: string): number => {
  const [startHours, startMinutes] = startTime.split(':').map(Number);
  const [endHours, endMinutes] = endTime.split(':').map(Number);

  const startTotalMinutes = startHours * 60 + startMinutes;
  const endTotalMinutes = endHours * 60 + endMinutes;

  const diffMinutes = endTotalMinutes - startTotalMinutes;
  return Math.abs(diffMinutes / 60);
};

export const getCurrentYear = (): number => {
  return new Date().getFullYear();
};

export const getCurrentMonth = (): number => {
  return new Date().getMonth() + 1;
};
