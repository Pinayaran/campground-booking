import { useEffect } from 'react';
import { render, screen, waitFor, act } from '@testing-library/react';
import { AuthProvider, useAuth } from '@/context/AuthContext';
import * as api from '@/lib/api';

jest.mock('@/lib/api');

const captured = {};
function Probe() {
  const auth = useAuth();
  useEffect(() => {
    captured.auth = auth;
  });
  return <p>{auth.loading ? 'loading' : auth.user ? auth.user.name : 'anonymous'}</p>;
}

function renderProvider() {
  return render(
    <AuthProvider>
      <Probe />
    </AuthProvider>
  );
}

beforeEach(() => {
  localStorage.clear();
  jest.resetAllMocks();
});

test('login stores the token and loads the user', async () => {
  api.login.mockResolvedValue({ token: 'abc' });
  api.getMe.mockResolvedValue({ name: 'Alice' });
  renderProvider();
  await screen.findByText('anonymous');

  await act(() => captured.auth.login('a@b.com', 'pw'));

  expect(api.login).toHaveBeenCalledWith('a@b.com', 'pw');
  expect(api.getMe).toHaveBeenCalledWith('abc');
  expect(localStorage.getItem('token')).toBe('abc');
  expect(await screen.findByText('Alice')).toBeInTheDocument();
});

test('a stored token that getMe rejects with 401 is cleared', async () => {
  localStorage.setItem('token', 'stale');
  api.getMe.mockRejectedValue(Object.assign(new Error('Not authorized'), { status: 401 }));
  renderProvider();

  expect(screen.getByText('loading')).toBeInTheDocument();
  await screen.findByText('anonymous');
  expect(localStorage.getItem('token')).toBeNull();
});

test('a network error on mount keeps the stored token', async () => {
  localStorage.setItem('token', 'abc');
  api.getMe.mockRejectedValue(new Error('Failed to fetch'));
  renderProvider();

  await screen.findByText('anonymous');
  expect(localStorage.getItem('token')).toBe('abc');
});

test('logout clears the token and user', async () => {
  localStorage.setItem('token', 'abc');
  api.getMe.mockResolvedValue({ name: 'Alice' });
  api.logout.mockResolvedValue();
  renderProvider();
  await screen.findByText('Alice');

  await act(() => captured.auth.logout());

  expect(api.logout).toHaveBeenCalledWith('abc');
  expect(localStorage.getItem('token')).toBeNull();
  await waitFor(() => expect(screen.getByText('anonymous')).toBeInTheDocument());
});

test('logout clears local state even when the server call fails', async () => {
  localStorage.setItem('token', 'abc');
  api.getMe.mockResolvedValue({ name: 'Alice' });
  api.logout.mockRejectedValue(new Error('down'));
  renderProvider();
  await screen.findByText('Alice');

  await act(() => captured.auth.logout());

  expect(localStorage.getItem('token')).toBeNull();
  expect(screen.getByText('anonymous')).toBeInTheDocument();
});
