// Default shift timing configuration
export interface ShiftTiming {
  start: string; // HH:mm format
  end: string;   // HH:mm format
  lunchStart: string;
  lunchEnd: string;
  breakStart: string;
  breakEnd: string;
  workHours: number; // Actual work hours excluding breaks
}

export interface ShiftConfiguration {
  Night: ShiftTiming;
  Morning: ShiftTiming;
  Evening: ShiftTiming;
}

export const DEFAULT_SHIFT_CONFIG: ShiftConfiguration = {
  Night: {
    start: '01:00',
    end: '09:00',
    lunchStart: '04:30',
    lunchEnd: '05:15',
    breakStart: '07:00',
    breakEnd: '07:15',
    workHours: 8,
  },
  Morning: {
    start: '09:00',
    end: '17:00',
    lunchStart: '12:30',
    lunchEnd: '13:15',
    breakStart: '15:00',
    breakEnd: '15:15',
    workHours: 8,
  },
  Evening: {
    start: '17:00',
    end: '01:00',
    lunchStart: '20:30',
    lunchEnd: '21:15',
    breakStart: '23:00',
    breakEnd: '23:15',
    workHours: 8,
  },
};
