export enum Role {
  ADMIN = 'ADMIN',
  ANALYST = 'ANALYST'
}

export enum ShiftType {
  MORNING = 'Morning', // 09:00 - 18:00 (8 hours work + 1h lunch + 30m break)
  EVENING = 'Evening', // 17:00 - 02:00 (8 hours work + 1h lunch + 30m break)
  NIGHT = 'Night'      // 01:00 - 10:00 (8 hours work + 1h lunch + 30m break)
}

// Scheduling constants
export const SHIFTS_PER_WEEK = 5; // Each user works 5 shifts per week
export const HOURS_PER_SHIFT = 8; // 8 hours of actual work per shift
export const HOURS_PER_WEEK = 40; // Total: 5 shifts × 8 hours = 40 hours/week
export const WORKERS_PER_DAY = 3; // Only 3 people work per day (1 Morning, 1 Evening, 1 Night)
export const REST_DAYS_PER_WEEK = 2; // Each user gets 2 rest days per week

export interface UserPreferences {
  preferredDays: string[]; // ['Monday', 'Wednesday']
  preferredShifts: ShiftType[];
  unavailableDates: string[]; // ISO strings
}

export interface User {
  id: string;
  name: string;
  role: Role;
  isAdmin: boolean; // Determines if user can edit shifts and manage team
  avatar: string;
  preferences: UserPreferences;
}

export interface Shift {
  id: string;
  date: string; // ISO Date string (YYYY-MM-DD)
  type: ShiftType;
  userId: string;
  lunchStart: string; // HH:mm
  lunchEnd: string; // HH:mm
  breakStart: string; // HH:mm
  breakEnd: string; // HH:mm
  manuallyCreated?: boolean; // If true, AI cannot override this shift
  createdBy?: string; // Admin user ID who created it
}

export interface SwapRequest {
  id: string;
  requesterId: string;
  requesterName?: string;
  targetShiftId: string; // The shift the requester wants to give away or swap
  targetShiftDate: string;
  targetShiftType: ShiftType;
  recipientId?: string; // Optional specific target, or open to pool
  offeredShiftId?: string; // Optional: shift offered in exchange
  offeredShiftDate?: string;
  offeredShiftType?: ShiftType;
  status: 'PENDING' | 'ACCEPTED' | 'REJECTED';
  reason?: string; // Why user wants to swap
  createdAt: string;
  respondedAt?: string;
  respondedBy?: string;
}

export interface LeaveRequest {
  id: string;
  userId: string;
  date: string; // ISO Date string (YYYY-MM-DD)
  reason: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  createdAt: string;
  reviewedBy?: string; // Admin user ID who approved/rejected
  reviewedAt?: string;
}

// Stats for dashboard
export interface TeamStats {
  totalShifts: number;
  nightShiftDistribution: Record<string, number>; // userId -> count
  coverageIssues: number;
}
