import { act, renderHook, waitFor } from '@testing-library/react';
import useCampgrounds from '@/hooks/useCampgrounds';
import { getCampgrounds } from '@/lib/api';

jest.mock('@/lib/api');

afterEach(() => jest.resetAllMocks());

test('passes params to getCampgrounds and exposes data', async () => {
  getCampgrounds.mockResolvedValue({ data: [{ _id: '1' }], pagination: { next: { page: 2 } } });
  const params = { search: 'pine', page: 1 };
  const { result } = renderHook(() => useCampgrounds(params));
  expect(result.current.loading).toBe(true);
  await waitFor(() => expect(result.current.loading).toBe(false));
  expect(getCampgrounds).toHaveBeenCalledWith(params);
  expect(result.current.campgrounds).toEqual([{ _id: '1' }]);
  expect(result.current.pagination).toEqual({ next: { page: 2 } });
  expect(result.current.error).toBeNull();
});

test('exposes error message when the request fails', async () => {
  getCampgrounds.mockRejectedValue(new Error('Network down'));
  const { result } = renderHook(() => useCampgrounds({}));
  await waitFor(() => expect(result.current.error).toBe('Network down'));
  expect(result.current.loading).toBe(false);
  expect(result.current.campgrounds).toEqual([]);
});

test('ignores a stale slow response that resolves after a newer one', async () => {
  let resolveFirst;
  getCampgrounds
    .mockImplementationOnce(
      () =>
        new Promise((r) => {
          resolveFirst = r;
        })
    )
    .mockResolvedValueOnce({ data: [{ _id: 'new' }], pagination: {} });
  const { result, rerender } = renderHook(({ p }) => useCampgrounds(p), {
    initialProps: { p: { search: 'a' } },
  });
  rerender({ p: { search: 'ab' } });
  await waitFor(() => expect(result.current.campgrounds).toEqual([{ _id: 'new' }]));
  await act(async () => {
    resolveFirst({ data: [{ _id: 'old' }], pagination: {} });
  });
  expect(result.current.campgrounds).toEqual([{ _id: 'new' }]);
});
