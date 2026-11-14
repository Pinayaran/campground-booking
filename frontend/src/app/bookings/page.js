'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { getMyBookings } from '@/lib/api';

export default function BookingsPage() {
  const { user, loading, error: authError } = useAuth();
  const router = useRouter();
  const [bookings, setBookings] = useState(null);
  const [fetchError, setFetchError] = useState('');

  useEffect(() => {
    if (loading || authError) return;
    if (!user) {
      router.replace('/login');
      return;
    }
    let ignore = false;
    getMyBookings()
      .then((res) => {
        if (!ignore) setBookings(res);
      })
      .catch((err) => {
        if (!ignore) setFetchError(err.message);
      });
    return () => {
      ignore = true;
    };
  }, [loading, authError, user, router]);

  const error = authError || fetchError;
  const isAdmin = user?.role === 'admin';

  return (
    <main className="mx-auto flex max-w-3xl flex-col gap-6 px-4 py-8">
      <h1 className="text-3xl font-bold text-emerald-800">{isAdmin ? 'All Bookings' : 'My Bookings'}</h1>
      {error && (
        <p role="alert" className="text-red-700">
          {error}
        </p>
      )}
      {!error && bookings === null && <p>Loading...</p>}
      {bookings?.length === 0 && <p>{isAdmin ? 'There are no bookings yet.' : 'You have no bookings yet.'}</p>}
      <ul className="flex flex-col gap-3">
        {bookings?.map((booking) => (
          <li key={booking._id} className="rounded border border-gray-200 p-4">
            <h2 className="text-lg font-semibold text-emerald-800">{booking.campground.name}</h2>
            <p>Check-in: {booking.checkInDate.slice(0, 10)}</p>
            <p>
              {booking.nights} {booking.nights === 1 ? 'night' : 'nights'}
            </p>
            <p className="capitalize">Status: {booking.status}</p>
          </li>
        ))}
      </ul>
    </main>
  );
}
