'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';

export default function ProfilePage() {
  const { user, loading, error } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !error && !user) router.replace('/login');
  }, [loading, error, user, router]);

  if (error) {
    return (
      <main className="mx-auto max-w-md px-4 py-8">
        <p role="alert" className="text-red-700">
          {error}
        </p>
      </main>
    );
  }

  if (loading || !user) return null;

  return (
    <main className="mx-auto max-w-md px-4 py-8">
      <h1 className="mb-6 text-3xl font-bold text-emerald-800">Profile</h1>
      <dl className="grid grid-cols-[auto_1fr] gap-x-6 gap-y-2">
        <dt className="font-semibold">Name</dt>
        <dd>{user.name}</dd>
        <dt className="font-semibold">Email</dt>
        <dd>{user.email}</dd>
        <dt className="font-semibold">Telephone</dt>
        <dd>{user.tel}</dd>
      </dl>
    </main>
  );
}
