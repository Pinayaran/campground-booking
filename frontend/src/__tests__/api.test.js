import { apiFetch, buildCampgroundQuery } from '@/lib/api';

afterEach(() => {
  delete global.fetch;
});

test('buildCampgroundQuery skips empty values', () =>
  expect(
    buildCampgroundQuery({ search: 'pine', province: '', region: 'North', date: undefined, page: 2 })
  ).toBe('?search=pine&region=North&page=2'));

test('buildCampgroundQuery with nothing set is empty', () =>
  expect(buildCampgroundQuery({})).toBe(''));

test('apiFetch throws the server message when success is false', async () => {
  global.fetch = jest.fn().mockResolvedValue({
    ok: false,
    json: async () => ({ success: false, message: 'Invalid query' }),
  });
  await expect(apiFetch('/campgrounds')).rejects.toThrow('Invalid query');
});

test('apiFetch sends method, bearer token and JSON body', async () => {
  global.fetch = jest.fn().mockResolvedValue({
    ok: true,
    json: async () => ({ success: true, data: [] }),
  });
  await apiFetch('/x', { method: 'POST', body: { a: 1 }, token: 't' });
  const [url, init] = global.fetch.mock.calls[0];
  expect(url).toBe('http://localhost:5000/api/v1/x');
  expect(init.method).toBe('POST');
  expect(init.headers.Authorization).toBe('Bearer t');
  expect(init.body).toBe('{"a":1}');
});

test('apiFetch attaches the HTTP status to the thrown error', async () => {
  global.fetch = jest.fn().mockResolvedValue({
    ok: false,
    status: 401,
    json: async () => ({ success: false, message: 'Not authorized' }),
  });
  await expect(apiFetch('/auth/me')).rejects.toMatchObject({ status: 401, message: 'Not authorized' });
});
