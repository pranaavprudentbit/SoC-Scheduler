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
    end: '10:00',
    lunchStart: '04:30',
    lunchEnd: '05:15',
    breakStart: '08:00',
    breakEnd: '08:15',
    workHours: 9,
  },
  Morning: {
    start: '09:00',
    end: '18:00',
    lunchStart: '13:00',
    lunchEnd: '13:45',
    breakStart: '16:00',
    breakEnd: '16:15',
    workHours: 9,
  },
  Evening: {
    start: '17:00',
    end: '02:00',
    lunchStart: '21:00',
    lunchEnd: '21:45',
    breakStart: '00:00',
    breakEnd: '00:15',
    workHours: 9,
  },
};
