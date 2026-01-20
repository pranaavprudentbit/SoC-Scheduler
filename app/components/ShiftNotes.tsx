'use client';

import React, { useState, useEffect } from 'react';
import { Shift, User, ShiftNote } from '@/lib/types';
import { MessageSquare, Send, Trash2, Clock } from 'lucide-react';
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
    <div className="space-y-6 sm:space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-500 pb-10">
      {/* Tactical Shift Selection Hub */}
      <div className="bg-white border border-zinc-200 rounded-[2.5rem] p-6 sm:p-8 shadow-sm">
        <label className="block text-[10px] font-black text-zinc-400 uppercase tracking-[0.3em] mb-4 text-center sm:text-left">Target Deployment Selection</label>
        <div className="relative group">
          <select
            value={selectedShift}
            onChange={(e) => setSelectedShift(e.target.value)}
            className="w-full bg-zinc-50 border-2 border-zinc-100 text-zinc-900 px-6 py-4 rounded-3xl font-bold appearance-none outline-none focus:border-blue-500 focus:ring-8 focus:ring-blue-500/5 transition-all cursor-pointer text-sm sm:text-base pr-12"
          >
            <option value="">Awaiting Operational Input...</option>
            {userPastShifts.map(shift => (
              <option key={shift.id} value={shift.id}>
                {shift.type.toUpperCase()} DEPLOYMENT // {new Date(shift.date).toLocaleDateString('en-US', {
                  weekday: 'short',
                  month: 'numeric',
                  day: 'numeric'
                })}
              </option>
            ))}
          </select>
          <div className="absolute right-6 top-1/2 -translate-y-1/2 pointer-events-none text-zinc-400 group-hover:text-blue-500 transition-colors">
            <Clock size={18} />
          </div>
        </div>
      </div>

      {selectedShift && selectedShiftData && (
        <div className="bg-zinc-900 rounded-[2.5rem] p-6 sm:p-8 text-white relative overflow-hidden shadow-xl animate-in zoom-in-95 duration-300">
          <div className="absolute top-0 right-0 p-8 opacity-10 pointer-events-none">
            <MessageSquare size={120} />
          </div>
          <div className="relative flex items-center gap-5">
            <div className={`w-14 h-14 rounded-2xl flex items-center justify-center text-3xl ${selectedShiftData.type === 'Morning' ? 'bg-amber-400/20 text-amber-400' :
              selectedShiftData.type === 'Evening' ? 'bg-blue-400/20 text-blue-400' :
                'bg-slate-400/20 text-slate-400'
              }`}>
              {selectedShiftData.type === 'Morning' ? '☀️' : selectedShiftData.type === 'Evening' ? '🌆' : '🌙'}
            </div>
            <div>
              <div className="text-[10px] font-black text-white/40 uppercase tracking-[0.3em] mb-1">Active Intelligence Segment</div>
              <div className="font-black text-lg sm:text-xl tracking-tight uppercase">{selectedShiftData.type} Deployment Record</div>
              <div className="text-xs font-bold text-blue-400 opacity-80 mt-1 uppercase tracking-widest leading-none">
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
        <div className="space-y-6">
          {/* Strat-Note Input Suite */}
          <div className="space-y-4">
            <div className="bg-white border border-zinc-200 rounded-[2.5rem] p-4 sm:p-6 shadow-sm focus-within:ring-8 focus-within:ring-blue-500/5 transition-all">
              <label className="block text-[10px] font-black text-zinc-400 uppercase tracking-[0.2em] mb-3 ml-2">Intelligence Input Field</label>
              <textarea
                value={noteContent}
                onChange={(e) => setNoteContent(e.target.value)}
                placeholder="Log critical handover intel, equipment status, or tactical updates here..."
                rows={4}
                className="w-full bg-zinc-50 border-2 border-zinc-100 rounded-[2rem] p-5 text-sm font-medium outline-none focus:bg-white focus:border-blue-500 transition-all resize-none leading-relaxed"
              />
              <button
                onClick={handleAddNote}
                disabled={loading || !noteContent.trim()}
                className="w-full mt-4 bg-blue-600 hover:bg-blue-700 disabled:bg-zinc-100 disabled:text-zinc-300 text-white py-4 rounded-[1.5rem] font-black uppercase tracking-widest text-xs transition-all flex items-center justify-center gap-3 shadow-lg hover:scale-[1.01] active:scale-95"
              >
                {loading ? (
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-current animate-bounce" />
                    <div className="w-2 h-2 rounded-full bg-current animate-bounce delay-75" />
                    <div className="w-2 h-2 rounded-full bg-current animate-bounce delay-150" />
                  </div>
                ) : (
                  <>
                    <Send size={14} strokeWidth={3} />
                    Transmit Intelligence
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Records Display Chain */}
          <div className="space-y-4">
            <div className="flex items-center justify-between px-2">
              <h4 className="text-[10px] font-black text-zinc-400 uppercase tracking-[0.3em] flex items-center gap-3">
                <MessageSquare size={14} strokeWidth={3} />
                Chronological Intel Chain ({notes.length})
              </h4>
            </div>

            {notes.length === 0 ? (
              <div className="py-20 text-center bg-zinc-50/50 border-2 border-dashed border-zinc-100 rounded-[2.5rem]">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-white text-zinc-200 mb-4 shadow-sm">
                  <MessageSquare size={32} />
                </div>
                <p className="text-[10px] font-black text-zinc-400 uppercase tracking-[0.2em]">Zero Data Entries</p>
                <p className="text-[9px] text-zinc-400 font-bold mt-1 uppercase">Awaiting initial transmission</p>
              </div>
            ) : (
              <div className="space-y-4">
                {notes.map((note, idx) => {
                  const author = getAuthor(note.userId);
                  const isOwn = note.userId === currentUser.id;

                  return (
                    <div
                      key={note.id}
                      className={`p-5 sm:p-6 rounded-[2rem] border-2 transition-all hover:shadow-xl group relative overflow-hidden animate-in slide-in-from-bottom-4 duration-500`}
                      style={{
                        animationDelay: `${idx * 100}ms`,
                        backgroundColor: isOwn ? '#ffffff' : '#f8fafc',
                        borderColor: isOwn ? '#eff6ff' : '#f1f5f9'
                      }}
                    >
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex items-center gap-3">
                          <div className="relative h-10 w-10">
                            <img
                              src={author?.avatar || 'https://via.placeholder.com/40'}
                              alt={author?.name}
                              className="h-10 w-10 rounded-2xl object-cover ring-2 ring-zinc-50"
                            />
                            {isOwn && <div className="absolute -top-1 -right-1 w-3 h-3 bg-blue-500 rounded-full border-2 border-white shadow-sm" />}
                          </div>
                          <div>
                            <div className="text-xs font-black text-zinc-900 uppercase tracking-tight">
                              {author?.name || 'External Signal'}
                              {isOwn && <span className="ml-2 text-[8px] bg-blue-50 text-blue-600 px-1.5 py-0.5 rounded font-black">SELF</span>}
                            </div>
                            <div className="text-[9px] font-bold text-zinc-400 uppercase tracking-widest mt-0.5">
                              {new Date(note.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} //
                              <span className="ml-1">
                                {new Date(note.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                              </span>
                            </div>
                          </div>
                        </div>
                        {isOwn && (
                          <button
                            onClick={() => handleDeleteNote(note.id)}
                            className="p-2.5 text-zinc-300 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all"
                          >
                            <Trash2 size={16} strokeWidth={2.5} />
                          </button>
                        )}
                      </div>
                      <p className="text-sm sm:text-base text-zinc-700 leading-relaxed font-medium whitespace-pre-wrap pl-13">
                        {note.content}
                      </p>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="py-24 text-center bg-zinc-50/50 border-2 border-dashed border-zinc-100 rounded-[3rem] animate-in fade-in duration-700">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-white text-zinc-200 mb-6 shadow-sm">
            <MessageSquare size={40} />
          </div>
          <p className="text-xs font-black text-zinc-400 uppercase tracking-[0.3em]">Operational Vacuum</p>
          <p className="text-[10px] text-zinc-400 font-bold mt-2 uppercase tracking-tight">Select deployment segment to synchronize records</p>
        </div>
      )}

    </div>
  );
};
