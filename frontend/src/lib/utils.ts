import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function decimalToHoursMinutes(decimal: number | null | undefined): string {
  if (decimal === null || decimal === undefined || isNaN(decimal)) return "00:00";
  const hours = Math.floor(decimal);
  const minutes = Math.round((decimal - hours) * 60);
  return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
}

export function hoursMinutesToDecimal(timeStr: string | number | null | undefined): number {
  if (timeStr === null || timeStr === undefined || timeStr === "") return 0;
  if (typeof timeStr === 'number') return timeStr;

  const parts = String(timeStr).split(':');
  if (parts.length !== 2) return isNaN(Number(timeStr)) ? 0 : Number(timeStr);

  const hours = parseInt(parts[0], 10);
  const minutes = parseInt(parts[1], 10);
  if (isNaN(hours) || isNaN(minutes)) return 0;
  return hours + (minutes / 60);
}

