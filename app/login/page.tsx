'use client';

import { useState, useEffect } from 'react';
import { auth, db } from '@/lib/firebase/config';
import { signInWithEmailAndPassword, onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { useRouter } from 'next/navigation';
import { ShieldCheck } from 'lucide-react';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();

  // Redirect if already logged in
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        router.push('/');
      }
    });
    return () => unsubscribe();
  }, [router]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      // Check if user profile exists in Firestore
      const userDocRef = doc(db, 'users', user.uid);
      const userDoc = await getDoc(userDocRef);

      // If profile doesn't exist, create it
      if (!userDoc.exists()) {
        await setDoc(userDocRef, {
          id: user.uid,
          name: user.displayName || email.split('@')[0],
          email: user.email,
          role: 'ANALYST', // Default role, admin can change later
          isAdmin: false, // Default to non-admin user
          avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.uid}`,
          preferredDays: [],
          preferredShifts: [],
          unavailableDates: [],
          createdAt: new Date().toISOString(),
        });
      }

      router.push('/');
      router.refresh();
    } catch (err: any) {
      setError(err.message || 'Failed to login');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-white flex items-center justify-center px-6">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="flex items-center justify-center gap-2 mb-12">
          <div className="w-12 h-12 bg-blue-600 flex items-center justify-center rounded-lg shadow-lg">
            <ShieldCheck className="text-white" size={28} />
          </div>
          <span className="text-2xl font-bold text-zinc-900 tracking-tight">
            SoC Scheduler
          </span>
        </div>

        {/* Login Form */}
        <div className="bg-white border border-zinc-200 rounded-2xl shadow-xl p-10">
          <h1 className="text-3xl font-semibold text-zinc-900 mb-2">Welcome back</h1>
          <p className="text-zinc-500 text-base mb-10">
            Sign in to manage your shift schedule
          </p>

          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-6">
            <div>
              <label className="block text-sm font-semibold text-zinc-700 mb-3">
                Email Address
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-zinc-50 border border-zinc-300 text-zinc-900 px-5 py-3.5 rounded-xl outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100 focus:bg-white transition-all text-base"
                placeholder="your@email.com"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-zinc-700 mb-3">
                Password
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-zinc-50 border border-zinc-300 text-zinc-900 px-5 py-3.5 rounded-xl outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100 focus:bg-white transition-all text-base"
                placeholder="••••••••"
                required
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className={`w-full py-4 rounded-xl font-semibold transition-all text-base shadow-lg ${
                loading
                  ? 'bg-zinc-200 text-zinc-400 cursor-not-allowed'
                  : 'bg-blue-600 text-white hover:bg-blue-700 hover:shadow-xl active:scale-[0.98]'
              }`}
            >
              {loading ? 'Signing in...' : 'Sign In'}
            </button>
          </form>

          <div className="mt-8 text-center text-xs text-zinc-400">
            Contact your admin for account access
          </div>
        </div>

        <div className="mt-8 text-center text-xs text-zinc-400">
          SOCSync v1.0 • Intelligent Ops Manager
        </div>
      </div>
    </div>
  );
}
