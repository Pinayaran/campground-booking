import { useEffect, useState } from 'react';
import { getCampgrounds } from '@/lib/api';

const EMPTY = { campgrounds: [], pagination: {}, error: null };

export default function useCampgrounds({ search, province, region, date, page } = {}) {
  // `settled` holds the last finished request and the key it answered, so
  // `loading` is derived (no setState in the effect body).
  const [settled, setSettled] = useState({ key: null, ...EMPTY });
  const key = JSON.stringify([search, province, region, date, page]);

  useEffect(() => {
    let ignore = false; // set on cleanup so a stale response never overwrites newer data
    getCampgrounds({ search, province, region, date, page })
      .then((res) => {
        if (ignore) return;
        setSettled({
          key,
          campgrounds: res.data ?? [],
          pagination: res.pagination ?? {},
          error: null,
        });
      })
      .catch((err) => {
        if (ignore) return;
        setSettled({ key, ...EMPTY, error: err.message });
      });
    return () => {
      ignore = true;
    };
  }, [key, search, province, region, date, page]);

  const { campgrounds, pagination, error } = settled;
  return { campgrounds, pagination, error, loading: settled.key !== key };
}
