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
  Morning: ShiftTiming;
  Evening: ShiftTiming;
  Night: ShiftTiming;
}

export const DEFAULT_SHIFT_CONFIG: ShiftConfiguration = {
  Morning: {
    start: '09:00',
    end: '18:00',
    lunchStart: '12:00',
    lunchEnd: '13:00',
    breakStart: '15:30',
    breakEnd: '16:00',
    workHours: 8,
  },
  Evening: {
    start: '17:00',
    end: '02:00',
    lunchStart: '20:00',
    lunchEnd: '21:00',
    breakStart: '23:30',
    breakEnd: '00:00',
    workHours: 8,
  },
  Night: {
    start: '01:00',
    end: '10:00',
    lunchStart: '04:00',
    lunchEnd: '05:00',
    breakStart: '07:30',
    breakEnd: '08:00',
    workHours: 8,
  },
};
