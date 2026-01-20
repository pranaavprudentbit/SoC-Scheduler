
import { addDoc, collection } from 'firebase/firestore';
import { db } from './firebase/config';

export type ActivityType = 'SHIFT_UPDATE' | 'AVAILABILITY_CHANGE' | 'SWAP_REQUEST' | 'LEAVE_REQUEST' | 'PROFILE_UPDATE' | 'OTHER';

export const logActivity = async (
    userId: string,
    userName: string,
    action: string,
    details?: string,
    type: ActivityType = 'OTHER'
) => {
    try {
        await addDoc(collection(db, 'activity_logs'), {
            userId,
            userName,
            action,
            details,
            type,
            timestamp: new Date().toISOString(),
            createdAt: new Date()
        });
    } catch (error) {
        console.error('Error logging activity:', error);
    }
};
