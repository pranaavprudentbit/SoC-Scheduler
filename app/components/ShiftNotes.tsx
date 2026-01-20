'use client';

import React, { useState, useEffect } from 'react';
import { Shift, User, ShiftNote } from '@/lib/types';
import { MessageSquare, Send, Trash2 } from 'lucide-react';
import { collection, addDoc, getDocs, query, where, deleteDoc, doc } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';

interface ShiftNotesProps {
  shifts: Shift[];
  currentUser: User;
  users: User[];
}

export const ShiftNotes: React.FC<ShiftNotesProps> = ({ shifts, currentUser, users }) => {
  const [notes, setNotes] = useState<ShiftNote[]>([]);
  const [selectedShift, setSelectedShift] = useState<string>('');
  const [noteContent, setNoteContent] = useState('');
  const [loading, setLoading] = useState(false);

  // Get user's past shifts for selecting
  const userPastShifts = shifts.filter(
    s => s.userId === currentUser.id && s.date < new Date().toISOString().split('T')[0]
  ).sort((a, b) => b.date.localeCompare(a.date));

  useEffect(() => {
    loadNotes();
  }, [selectedShift]);

  const loadNotes = async () => {
    if (!selectedShift) return;

    try {
      const q = query(collection(db, 'shift_notes'), where('shiftId', '==', selectedShift));
      const snapshot = await getDocs(q);
      const loadedNotes = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as ShiftNote));
      setNotes(loadedNotes);
    } catch (error) {
      console.error('Error loading notes:', error);
    }
  };

  const handleAddNote = async () => {
    if (!selectedShift || !noteContent.trim()) {
      alert('Select a shift and add a note');
      return;
    }

    setLoading(true);
    try {
      await addDoc(collection(db, 'shift_notes'), {
        shiftId: selectedShift,
        userId: currentUser.id,
        content: noteContent,
        createdAt: new Date().toISOString()
      });

      setNoteContent('');
      await loadNotes();
    } catch (error) {
      console.error('Error adding note:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteNote = async (noteId: string) => {
    if (!confirm('Delete this note?')) return;

    try {
      await deleteDoc(doc(db, 'shift_notes', noteId));
      await loadNotes();
    } catch (error) {
      console.error('Error deleting note:', error);
    }
  };

  const getAuthor = (userId: string) => users.find(u => u.id === userId);

  const selectedShiftData = shifts.find(s => s.id === selectedShift);

  return (
    <div className="space-y-8">
      {/* Shift Selector */}
      <div className="bg-white border border-zinc-200 rounded-xl p-5">
        <label className="block text-sm font-semibold text-zinc-700 mb-3">Select a Past Shift</label>
        <select
          value={selectedShift}
          onChange={(e) => setSelectedShift(e.target.value)}
          className="w-full px-4 py-3 border border-zinc-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="">Choose a shift...</option>
          {userPastShifts.map(shift => (
            <option key={shift.id} value={shift.id}>
              {shift.type} - {new Date(shift.date).toLocaleDateString('en-US', {
                weekday: 'short',
                month: 'short',
                day: 'numeric'
              })}
            </option>
          ))}
        </select>
      </div>

      {selectedShift && selectedShiftData && (
        <div className="bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-200 rounded-xl p-5">
          <div className="flex items-center gap-3">
            <div className="text-3xl">
              {selectedShiftData.type === 'Morning' ? '☀️' : selectedShiftData.type === 'Evening' ? '🌆' : '🌙'}
            </div>
            <div>
              <div className="font-semibold text-blue-900">{selectedShiftData.type} Shift</div>
              <div className="text-sm text-blue-700">
                {new Date(selectedShiftData.date).toLocaleDateString('en-US', {
                  weekday: 'long',
                  month: 'long',
                  day: 'numeric',
                  year: 'numeric'
                })}
              </div>
            </div>
          </div>
        </div>
      )}

      {selectedShift ? (
        <>
          {/* Note Input */}
          <div className="space-y-3">
            <label className="block text-sm font-semibold text-zinc-700">Add a Note</label>
            <textarea
              value={noteContent}
              onChange={(e) => setNoteContent(e.target.value)}
              placeholder="e.g., 'Printer broken - use backup in break room. Customer A called at 3pm, scheduled callback for evening shift.'"
              rows={3}
              className="w-full px-4 py-3 border border-zinc-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
            />
            <button
              onClick={handleAddNote}
              disabled={loading || !noteContent.trim()}
              className="w-full px-4 py-3 bg-blue-600 text-white rounded-lg text-sm font-semibold hover:bg-blue-700 disabled:opacity-50 transition-all flex items-center justify-center gap-2"
            >
              <Send size={16} />
              {loading ? 'Adding...' : 'Add Note'}
            </button>
          </div>

          {/* Notes List */}
          <div>
            <h4 className="text-sm font-semibold text-zinc-900 mb-3 flex items-center gap-2">
              <MessageSquare size={16} className="text-zinc-600" />
              Notes ({notes.length})
            </h4>

            {notes.length === 0 ? (
              <div className="text-center py-8 bg-zinc-50 rounded-xl border border-dashed border-zinc-200">
                <MessageSquare className="mx-auto text-zinc-300 mb-2" size={32} />
                <p className="text-zinc-500 text-sm">No notes yet</p>
              </div>
            ) : (
              <div className="space-y-3">
                {notes.map(note => {
                  const author = getAuthor(note.userId);
                  const isOwn = note.userId === currentUser.id;

                  return (
                    <div
                      key={note.id}
                      className={`p-4 rounded-lg border ${isOwn
                          ? 'bg-blue-50 border-blue-200'
                          : 'bg-white border-zinc-200'
                        } hover:shadow-md transition-all`}
                    >
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <img
                            src={author?.avatar || 'https://via.placeholder.com/32'}
                            alt={author?.name}
                            className="w-8 h-8 rounded-full"
                          />
                          <div>
                            <div className="text-sm font-semibold text-zinc-900">
                              {author?.name || 'Unknown'}
                            </div>
                            <div className="text-xs text-zinc-500">
                              {new Date(note.createdAt).toLocaleDateString('en-US', {
                                month: 'short',
                                day: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit'
                              })}
                            </div>
                          </div>
                        </div>
                        {isOwn && (
                          <button
                            onClick={() => handleDeleteNote(note.id)}
                            className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-all"
                            title="Delete note"
                          >
                            <Trash2 size={16} />
                          </button>
                        )}
                      </div>
                      <p className="text-sm text-zinc-700 leading-relaxed whitespace-pre-wrap">{note.content}</p>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </>
      ) : (
        <div className="text-center py-12 bg-zinc-50 rounded-xl border border-dashed border-zinc-200">
          <MessageSquare className="mx-auto text-zinc-300 mb-3" size={48} />
          <p className="text-zinc-500 font-medium">Select a shift to view or add notes</p>
        </div>
      )}

      {/* Info */}
      <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
        <p className="text-sm text-amber-900">
          <span className="font-bold">💡 Tips:</span> Leave clear handover notes for the next person. Include issues, customer follow-ups, or equipment status.
        </p>
      </div>
    </div>
  );
};
