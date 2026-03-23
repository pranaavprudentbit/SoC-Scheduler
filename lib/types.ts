export enum Role {
  ADMIN = 'ADMIN',
  ANALYST = 'ANALYST'
}

export enum ShiftType {
  NIGHT = 'Night',      // 01:00 - 09:00 (8 hours work included breaks)
  MORNING = 'Morning', // 09:00 - 17:00 (8 hours work included breaks)
  EVENING = 'Evening', // 17:00 - 01:00 (8 hours work included breaks)
}

// Scheduling constants
export const SHIFTS_PER_WEEK = 5; // Each user works 5 shifts per week
export const HOURS_PER_SHIFT = 9; // 9 hours (8 hours work + 1 hour break)
export const HOURS_PER_WEEK = 45; // Total: 5 shifts × 9 hours = 45 hours/week
export const WORKERS_PER_DAY = 3; // Minimum 3 people (1 per shift), can be up to 6
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
  isActive?: boolean;
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
  createdBy?: string; // Admin user ID who created it
  createdAt?: string; // ISO timestamp for stable sorting
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

// Shift Notes & Handover
export interface ShiftNote {
  id: string;
  shiftId: string;
  userId: string; // Who wrote the note
  content: string;
  isAdmin?: boolean; // Admin broadcast notes
  createdAt: string;
}

// Availability Management
export interface UserAvailability {
  id?: string;
  userId: string;
  date: string; // ISO date
  available: boolean;
  reason?: string; // "Vacation", "Sick", etc.
  weekUnavailable?: boolean; // Mark entire week unavailable
}

// Performance Metrics
export interface PerformanceMetrics {
  userId: string;
  shiftsCompleted: number;
  totalHours: number;
  cancellations: number;
  swapsAccepted: number;
  swapsOffered: number;
  reliabilityScore: number; // 0-100
  lastUpdated: string;
}

// Clock In/Out Tracking
export interface ClockEntry {
  id: string;
  shiftId: string;
  userId: string;
  clockInTime: string; // ISO timestamp
  clockOutTime?: string; // ISO timestamp
  actualHours?: number;
  notes?: string;
  createdAt: string;
}

// Team Coverage Status
export interface CoverageStatus {
  date: string;
  shiftType: ShiftType;
  assignedCount: number;
  requiredCount: number; // Should be 1 per shift type
  status: 'UNDERSTAFFED' | 'OK' | 'OVERSTAFFED';
}

// User Badges & Achievements
export interface Badge {
  id: string;
  name: string; // "Perfect Attendance", "Swap Master"
  description: string;
  icon: string; // emoji or icon name
  earnedDate: string;
}
