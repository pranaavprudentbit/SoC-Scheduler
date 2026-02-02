'use client';

import React, { useState, useEffect } from 'react';
import { Clock, Save, RotateCcw, AlertCircle } from 'lucide-react';
import { db, auth } from '@/lib/firebase/config';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { ShiftConfiguration, DEFAULT_SHIFT_CONFIG, ShiftTiming } from '@/lib/shiftConfig';

export const ShiftConfigPanel: React.FC = () => {
  const [config, setConfig] = useState<ShiftConfiguration>(DEFAULT_SHIFT_CONFIG);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadConfig();
  }, []);

  const loadConfig = async () => {
    try {
      const configDoc = await getDoc(doc(db, 'system_config', 'shift_timings'));
      if (configDoc.exists()) {
        setConfig(configDoc.data() as ShiftConfiguration);
      }
    } catch (error) {
      console.error('Error loading config:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await setDoc(doc(db, 'system_config', 'shift_timings'), config);
      alert('✅ Shift timings saved! AI will use these timings for future schedule generation.');

      // Log configuration change
      const user = auth.currentUser;
      if (user) {
        await import('@/lib/logger').then(m => m.logActivity(
          user.uid,
          user.email || 'Admin',
          'System Config Updated',
          'Updated shift timing configurations',
          'OTHER'
        ));
      }

    } catch (error) {
      console.error('Error saving config:', error);
      alert('❌ Failed to save configuration');
    } finally {
      setSaving(false);
    }
  };

  const handleReset = () => {
    if (confirm('Reset all shift timings to default values?')) {
      setConfig(DEFAULT_SHIFT_CONFIG);

      // Log reset
      const user = auth.currentUser;
      if (user) {
        import('@/lib/logger').then(m => m.logActivity(
          user.uid,
          user.email || 'Admin',
          'System Config Reset',
          'Reset shift timings to default',
          'OTHER'
        ));
      }
    }
  };

  const updateTiming = (shiftType: keyof ShiftConfiguration, field: keyof ShiftTiming, value: string | number) => {
    setConfig(prev => ({
      ...prev,
      [shiftType]: {
        ...prev[shiftType],
        [field]: value,
      },
    }));
  };

  const ShiftTimingCard = ({
    type,
    timing,
    color
  }: {
    type: keyof ShiftConfiguration;
    timing: ShiftTiming;
    color: string;
  }) => (
    <div className={`bg-white border-2 ${color} rounded-2xl p-6 shadow-sm`}>
      <div className="flex items-center gap-3 mb-6">
        <div className={`w-12 h-12 ${color.replace('border-', 'bg-').replace('200', '100')} rounded-xl flex items-center justify-center`}>
          <Clock className={color.replace('border-', 'text-').replace('200', '600')} size={24} />
        </div>
        <div>
          <h3 className="text-xl font-bold text-zinc-900">{type} Shift</h3>
          <p className="text-xs text-zinc-500">Configure timing and breaks</p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-semibold text-zinc-700 mb-2">Shift Start</label>
          <input
            type="time"
            value={timing.start}
            onChange={(e) => updateTiming(type, 'start', e.target.value)}
            className="w-full px-3 py-2 border border-zinc-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div>
          <label className="block text-xs font-semibold text-zinc-700 mb-2">Shift End</label>
          <input
            type="time"
            value={timing.end}
            onChange={(e) => updateTiming(type, 'end', e.target.value)}
            className="w-full px-3 py-2 border border-zinc-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      {/* Summary */}
      <div className="mt-4 p-3 bg-zinc-50 rounded-lg">
        <p className="text-xs text-zinc-600">
          <strong>Summary:</strong> {(() => {
            const formatToAmPm = (time: string) => {
              if (!time) return '';
              const [hours, minutes] = time.split(':');
              const h = parseInt(hours, 10);
              const ampm = h >= 12 ? 'PM' : 'AM';
              const h12 = h % 12 || 12;
              return `${h12.toString().padStart(2, '0')}:${minutes} ${ampm}`;
            };
            return `${formatToAmPm(timing.start)} - ${formatToAmPm(timing.end)}`;
          })()} ({timing.workHours}h duration including breaks)
        </p>
      </div>
    </div>
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h3 className="text-2xl font-bold text-zinc-900 mb-2">Shift Times</h3>
        <p className="text-zinc-500 text-sm">Set start and end times for each shift. Used for auto-scheduling.</p>
      </div>

      {/* Info Banner */}
      <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
        <div className="flex items-start gap-3">
          <AlertCircle className="text-blue-600 mt-0.5" size={20} />
          <div>
            <h4 className="text-sm font-semibold text-blue-900 mb-1">Important</h4>
            <ul className="text-xs text-blue-700 space-y-1">
              <li>• Changes apply to <strong>future schedules</strong></li>
              <li>• Existing shifts stay the same</li>
              <li>• Manual shifts always use your chosen time</li>
              <li>• Make sure shift times don't overlap</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Shift Timing Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <ShiftTimingCard type="Night" timing={config.Night} color="border-slate-300" />
        <ShiftTimingCard type="Morning" timing={config.Morning} color="border-amber-200" />
        <ShiftTimingCard type="Evening" timing={config.Evening} color="border-blue-200" />
      </div>

      {/* Action Buttons */}
      <div className="flex gap-3 pt-4">
        <button
          onClick={handleSave}
          disabled={saving}
          className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-xl text-sm font-semibold hover:bg-blue-700 transition-colors disabled:opacity-50"
        >
          <Save size={18} />
          {saving ? 'Saving...' : 'Save Configuration'}
        </button>
        <button
          onClick={handleReset}
          className="flex items-center gap-2 px-6 py-3 bg-zinc-100 text-zinc-700 rounded-xl text-sm font-semibold hover:bg-zinc-200 transition-colors"
        >
          <RotateCcw size={18} />
          Reset to Default
        </button>
      </div>
    </div>
  );
};
