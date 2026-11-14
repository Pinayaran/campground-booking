export const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:5000/api/v1';

export async function apiFetch(path, { method = 'GET', body, token } = {}) {
  const headers = {};
  if (body !== undefined) headers['Content-Type'] = 'application/json';
  if (token) headers.Authorization = `Bearer ${token}`;

  const res = await fetch(`${API_URL}${path}`, {
    method,
    headers,
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });
  const data = await res.json();
  if (!res.ok || data.success === false) {
    const err = new Error(data.message || 'Request failed');
    err.status = res.status;
    throw err;
  }
  return data;
}

export function buildCampgroundQuery({ search, province, region, date, page } = {}) {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries({ search, province, region, date, page })) {
    if (value !== undefined && value !== null && value !== '') params.set(key, String(value));
  }
  const query = params.toString();
  return query ? `?${query}` : '';
}

export const getCampgrounds = (params) =>
  apiFetch(`/campgrounds${buildCampgroundQuery(params)}`);

export const getLocations = () => apiFetch('/campgrounds/locations');

export const login = (email, password) =>
  apiFetch('/auth/login', { method: 'POST', body: { email, password } });

export const register = ({ name, tel, email, password }) =>
  apiFetch('/auth/register', { method: 'POST', body: { name, tel, email, password } });

export const getMe = (token) => apiFetch('/auth/me', { token }).then((res) => res.data);

export const logout = (token) => apiFetch('/auth/logout', { token }).then(() => undefined);

export const getMyBookings = (token) => apiFetch('/bookings', { token }).then((res) => res.data);
