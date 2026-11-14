'use client';

import { useSyncExternalStore } from 'react';
import { todayLocal } from '@/lib/date';

const fieldClass =
  'rounded-lg border border-stone-300 bg-white px-3 py-2 focus:border-emerald-600 focus:outline-none focus:ring-2 focus:ring-emerald-200';
const labelClass = 'text-sm font-medium text-stone-700';

const noSubscribe = () => () => {};
// undefined while prerendering (reading the clock there breaks the static build), today on the client
const useToday = () => useSyncExternalStore(noSubscribe, () => todayLocal(), () => undefined);

export default function CampgroundFilters({ provinces = [], regions = [], value, onChange }) {
  const today = useToday();
  const set = (key) => (e) => onChange({ ...value, [key]: e.target.value });

  return (
    <div className="flex flex-wrap items-end gap-4">
      <div className="flex min-w-40 flex-1 flex-col gap-1">
        <label htmlFor="filter-province" className={labelClass}>Province</label>
        <select id="filter-province" value={value.province} onChange={set('province')} className={fieldClass}>
          <option value="">All provinces</option>
          {provinces.map((p) => (
            <option key={p} value={p}>{p}</option>
          ))}
        </select>
      </div>
      <div className="flex min-w-40 flex-1 flex-col gap-1">
        <label htmlFor="filter-region" className={labelClass}>Region</label>
        <select id="filter-region" value={value.region} onChange={set('region')} className={fieldClass}>
          <option value="">All regions</option>
          {regions.map((r) => (
            <option key={r} value={r}>{r}</option>
          ))}
        </select>
      </div>
      <div className="flex min-w-40 flex-1 flex-col gap-1">
        <label htmlFor="filter-date" className={labelClass}>Date</label>
        <input
          id="filter-date"
          type="date"
          min={today}
          value={value.date}
          onChange={set('date')}
          className={fieldClass}
        />
      </div>
      <button
        type="button"
        onClick={() => onChange({ province: '', region: '', date: '' })}
        className="rounded-lg border border-stone-300 bg-white px-4 py-2 text-sm font-medium text-stone-700 hover:bg-stone-100"
      >
        Clear filters
      </button>
    </div>
  );
}
