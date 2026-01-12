'use client';

import React, { useState } from 'react';
import { User, Shift, ShiftType } from '@/lib/types';
import { Plus, Edit2, Trash2, Save, X, Sun, Sunset, Moon } from 'lucide-react';
import { db } from '@/lib/firebase/config';
import { collection, addDoc, updateDoc, deleteDoc, doc } from 'firebase/firestore';

interface ShiftManagementProps {
  users: User[];
  shifts: Shift[];
  onRefresh: () => void;
}

export const ShiftManagement: React.FC<ShiftManagementProps> = ({ 
  users, 
  shifts, 
  onRefresh
}) => {
  const [isCreating, setIsCreating] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    date: new Date().toISOString().split('T')[0],
    type: ShiftType.MORNING,
    userId: users[0]?.id || '',
    lunchStart: '12:00',
    lunchEnd: '13:00',
    breakStart: '15:30',
    breakEnd: '16:00',
  });

  const getDefaultBreaks = (type: ShiftType) => {
    switch (type) {
      case ShiftType.MORNING:
        return { lunchStart: '12:00', lunchEnd: '13:00', breakStart: '15:30', breakEnd: '16:00' };
      case ShiftType.EVENING:
        return { lunchStart: '20:00', lunchEnd: '21:00', breakStart: '23:30', breakEnd: '00:00' };
      case ShiftType.NIGHT:
        return { lunchStart: '04:00', lunchEnd: '05:00', breakStart: '07:30', breakEnd: '08:00' };
    }
  };

  const handleShiftTypeChange = (type: ShiftType) => {
    const breaks = getDefaultBreaks(type);
    setFormData({ ...formData, type, ...breaks });
  };

  const handleCreate = async () => {
    try {
      // Check if there's already a shift of this type on this date
      const existingShift = shifts.find(
        s => s.date === formData.date && s.type === formData.type
      );
      
      if (existingShift) {
        const user = users.find(u => u.id === existingShift.userId);
        console.warn(`${formData.type} shift on ${formData.date} is already assigned to ${user?.name || 'someone'}. Only one person per shift type per day.`);
        return;
      }

      await addDoc(collection(db, 'shifts'), {
        date: formData.date,
        shift: formData.type,
        userId: formData.userId,
        lunchStart: formData.lunchStart,
        lunchEnd: formData.lunchEnd,
        breakStart: formData.breakStart,
        breakEnd: formData.breakEnd,
        createdAt: new Date().toISOString(),
      });
      
      setIsCreating(false);
      onRefresh();
    } catch (error) {
      console.error('Error creating shift:', error);
    }
  };

  const handleUpdate = async (shift: Shift) => {
    try {
      // Check if there's already another shift of this type on this date (excluding current one)
      const existingShift = shifts.find(
        s => s.date === formData.date && s.type === formData.type && s.id !== shift.id
      );
      
      if (existingShift) {
        const user = users.find(u => u.id === existingShift.userId);
        console.warn(`${formData.type} shift on ${formData.date} is already assigned to ${user?.name || 'someone'}. Only one person per shift type per day.`);
        return;
      }

      const shiftRef = doc(db, 'shifts', shift.id);
      await updateDoc(shiftRef, {
        date: formData.date,
        shift: formData.type,
        userId: formData.userId,
        lunchStart: formData.lunchStart,
        lunchEnd: formData.lunchEnd,
        breakStart: formData.breakStart,
        breakEnd: formData.breakEnd,
      });
      
      setEditingId(null);
      onRefresh();
    } catch (error) {
      console.error('Error updating shift:', error);
    }
  };

  const handleDelete = async (shiftId: string) => {
    if (!confirm('Are you sure you want to delete this shift?')) return;
    
    try {
      await deleteDoc(doc(db, 'shifts', shiftId));
      onRefresh();
    } catch (error) {
      console.error('Error deleting shift:', error);
    }
  };

  const startEditing = (shift: Shift) => {
    setEditingId(shift.id);
    setFormData({
      date: shift.date,
      type: shift.type,
      userId: shift.userId,
      lunchStart: shift.lunchStart,
      lunchEnd: shift.lunchEnd,
      breakStart: shift.breakStart,
      breakEnd: shift.breakEnd,
    });
  };

  const getShiftIcon = (type: ShiftType) => {
    switch (type) {
      case ShiftType.MORNING: return <Sun className="text-amber-600" size={16} />;
      case ShiftType.EVENING: return <Sunset className="text-blue-600" size={16} />;
      case ShiftType.NIGHT: return <Moon className="text-slate-400" size={16} />;
    }
  };

  const getShiftTime = (type: ShiftType) => {
    switch (type) {
      case ShiftType.MORNING: return '9AM - 6PM';
      case ShiftType.EVENING: return '5PM - 2AM';
      case ShiftType.NIGHT: return '1AM - 10AM';
    }
  };

  // Sort shifts by date (newest first) and limit display
  const sortedShifts = [...shifts].sort((a, b) => b.date.localeCompare(a.date)).slice(0, 50);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-xl font-semibold text-zinc-900">Manual Shift Management</h3>
          <p className="text-zinc-500 text-sm mt-1">Create, edit, and delete shifts manually</p>
        </div>
        
        <button
          onClick={() => {
            setIsCreating(!isCreating);
            setEditingId(null);
            setFormData({
              date: new Date().toISOString().split('T')[0],
              type: ShiftType.MORNING,
              userId: users[0]?.id || '',
              ...getDefaultBreaks(ShiftType.MORNING),
            });
          }}
          className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 text-white rounded-xl text-sm font-semibold hover:bg-blue-700 transition-all"
        >
          {isCreating ? <X size={16} /> : <Plus size={16} />}
          {isCreating ? 'Cancel' : 'Create Shift'}
        </button>
      </div>

      {/* Create Form */}
      {isCreating && (
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-6 space-y-4">
          <h4 className="font-semibold text-zinc-900 text-sm">New Shift</h4>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-zinc-700 mb-1.5">Date</label>
              <input
                type="date"
                value={formData.date}
                onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                className="w-full px-3 py-2 border border-zinc-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            
            <div>
              <label className="block text-xs font-medium text-zinc-700 mb-1.5">User</label>
              <select
                value={formData.userId}
                onChange={(e) => setFormData({ ...formData, userId: e.target.value })}
                className="w-full px-3 py-2 border border-zinc-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {users.map(u => (
                  <option key={u.id} value={u.id}>{u.name}</option>
                ))}
              </select>
            </div>
            
            <div className="col-span-2">
              <label className="block text-xs font-medium text-zinc-700 mb-1.5">Shift Type</label>
              <div className="grid grid-cols-3 gap-2">
                {[ShiftType.MORNING, ShiftType.EVENING, ShiftType.NIGHT].map(type => (
                  <button
                    key={type}
                    onClick={() => handleShiftTypeChange(type)}
                    className={`flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all ${
                      formData.type === type
                        ? 'bg-blue-600 text-white'
                        : 'bg-white border border-zinc-300 text-zinc-700 hover:bg-zinc-50'
                    }`}
                  >
                    {getShiftIcon(type)}
                    {type}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button
              onClick={() => setIsCreating(false)}
              className="px-4 py-2 text-sm text-zinc-600 hover:text-zinc-900 font-medium"
            >
              Cancel
            </button>
            <button
              onClick={handleCreate}
              className="flex items-center gap-2 px-5 py-2 bg-blue-600 text-white rounded-lg text-sm font-semibold hover:bg-blue-700"
            >
              <Save size={16} />
              Create Shift
            </button>
          </div>
        </div>
      )}

      {/* Shifts List */}
      <div className="space-y-2">
        <div className="text-xs text-zinc-500 mb-3">Showing {sortedShifts.length} most recent shifts</div>
        {sortedShifts.map(shift => {
          const user = users.find(u => u.id === shift.userId);
          const isEditing = editingId === shift.id;

          if (isEditing) {
            return (
              <div key={shift.id} className="bg-amber-50 border border-amber-200 rounded-xl p-4 space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-zinc-700 mb-1.5">Date</label>
                    <input
                      type="date"
                      value={formData.date}
                      onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                      className="w-full px-3 py-2 border border-zinc-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-xs font-medium text-zinc-700 mb-1.5">User</label>
                    <select
                      value={formData.userId}
                      onChange={(e) => setFormData({ ...formData, userId: e.target.value })}
                      className="w-full px-3 py-2 border border-zinc-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
                    >
                      {users.map(u => (
                        <option key={u.id} value={u.id}>{u.name}</option>
                      ))}
                    </select>
                  </div>
                  
                  <div className="col-span-2">
                    <label className="block text-xs font-medium text-zinc-700 mb-1.5">Shift Type</label>
                    <div className="grid grid-cols-3 gap-2">
                      {[ShiftType.MORNING, ShiftType.EVENING, ShiftType.NIGHT].map(type => (
                        <button
                          key={type}
                          onClick={() => handleShiftTypeChange(type)}
                          className={`flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all ${
                            formData.type === type
                              ? 'bg-amber-600 text-white'
                              : 'bg-white border border-zinc-300 text-zinc-700 hover:bg-zinc-50'
                          }`}
                        >
                          {getShiftIcon(type)}
                          {type}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="flex justify-end gap-2 pt-2">
                  <button
                    onClick={() => setEditingId(null)}
                    className="px-4 py-2 text-sm text-zinc-600 hover:text-zinc-900 font-medium"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => handleUpdate(shift)}
                    className="flex items-center gap-2 px-5 py-2 bg-amber-600 text-white rounded-lg text-sm font-semibold hover:bg-amber-700"
                  >
                    <Save size={16} />
                    Save Changes
                  </button>
                </div>
              </div>
            );
          }

          return (
            <div
              key={shift.id}
              className="flex items-center justify-between p-4 bg-white border border-zinc-200 rounded-xl hover:border-zinc-300 transition-all"
            >
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  {getShiftIcon(shift.type)}
                  <span className="font-semibold text-zinc-900 text-sm">{shift.type}</span>
                </div>
                
                <div className="text-sm text-zinc-500">{shift.date}</div>
                
                <div className="text-sm text-zinc-500">{getShiftTime(shift.type)}</div>
                
                <div className="flex items-center gap-2">
                  <img
                    src={user?.avatar || `https://picsum.photos/seed/${shift.userId}/200`}
                    alt={user?.name}
                    className="w-6 h-6 rounded-full"
                  />
                  <span className="text-sm font-medium text-zinc-700">{user?.name}</span>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => startEditing(shift)}
                  className="p-2 text-zinc-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all"
                  title="Edit shift"
                >
                  <Edit2 size={16} />
                </button>
                <button
                  onClick={() => handleDelete(shift.id)}
                  className="p-2 text-zinc-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
                  title="Delete shift"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
