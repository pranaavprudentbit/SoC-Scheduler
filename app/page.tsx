'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Sidebar } from './components/Sidebar';
import { CalendarView } from './components/CalendarView';
import { MonthCalendarView } from './components/MonthCalendarView';
import { AdminPanel } from './components/AdminPanel';
import { SwapMarketplace } from './components/SwapMarketplace';
import { PreferencesPanel } from './components/PreferencesPanel';
import { Calendar, Clock, RefreshCw } from 'lucide-react';
import { User, Role, Shift, SwapRequest, LeaveRequest, ShiftType } from '@/lib/types';
import { auth, db } from '@/lib/firebase/config';
import { onAuthStateChanged } from 'firebase/auth';
import { collection, getDocs, updateDoc, doc } from 'firebase/firestore';

export default function Home() {
  const [users, setUsers] = useState<User[]>([]);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [shifts, setShifts] = useState<Shift[]>([]);
  const [swaps, setSwaps] = useState<SwapRequest[]>([]);
  const [leaveRequests, setLeaveRequests] = useState<LeaveRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [scheduleDate, setScheduleDate] = useState(new Date());

  const router = useRouter();

  // Fetch current user and all data
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (authUser) => {
      if (!authUser) {
        router.push('/login');
        return;
      }

      try {
        // Fetch all users
        const usersSnapshot = await getDocs(collection(db, 'users'));
        const formattedUsers: User[] = usersSnapshot.docs.map((doc) => {
          const data = doc.data();
          return {
            id: doc.id,
            name: data.name,
            role: data.role as Role,
            isAdmin: data.isAdmin === true, // Read isAdmin from database
            avatar: data.avatar || `https://picsum.photos/seed/${doc.id}/200`,
            preferences: {
              preferredDays: data.preferredDays || [],
              preferredShifts: data.preferredShifts || [],
              unavailableDates: data.unavailableDates || [],
            },
          };
        });
        setUsers(formattedUsers);

        // Set current user
        const current = formattedUsers.find((u) => u.id === authUser.uid);
        if (current) setCurrentUser(current);

        // Fetch shifts
        const shiftsSnapshot = await getDocs(collection(db, 'shifts'));
        const formattedShifts: Shift[] = shiftsSnapshot.docs.map((doc) => {
          const data = doc.data();
          return {
            id: doc.id,
            date: data.date,
            type: data.shift,
            userId: data.userId,
            lunchStart: data.lunchStart,
            lunchEnd: data.lunchEnd,
            breakStart: data.breakStart,
            breakEnd: data.breakEnd,
            manuallyCreated: data.manuallyCreated || false,
          };
        });
        setShifts(formattedShifts);

        // Fetch swap requests
        const swapsSnapshot = await getDocs(collection(db, 'swap_requests'));
        const formattedSwaps: SwapRequest[] = swapsSnapshot.docs.map((doc) => {
          const data = doc.data();
          return {
            id: doc.id,
            requesterId: data.requesterId,
            targetShiftId: data.shiftId || data.targetShiftId,
            targetShiftDate: data.targetShiftDate || '',
            targetShiftType: data.targetShiftType || ShiftType.MORNING,
            recipientId: data.acceptedBy || data.recipientId,
            status: data.status,
            createdAt: data.createdAt,
          };
        });
        setSwaps(formattedSwaps);

        // Fetch leave requests
        const leaveSnapshot = await getDocs(collection(db, 'leave_requests'));
        const formattedLeaves: LeaveRequest[] = leaveSnapshot.docs.map((doc) => {
          const data = doc.data();
          return {
            id: doc.id,
            userId: data.userId,
            date: data.date,
            reason: data.reason,
            status: data.status,
            createdAt: data.createdAt,
            reviewedBy: data.reviewedBy,
            reviewedAt: data.reviewedAt,
          };
        });
        setLeaveRequests(formattedLeaves);

      } catch (error) {
        console.error('Error loading data:', error);
      } finally {
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, [router]);

  const handleUserUpdate = async (updatedUser: User) => {
    // Update in Firestore
    const userRef = doc(db, 'users', updatedUser.id);
    await updateDoc(userRef, {
      preferredDays: updatedUser.preferences.preferredDays,
      preferredShifts: updatedUser.preferences.preferredShifts,
      unavailableDates: updatedUser.preferences.unavailableDates,
    });

    setUsers(users.map(u => u.id === updatedUser.id ? updatedUser : u));
    setCurrentUser(updatedUser);
  };

  const refreshData = async () => {
    try {
      // Refresh users
      const usersSnapshot = await getDocs(collection(db, 'users'));
      const formattedUsers: User[] = usersSnapshot.docs.map((doc) => {
        const data = doc.data();
        return {
          id: doc.id,
          name: data.name,
          role: data.role as Role,
          isAdmin: data.isAdmin === true,
          avatar: data.avatar || `https://picsum.photos/seed/${doc.id}/200`,
          preferences: {
            preferredDays: data.preferredDays || [],
            preferredShifts: data.preferredShifts || [],
            unavailableDates: data.unavailableDates || [],
          },
        };
      });
      setUsers(formattedUsers);

      // Refresh shifts
      const shiftsSnapshot = await getDocs(collection(db, 'shifts'));
      const formattedShifts: Shift[] = shiftsSnapshot.docs.map((doc) => {
        const data = doc.data();
        return {
          id: doc.id,
          date: data.date,
          type: data.shift,
          userId: data.userId,
          lunchStart: data.lunchStart,
          lunchEnd: data.lunchEnd,
          breakStart: data.breakStart,
          breakEnd: data.breakEnd,
          manuallyCreated: data.manuallyCreated || false,
        };
      });
      setShifts(formattedShifts);

      // Refresh swaps
      const swapsSnapshot = await getDocs(collection(db, 'swap_requests'));
      const formattedSwaps: SwapRequest[] = swapsSnapshot.docs.map((doc) => {
        const data = doc.data();
        return {
          id: doc.id,
          requesterId: data.requesterId,
          targetShiftId: data.shiftId || data.targetShiftId,
          targetShiftDate: data.targetShiftDate || '',
          targetShiftType: data.targetShiftType || ShiftType.MORNING,
          recipientId: data.acceptedBy || data.recipientId,
          status: data.status,
          createdAt: data.createdAt,
        };
      });
      setSwaps(formattedSwaps);

      // Refresh leave requests
      const leaveSnapshot = await getDocs(collection(db, 'leave_requests'));
      const formattedLeaves: LeaveRequest[] = leaveSnapshot.docs.map((doc) => {
        const data = doc.data();
        return {
          id: doc.id,
          userId: data.userId,
          date: data.date,
          reason: data.reason,
          status: data.status,
          createdAt: data.createdAt,
          reviewedBy: data.reviewedBy,
          reviewedAt: data.reviewedAt,
        };
      });
      setLeaveRequests(formattedLeaves);
    } catch (error) {
      console.error('Error refreshing data:', error);
    }
  };

  if (loading || !currentUser) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-zinc-400">Loading...</div>
      </div>
    );
  }

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return (
          <div className="animate-in fade-in duration-300 space-y-8">
            <header>
              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black text-zinc-900 mb-1 tracking-tight">Welcome back, {currentUser.name.split(' ')[0]} 👋</h1>
              <p className="text-sm font-medium text-zinc-500">You're on top of your schedule</p>
            </header>

            {/* Premium Stats Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 mb-10">
              <div className="group relative bg-gradient-to-br from-indigo-600 via-blue-600 to-blue-700 rounded-[2rem] p-6 shadow-[0_20px_50px_rgba(59,130,246,0.2)] hover:shadow-blue-500/30 transition-all overflow-hidden border border-white/10">
                <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16 blur-2xl group-hover:bg-white/20 transition-all"></div>
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-2 bg-white/20 rounded-lg backdrop-blur-md">
                    <Calendar className="text-white" size={18} />
                  </div>
                  <span className="text-xs font-black text-blue-100 uppercase tracking-[0.2em]">Next Shift</span>
                </div>
                <div className="flex flex-wrap items-baseline gap-2">
                  <span className="text-3xl font-black text-white tracking-tight">Tomorrow</span>
                </div>
                <div className="text-sm text-blue-100 mt-2 font-bold bg-white/10 w-fit px-3 py-1 rounded-full backdrop-blur-sm">
                  09:00 - 18:00
                </div>
              </div>

              <div className="group relative bg-gradient-to-br from-emerald-500 via-teal-600 to-emerald-700 rounded-[2rem] p-6 shadow-[0_20px_50px_rgba(16,185,129,0.2)] hover:shadow-emerald-500/30 transition-all overflow-hidden border border-white/10">
                <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16 blur-2xl group-hover:bg-white/20 transition-all"></div>
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-2 bg-white/20 rounded-lg backdrop-blur-md">
                    <Clock className="text-white" size={18} />
                  </div>
                  <span className="text-xs font-black text-emerald-100 uppercase tracking-[0.2em]">Weekly Hours</span>
                </div>
                <div className="flex flex-wrap items-baseline gap-2">
                  <span className="text-3xl font-black text-white tracking-tight">{shifts.filter(s => s.userId === currentUser.id).length * 8}</span>
                  <span className="text-lg text-emerald-100 font-bold">/ 40h</span>
                </div>
                <div className="mt-4 h-1.5 w-full bg-black/10 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-white rounded-full transition-all duration-1000 ease-out shadow-[0_0_10px_rgba(255,255,255,0.5)]"
                    style={{ width: `${Math.min((shifts.filter(s => s.userId === currentUser.id).length * 8 / 40) * 100, 100)}%` }}
                  />
                </div>
              </div>

              <div className="group relative bg-gradient-to-br from-amber-500 to-orange-600 rounded-[2rem] p-6 shadow-[0_20px_50px_rgba(245,158,11,0.2)] hover:shadow-amber-500/30 transition-all overflow-hidden border border-white/10 sm:col-span-2 lg:col-span-1">
                <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16 blur-2xl group-hover:bg-white/20 transition-all"></div>
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-2 bg-white/20 rounded-lg backdrop-blur-md">
                    <RefreshCw className="text-white" size={18} />
                  </div>
                  <span className="text-xs font-black text-amber-100 uppercase tracking-[0.2em]">Open Swaps</span>
                </div>
                <div className="flex flex-wrap items-baseline gap-2">
                  <span className="text-3xl font-black text-white tracking-tight">{swaps.filter(s => s.status === 'PENDING').length}</span>
                  <span className="text-lg text-amber-100 font-bold">Available</span>
                </div>
                <p className="text-xs text-amber-100 mt-2 font-medium opacity-80">Check the market for matches</p>
              </div>
            </div>

            <CalendarView
              shifts={shifts}
              users={users}
              currentDate={scheduleDate}
              onDateChange={setScheduleDate}
              userId={currentUser.id}
              showAll={true}
              showTodayOnly={false}
              hideViewToggle={true}
            />
          </div>
        );
      case 'calendar':
        return <div className="animate-in fade-in duration-300"><MonthCalendarView shifts={shifts} users={users} /></div>;
      case 'admin':
        if (!currentUser.isAdmin) return <div className="text-red-500 mt-10 text-center"><p className="text-xl font-semibold">Access Denied</p><p className="text-sm text-zinc-500 mt-2">Admin privileges required</p></div>;
        return <div className="animate-in fade-in duration-300"><AdminPanel users={users} shifts={shifts} leaveRequests={leaveRequests} currentUser={currentUser} setShifts={setShifts} onRefresh={refreshData} /></div>;
      case 'swaps':
        return <div className="animate-in fade-in duration-300"><SwapMarketplace currentUser={currentUser} users={users} shifts={shifts} onRefresh={refreshData} /></div>;
      case 'preferences':
        return (
          <div className="animate-in fade-in duration-300">
            <PreferencesPanel
              currentUser={currentUser}
              shifts={shifts}
              users={users}
              swaps={swaps}
              leaveRequests={leaveRequests}
              onUpdate={handleUserUpdate}
              onRefresh={refreshData}
            />
          </div>
        );
      default:
        return <div>Tab not found</div>;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-zinc-50 to-zinc-100 text-zinc-900 font-sans selection:bg-blue-100 selection:text-blue-900">
      <Sidebar
        currentUser={currentUser}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        users={users}
        setCurrentUser={setCurrentUser}
      />

      <main className="max-w-7xl mx-auto pt-20 sm:pt-24 px-4 sm:px-6 lg:px-8 pb-24 sm:pb-12">
        {renderContent()}
      </main>
    </div>
  );
}
