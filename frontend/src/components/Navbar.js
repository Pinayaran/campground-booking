'use client';

import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';

const linkClass = 'text-emerald-800 hover:underline';

export default function Navbar() {
  const { user, loading, logout } = useAuth();

  return (
    <nav className="border-b border-emerald-100 bg-white">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-x-6 gap-y-2 px-4 py-3">
        <Link href="/" className="text-lg font-bold text-emerald-800">
          Campground Booking
        </Link>
        <Link href="/" className={linkClass}>
          Home
        </Link>
        {!loading && user && (
          <>
            <Link href="/bookings" className={linkClass}>
              {user.role === 'admin' ? 'All Bookings' : 'My Bookings'}
            </Link>
            <Link href="/profile" className={linkClass}>
              Profile
            </Link>
            <span className="ml-auto text-gray-700">{user.name}</span>
            <button type="button" onClick={logout} className={linkClass}>
              Logout
            </button>
          </>
        )}
        {!loading && !user && (
          <div className="ml-auto flex gap-6">
            <Link href="/login" className={linkClass}>
              Login
            </Link>
            <Link href="/register" className={linkClass}>
              Register
            </Link>
          </div>
        )}
      </div>
    </nav>
  );
}
