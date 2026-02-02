import { NextRequest, NextResponse } from 'next/server';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';
import { initializeApp, getApps, cert } from 'firebase-admin/app';

// Initialize Firebase Admin
if (getApps().length === 0) {
    const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n');

    if (privateKey && process.env.FIREBASE_PROJECT_ID && process.env.FIREBASE_CLIENT_EMAIL) {
        initializeApp({
            credential: cert({
                projectId: process.env.FIREBASE_PROJECT_ID,
                clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
                privateKey: privateKey,
            }),
        });
    }
}

export async function DELETE(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const userId = searchParams.get('userId');

        if (!userId) {
            return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
        }

        // Get the authorization token
        const authHeader = request.headers.get('Authorization');
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const idToken = authHeader.split('Bearer ')[1];
        const auth = getAuth();
        const db = getFirestore();

        // Verify the requesting user is an admin
        const decodedToken = await auth.verifyIdToken(idToken);
        const requestingUserDoc = await db.collection('users').doc(decodedToken.uid).get();

        if (!requestingUserDoc.exists || !requestingUserDoc.data()?.isAdmin) {
            return NextResponse.json({ error: 'Admin privileges required' }, { status: 403 });
        }

        // Prevent self-deletion
        if (decodedToken.uid === userId) {
            return NextResponse.json({ error: 'Cannot delete your own admin account' }, { status: 400 });
        }

        // 1. Delete user from Firebase Auth
        await auth.deleteUser(userId);

        // 2. Delete user document from Firestore
        await db.collection('users').doc(userId).delete();

        // 3. Optional: Delete their shifts or mark them as unassigned
        const shiftsSnapshot = await db.collection('shifts').where('userId', '==', userId).get();
        const batch = db.batch();
        shiftsSnapshot.docs.forEach(doc => {
            batch.delete(doc.ref);
        });
        await batch.commit();

        return NextResponse.json({ success: true, message: 'User deleted successfully' });

    } catch (error: any) {
        console.error('Error deleting user:', error);
        return NextResponse.json({ error: 'Failed to delete user' }, { status: 500 });
    }
}

export async function PATCH(request: NextRequest) {
    try {
        const { userId, role, isAdmin, isActive } = await request.json();

        if (!userId) {
            return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
        }

        // Get the authorization token
        const authHeader = request.headers.get('Authorization');
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const idToken = authHeader.split('Bearer ')[1];
        const auth = getAuth();
        const db = getFirestore();

        // Verify the requesting user is an admin
        const decodedToken = await auth.verifyIdToken(idToken);
        const requestingUserDoc = await db.collection('users').doc(decodedToken.uid).get();

        if (!requestingUserDoc.exists || !requestingUserDoc.data()?.isAdmin) {
            return NextResponse.json({ error: 'Admin privileges required' }, { status: 403 });
        }

        // Update user document in Firestore
        const updateData: any = {};
        if (role) updateData.role = role;
        if (typeof isAdmin === 'boolean') updateData.isAdmin = isAdmin;
        if (typeof isActive === 'boolean') updateData.isActive = isActive;

        await db.collection('users').doc(userId).update(updateData);

        return NextResponse.json({ success: true, message: 'User updated successfully' });

    } catch (error: any) {
        console.error('Error updating user:', error);
        return NextResponse.json({ error: 'Failed to update user' }, { status: 500 });
    }
}
