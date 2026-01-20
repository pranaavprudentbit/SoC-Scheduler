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

export async function POST(request: NextRequest) {
    try {
        // Get the authorization token from the request
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

        // Get user data from request body
        const { email, password, name, role, isAdmin } = await request.json();

        if (!email || !password || !name) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }

        // Create the new user using Admin SDK (doesn't affect current session)
        const newUser = await auth.createUser({
            email,
            password,
            displayName: name,
        });

        // Create user document in Firestore
        await db.collection('users').doc(newUser.uid).set({
            id: newUser.uid,
            name,
            email,
            role: role || 'ANALYST',
            isAdmin: isAdmin || false,
            avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(name)}`,
            preferredDays: [],
            preferredShifts: [],
            unavailableDates: [],
            createdAt: new Date().toISOString(),
        });

        return NextResponse.json({
            success: true,
            userId: newUser.uid,
            message: `User ${name} created successfully`
        });

    } catch (error: any) {
        console.error('Error creating user:', error);

        if (error.code === 'auth/email-already-exists') {
            return NextResponse.json({ error: 'Email already in use' }, { status: 400 });
        }
        if (error.code === 'auth/invalid-email') {
            return NextResponse.json({ error: 'Invalid email address' }, { status: 400 });
        }
        if (error.code === 'auth/weak-password') {
            return NextResponse.json({ error: 'Password is too weak' }, { status: 400 });
        }

        return NextResponse.json({ error: 'Failed to create user' }, { status: 500 });
    }
}
