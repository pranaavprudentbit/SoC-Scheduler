'use client';

import React, { useMemo } from 'react';
import { Shift, User, ShiftType } from '@/lib/types';
import { Calendar } from 'lucide-react';

interface ExportScheduleProps {
  shifts: Shift[];
  currentUser: User;
}

export const ExportSchedule: React.FC<ExportScheduleProps> = ({ shifts, currentUser }) => {
  const userShifts = useMemo(() => {
    return shifts
      .filter(s => s.userId === currentUser.id)
      .sort((a, b) => a.date.localeCompare(b.date));
  }, [shifts, currentUser.id]);

  const generateICalContent = () => {
    const calendarEvents = userShifts.map(shift => {
      const [year, month, day] = shift.date.split('-');
      
      // Parse times
      const getTimeForShift = (type: ShiftType) => {
        switch (type) {
          case ShiftType.MORNING:
            return { start: '090000', end: '180000' };
          case ShiftType.EVENING:
            return { start: '170000', end: '020000' };
          case ShiftType.NIGHT:
            return { start: '010000', end: '100000' };
        }
      };

      const times = getTimeForShift(shift.type);
      
      return `BEGIN:VEVENT
DTSTART:${year}${month}${day}T${times.start}Z
DTEND:${year}${month}${day}T${times.end}Z
SUMMARY:${shift.type} Shift
DESCRIPTION:${shift.type} Shift - ${shift.lunchStart}-${shift.lunchEnd} Lunch, ${shift.breakStart}-${shift.breakEnd} Break
UID:shift-${shift.id}@soc-scheduler.com
END:VEVENT`;
    });

    const icalContent = `BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//SOC Scheduler//EN
CALSCALE:GREGORIAN
METHOD:PUBLISH
X-WR-CALNAME:My Shifts
X-WR-TIMEZONE:UTC
X-WR-CALDESC:My SOC Schedule
${calendarEvents.join('\n')}
END:VCALENDAR`;

    return icalContent;
  };

  const downloadICalendar = () => {
    const content = generateICalContent();
    const element = document.createElement('a');
    element.setAttribute('href', 'data:text/calendar;charset=utf-8,' + encodeURIComponent(content));
    element.setAttribute('download', `soc-schedule-${currentUser.id}.ics`);
    element.style.display = 'none';
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  const generateCSVContent = () => {
    let csv = 'Date,Day,Shift Type,Start Time,End Time,Lunch,Break,Hours\n';
    
    userShifts.forEach(shift => {
      const date = new Date(shift.date);
      const dayName = date.toLocaleDateString('en-US', { weekday: 'long' });
      
      let startTime = '';
      let endTime = '';
      switch (shift.type) {
        case ShiftType.MORNING:
          startTime = '09:00';
          endTime = '18:00';
          break;
        case ShiftType.EVENING:
          startTime = '17:00';
          endTime = '02:00';
          break;
        case ShiftType.NIGHT:
          startTime = '01:00';
          endTime = '10:00';
          break;
      }

      csv += `"${shift.date}","${dayName}","${shift.type}","${startTime}","${endTime}","${shift.lunchStart}-${shift.lunchEnd}","${shift.breakStart}-${shift.breakEnd}","8"\n`;
    });

    return csv;
  };

  const downloadCSV = () => {
    const content = generateCSVContent();
    const element = document.createElement('a');
    element.setAttribute('href', 'data:text/csv;charset=utf-8,' + encodeURIComponent(content));
    element.setAttribute('download', `soc-schedule-${currentUser.id}.csv`);
    element.style.display = 'none';
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  const generateHTMLContent = () => {
    const html = `
<!DOCTYPE html>
<html>
<head>
  <title>SOC Schedule - ${currentUser.name}</title>
  <style>
    body { font-family: Arial, sans-serif; margin: 20px; background: #f5f5f5; }
    .container { max-width: 900px; margin: 0 auto; background: white; padding: 30px; border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.1); }
    h1 { color: #1f2937; margin-bottom: 10px; }
    .info { color: #666; margin-bottom: 20px; }
    table { width: 100%; border-collapse: collapse; margin-top: 20px; }
    th, td { padding: 12px; text-align: left; border-bottom: 1px solid #e5e7eb; }
    th { background: #f3f4f6; font-weight: bold; color: #1f2937; }
    tr:hover { background: #f9fafb; }
    .morning { background: #fef3c7; }
    .evening { background: #bfdbfe; }
    .night { background: #e5e7eb; }
    .stats { display: grid; grid-template-columns: repeat(3, 1fr); gap: 20px; margin-bottom: 30px; }
    .stat-card { background: #f3f4f6; padding: 15px; border-radius: 8px; text-align: center; }
    .stat-value { font-size: 28px; font-weight: bold; color: #1f2937; }
    .stat-label { color: #666; font-size: 12px; text-transform: uppercase; margin-top: 5px; }
  </style>
</head>
<body>
  <div class="container">
    <h1>📅 SOC Schedule</h1>
    <p class="info">Generated for <strong>${currentUser.name}</strong> on ${new Date().toLocaleDateString()}</p>
    
    <div class="stats">
      <div class="stat-card">
        <div class="stat-value">${userShifts.length}</div>
        <div class="stat-label">Total Shifts</div>
      </div>
      <div class="stat-card">
        <div class="stat-value">${userShifts.length * 8}</div>
        <div class="stat-label">Total Hours</div>
      </div>
      <div class="stat-card">
        <div class="stat-value">${userShifts.filter(s => s.type === ShiftType.MORNING).length + userShifts.filter(s => s.type === ShiftType.EVENING).length + userShifts.filter(s => s.type === ShiftType.NIGHT).length}</div>
        <div class="stat-label">Shifts Assigned</div>
      </div>
    </div>
    
    <table>
      <thead>
        <tr>
          <th>Date</th>
          <th>Day</th>
          <th>Shift</th>
          <th>Time</th>
          <th>Lunch</th>
          <th>Break</th>
        </tr>
      </thead>
      <tbody>
        ${userShifts.map(shift => {
          const date = new Date(shift.date);
          const dayName = date.toLocaleDateString('en-US', { weekday: 'long' });
          let time = '';
          let className = '';
          
          if (shift.type === ShiftType.MORNING) {
            time = '09:00 - 18:00';
            className = 'morning';
          } else if (shift.type === ShiftType.EVENING) {
            time = '17:00 - 02:00';
            className = 'evening';
          } else {
            time = '01:00 - 10:00';
            className = 'night';
          }
          
          return `<tr class="${className}">
            <td>${shift.date}</td>
            <td>${dayName}</td>
            <td>${shift.type}</td>
            <td>${time}</td>
            <td>${shift.lunchStart} - ${shift.lunchEnd}</td>
            <td>${shift.breakStart} - ${shift.breakEnd}</td>
          </tr>`;
        }).join('')}
      </tbody>
    </table>
  </div>
</body>
</html>
    `;
    return html;
  };

  const downloadHTML = () => {
    const content = generateHTMLContent();
    const element = document.createElement('a');
    element.setAttribute('href', 'data:text/html;charset=utf-8,' + encodeURIComponent(content));
    element.setAttribute('download', `soc-schedule-${currentUser.id}.html`);
    element.style.display = 'none';
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  const copyToClipboard = () => {
    const text = userShifts
      .map(
        s =>
          `${new Date(s.date).toLocaleDateString('en-US', {
            weekday: 'short',
            month: 'short',
            day: 'numeric'
          })} - ${s.type} Shift (${s.lunchStart}-${s.lunchEnd} Lunch)`
      )
      .join('\n');

    navigator.clipboard.writeText(text).then(() => {
      alert('Schedule copied to clipboard!');
    });
  };

  return (
    <div className="space-y-8">
      <div>
        <h3 className="text-2xl font-bold text-zinc-900 mb-2">Export Schedule</h3>
        <p className="text-zinc-500 text-sm">Download or share your schedule in various formats</p>
      </div>

      {userShifts.length === 0 ? (
        <div className="text-center py-12 bg-zinc-50 rounded-xl border border-dashed border-zinc-200">
          <Calendar className="mx-auto text-zinc-300 mb-3" size={48} />
          <p className="text-zinc-500 font-medium">No shifts assigned yet</p>
        </div>
      ) : (
        <>
          {/* Export Options */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <button
              onClick={downloadICalendar}
              className="p-5 bg-white border-2 border-blue-200 rounded-xl hover:bg-blue-50 transition-all text-left"
            >
              <div className="flex items-start gap-3">
                <div className="text-2xl">📱</div>
                <div>
                  <div className="font-semibold text-zinc-900">Calendar (.ics)</div>
                  <div className="text-sm text-zinc-600 mt-1">Import to Apple/Google Calendar, Outlook</div>
                </div>
              </div>
              <div className="mt-3 text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded inline-block font-semibold">
                Download
              </div>
            </button>

            <button
              onClick={downloadCSV}
              className="p-5 bg-white border-2 border-emerald-200 rounded-xl hover:bg-emerald-50 transition-all text-left"
            >
              <div className="flex items-start gap-3">
                <div className="text-2xl">📊</div>
                <div>
                  <div className="font-semibold text-zinc-900">Spreadsheet (.csv)</div>
                  <div className="text-sm text-zinc-600 mt-1">Open in Excel, Sheets, or Numbers</div>
                </div>
              </div>
              <div className="mt-3 text-xs bg-emerald-100 text-emerald-700 px-2 py-1 rounded inline-block font-semibold">
                Download
              </div>
            </button>

            <button
              onClick={downloadHTML}
              className="p-5 bg-white border-2 border-amber-200 rounded-xl hover:bg-amber-50 transition-all text-left"
            >
              <div className="flex items-start gap-3">
                <div className="text-2xl">🌐</div>
                <div>
                  <div className="font-semibold text-zinc-900">Web Page (.html)</div>
                  <div className="text-sm text-zinc-600 mt-1">View in any browser, print-friendly</div>
                </div>
              </div>
              <div className="mt-3 text-xs bg-amber-100 text-amber-700 px-2 py-1 rounded inline-block font-semibold">
                Download
              </div>
            </button>

            <button
              onClick={copyToClipboard}
              className="p-5 bg-white border-2 border-purple-200 rounded-xl hover:bg-purple-50 transition-all text-left"
            >
              <div className="flex items-start gap-3">
                <div className="text-2xl">📋</div>
                <div>
                  <div className="font-semibold text-zinc-900">Copy to Clipboard</div>
                  <div className="text-sm text-zinc-600 mt-1">Paste into messages, emails, notes</div>
                </div>
              </div>
              <div className="mt-3 text-xs bg-purple-100 text-purple-700 px-2 py-1 rounded inline-block font-semibold">
                Copy
              </div>
            </button>
          </div>

          {/* Summary */}
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-xl p-6">
            <h4 className="font-semibold text-zinc-900 mb-3">Your Schedule Summary</h4>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <div className="text-2xl font-black text-blue-600">{userShifts.length}</div>
                <div className="text-sm text-zinc-600">Total Shifts</div>
              </div>
              <div>
                <div className="text-2xl font-black text-emerald-600">{userShifts.length * 8}</div>
                <div className="text-sm text-zinc-600">Hours</div>
              </div>
              <div>
                <div className="text-2xl font-black text-amber-600">
                  {userShifts.filter(s => s.type === ShiftType.MORNING).length}M {userShifts.filter(s => s.type === ShiftType.EVENING).length}E {userShifts.filter(s => s.type === ShiftType.NIGHT).length}N
                </div>
                <div className="text-sm text-zinc-600">Shift Types</div>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};
