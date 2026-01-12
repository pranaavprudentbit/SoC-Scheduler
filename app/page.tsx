'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Sidebar } from './components/Sidebar';
import { CalendarView } from './components/CalendarView';
import { MonthCalendarView } from './components/MonthCalendarView';
import { AdminPanel } from './components/AdminPanel';
import { SwapMarketplace } from './components/SwapMarketplace';
import { PreferencesPanel } from './components/PreferencesPanel';
import { LeaveRequestPanel } from './components/LeaveRequestPanel';
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
          <div className="animate-in fade-in duration-300">
            <header className="mb-8 lg:mb-12">
                <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-zinc-900 mb-2">Welcome back, {currentUser.name.split(' ')[0]} 👋</h1>
                <p className="text-sm sm:text-base text-zinc-500">Work 5 days, rest 2 days • Only 3 people work per day</p>
            </header>

            {/* Enhanced Stats Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5 mb-10 lg:mb-14">
                <div className="group relative bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl p-5 sm:p-6 shadow-lg hover:shadow-2xl transition-all overflow-hidden transform hover:-translate-y-1">
                    <div className="absolute top-0 right-0 w-24 sm:w-32 h-24 sm:h-32 bg-white/10 rounded-full -mr-12 sm:-mr-16 -mt-12 sm:-mt-16"></div>
                    <span className="relative block text-xs font-bold text-blue-100 uppercase tracking-wider mb-3">Next Shift</span>
                    <div className="relative flex flex-wrap items-baseline gap-2 sm:gap-3">
                         <span className="text-2xl sm:text-3xl font-bold text-white">Tomorrow</span>
                         <span className="text-base sm:text-lg text-blue-100 font-semibold">09:00</span>
                    </div>
                </div>
                <div className="group relative bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-2xl p-5 sm:p-6 shadow-lg hover:shadow-2xl transition-all overflow-hidden transform hover:-translate-y-1">
                    <div className="absolute top-0 right-0 w-24 sm:w-32 h-24 sm:h-32 bg-white/10 rounded-full -mr-12 sm:-mr-16 -mt-12 sm:-mt-16"></div>
                    <span className="relative block text-xs font-bold text-emerald-100 uppercase tracking-wider mb-3">Weekly Load</span>
                    <div className="relative flex flex-wrap items-baseline gap-2 sm:gap-3">
                        <span className="text-2xl sm:text-3xl font-bold text-white">{shifts.filter(s => s.userId === currentUser.id).length * 8}</span>
                        <span className="text-base sm:text-lg text-emerald-100 font-semibold">/ 40 hrs</span>
                    </div>
                    <div className="relative text-xs text-emerald-100 mt-2 font-medium">
                        {shifts.filter(s => s.userId === currentUser.id && new Date(s.date) >= new Date()).length} shifts this week
                    </div>
                </div>
                 <div className="group relative bg-gradient-to-br from-amber-500 to-amber-600 rounded-2xl p-5 sm:p-6 shadow-lg hover:shadow-2xl transition-all overflow-hidden transform hover:-translate-y-1 sm:col-span-2 lg:col-span-1">
                    <div className="absolute top-0 right-0 w-24 sm:w-32 h-24 sm:h-32 bg-white/10 rounded-full -mr-12 sm:-mr-16 -mt-12 sm:-mt-16"></div>
                    <span className="relative block text-xs font-bold text-amber-100 uppercase tracking-wider mb-3">Swaps</span>
                    <div className="relative flex flex-wrap items-baseline gap-2 sm:gap-3">
                        <span className="text-2xl sm:text-3xl font-bold text-white">{swaps.filter(s => s.status === 'PENDING').length}</span>
                        <span className="text-base sm:text-lg text-amber-100 font-semibold">pending</span>
                    </div>
                </div>
            </div>

            <CalendarView shifts={shifts} users={users} currentDate={new Date()} userId={currentUser.id} showTodayOnly={false} />
          </div>
        );
      case 'calendar':
        return <div className="animate-in fade-in duration-300"><MonthCalendarView shifts={shifts} users={users} /></div>;
      case 'admin':
        if (!currentUser.isAdmin) return <div className="text-red-500 mt-10 text-center"><p className="text-xl font-semibold">Access Denied</p><p className="text-sm text-zinc-500 mt-2">Admin privileges required</p></div>;
        return <div className="animate-in fade-in duration-300"><AdminPanel users={users} shifts={shifts} leaveRequests={leaveRequests} currentUser={currentUser} setShifts={setShifts} onRefresh={refreshData} /></div>;
      case 'swaps':
        return <div className="animate-in fade-in duration-300"><SwapMarketplace currentUser={currentUser} users={users} shifts={shifts} onRefresh={refreshData} /></div>;
      case 'leaves':
        return <div className="animate-in fade-in duration-300"><LeaveRequestPanel currentUser={currentUser} leaveRequests={leaveRequests} onRefresh={refreshData} /></div>;
      case 'preferences':
        return <div className="animate-in fade-in duration-300"><PreferencesPanel currentUser={currentUser} onUpdate={handleUserUpdate} /></div>;
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
      
      <main className="max-w-7xl mx-auto pt-20 sm:pt-24 px-4 sm:px-6 lg:px-8 pb-12">
        {renderContent()}
      </main>
    </div>
  );
}
