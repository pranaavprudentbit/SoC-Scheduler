'use client';

import React, { useMemo, useState, useEffect } from 'react';
import { User } from '@/lib/types';
import { db } from '@/lib/firebase/config';
import { collection, query, orderBy, limit, getDocs, where } from 'firebase/firestore';
import { Activity, Clock, FileText, User as UserIcon, Calendar, Filter } from 'lucide-react';
import { ActivityType } from '@/lib/logger';

interface ActivityLogProps {
    currentUser: User;
}

interface LogEntry {
    id: string;
    userId: string;
    userName: string;
    action: string;
    details: string;
    type: ActivityType;
    timestamp: string;
}

export const ActivityLog: React.FC<ActivityLogProps> = ({ currentUser }) => {
    const [logs, setLogs] = useState<LogEntry[]>([]);
    const [loading, setLoading] = useState(true);
    const [filterType, setFilterType] = useState<ActivityType | 'ALL'>('ALL');

    useEffect(() => {
        fetchLogs();
    }, [currentUser]);

    const fetchLogs = async () => {
        try {
            setLoading(true);
            const logsRef = collection(db, 'activity_logs');

            // If admin, see all logs. If user, only see own logs.
            const constraints: any[] = [orderBy('timestamp', 'desc'), limit(100)];

            if (!currentUser.isAdmin) {
                constraints.push(where('userId', '==', currentUser.id));
            }

            const q = query(logsRef, ...constraints);
            const snapshot = await getDocs(q);

            const fetchedLogs = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            })) as LogEntry[];

            setLogs(fetchedLogs);
        } catch (error) {
            console.error('Error fetching logs:', error);
        } finally {
            setLoading(false);
        }
    };

    const filteredLogs = useMemo(() => {
        if (filterType === 'ALL') return logs;
        return logs.filter(log => log.type === filterType);
    }, [logs, filterType]);

    const getActivityIcon = (type: ActivityType) => {
        switch (type) {
            case 'SHIFT_UPDATE': return <Clock className="text-blue-500" />;
            case 'AVAILABILITY_CHANGE': return <Calendar className="text-amber-500" />;
            case 'SWAP_REQUEST': return <Activity className="text-purple-500" />;
            case 'LEAVE_REQUEST': return <FileText className="text-red-500" />;
            case 'PROFILE_UPDATE': return <UserIcon className="text-emerald-500" />;
            default: return <Activity className="text-zinc-500" />;
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h2 className="text-2xl font-bold text-zinc-900">Activity Log</h2>
                    <p className="text-zinc-500 text-sm">monitor recent system activity</p>
                </div>
                <div className="flex items-center gap-2">
                    <Filter size={16} className="text-zinc-400" />
                    <select
                        value={filterType}
                        onChange={(e) => setFilterType(e.target.value as any)}
                        className="bg-white border border-zinc-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                        <option value="ALL">All Activity</option>
                        <option value="SHIFT_UPDATE">Shifts</option>
                        <option value="AVAILABILITY_CHANGE">Availability</option>
                        <option value="SWAP_REQUEST">Swaps</option>
                        <option value="LEAVE_REQUEST">Leaves</option>
                        <option value="PROFILE_UPDATE">Profile</option>
                    </select>
                </div>
            </div>

            <div className="bg-white border border-zinc-200 rounded-xl shadow-sm overflow-hidden">
                {loading ? (
                    <div className="p-12 text-center text-zinc-500">Loading activity...</div>
                ) : filteredLogs.length === 0 ? (
                    <div className="p-12 text-center flex flex-col items-center justify-center">
                        <div className="bg-zinc-50 p-4 rounded-full mb-4">
                            <Activity className="text-zinc-300" size={32} />
                        </div>
                        <h3 className="text-lg font-medium text-zinc-900">No activity yet</h3>
                        <p className="text-zinc-500 max-w-sm mt-1">Actions taken by you will appear here.</p>
                    </div>
                ) : (
                    <div className="divide-y divide-zinc-100">
                        {filteredLogs.map(log => (
                            <div key={log.id} className="p-4 hover:bg-zinc-50 transition-colors flex items-start gap-4 border-b border-zinc-100 last:border-0">
                                <div className="bg-zinc-50 p-2 rounded-lg shrink-0">
                                    {getActivityIcon(log.type)}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center justify-between mb-1">
                                        <p className="text-sm font-semibold text-zinc-900 truncate">
                                            {log.action} <span className="text-zinc-400 font-normal">by {log.userName}</span>
                                        </p>
                                        <time className="text-xs text-zinc-400 whitespace-nowrap">
                                            {new Date(log.timestamp).toLocaleString()}
                                        </time>
                                    </div>
                                    <p className="text-sm text-zinc-600 break-words">{log.details}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};
