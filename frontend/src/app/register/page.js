'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';

const inputClass = 'rounded border border-gray-300 px-3 py-2';

export default function RegisterPage() {
  const { register } = useAuth();
  const router = useRouter();
  const [fields, setFields] = useState({ name: '', tel: '', email: '', password: '' });
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleChange = (key) => (e) => setFields({ ...fields, [key]: e.target.value });

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      await register(fields);
      router.push('/');
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <main className="mx-auto max-w-md px-4 py-8">
      <h1 className="mb-6 text-3xl font-bold text-emerald-800">Register</h1>
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <label className="flex flex-col gap-1">
          Name
          <input
            type="text"
            required
            value={fields.name}
            onChange={handleChange('name')}
            className={inputClass}
          />
        </label>
        <label className="flex flex-col gap-1">
          Telephone
          <input
            type="tel"
            required
            placeholder="0812345678"
            value={fields.tel}
            onChange={handleChange('tel')}
            className={inputClass}
          />
        </label>
        <label className="flex flex-col gap-1">
          Email
          <input
            type="email"
            required
            value={fields.email}
            onChange={handleChange('email')}
            className={inputClass}
          />
        </label>
        <label className="flex flex-col gap-1">
          Password
          <input
            type="password"
            required
            value={fields.password}
            onChange={handleChange('password')}
            className={inputClass}
          />
        </label>
        {error && (
          <p role="alert" className="text-red-700">
            {error}
          </p>
        )}
        <button
          type="submit"
          disabled={submitting}
          className="rounded bg-emerald-700 px-4 py-2 text-white disabled:opacity-50"
        >
          Register
        </button>
      </form>
    </main>
  );
}
