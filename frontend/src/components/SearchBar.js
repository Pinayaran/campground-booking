'use client';

export default function SearchBar({ value, onChange }) {
  return (
    <div className="flex flex-col gap-1">
      <label htmlFor="campground-search" className="text-sm font-medium text-stone-700">
        Search campgrounds
      </label>
      <input
        id="campground-search"
        type="search"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Search by name"
        className="rounded-lg border border-stone-300 bg-white px-3 py-2 focus:border-emerald-600 focus:outline-none focus:ring-2 focus:ring-emerald-200"
      />
    </div>
  );
}
