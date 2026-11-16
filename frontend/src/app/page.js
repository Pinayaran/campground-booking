'use client';

import { useEffect, useState } from 'react';
import SearchBar from '@/components/SearchBar';
import CampgroundFilters from '@/components/CampgroundFilters';
import CampgroundList from '@/components/CampgroundList';
import Pagination from '@/components/Pagination';
import useCampgrounds from '@/hooks/useCampgrounds';
import useDebouncedValue from '@/hooks/useDebouncedValue';
import { getLocations } from '@/lib/api';

const NO_FILTERS = { province: '', region: '', date: '' };

export default function HomePage() {
  const [search, setSearch] = useState('');
  const [filters, setFilters] = useState(NO_FILTERS);
  const [page, setPage] = useState(1);
  const [locations, setLocations] = useState({ provinces: [], regions: [] });

  const debouncedSearch = useDebouncedValue(search);
  const { campgrounds, pagination, loading, error } = useCampgrounds({
    search: debouncedSearch,
    ...filters,
    page,
  });

  useEffect(() => {
    getLocations()
      .then((res) => setLocations(res.data))
      .catch(() => {}); // the dropdowns stay empty; the list shows its own error
  }, []);

  const handleSearch = (value) => {
    setSearch(value);
    setPage(1);
  };
  const handleFilters = (next) => {
    setFilters(next);
    setPage(1);
  };

  return (
    <main className="mx-auto flex max-w-6xl flex-col gap-6 px-4 py-8">
      <h1 className="text-3xl font-bold text-emerald-800">Campgrounds</h1>
      <SearchBar value={search} onChange={handleSearch} />
      <CampgroundFilters
        provinces={locations.provinces}
        regions={locations.regions}
        value={filters}
        onChange={handleFilters}
      />
      <CampgroundList campgrounds={campgrounds} loading={loading} error={error} />
      <Pagination pagination={pagination} page={page} onPageChange={setPage} />
    </main>
  );
}
