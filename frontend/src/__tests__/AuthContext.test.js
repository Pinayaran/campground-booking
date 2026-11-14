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
  return (
    <>
      <p>{auth.loading ? 'loading' : auth.user ? auth.user.name : 'anonymous'}</p>
      <p>{auth.error ? `error: ${auth.error}` : 'no error'}</p>
    </>
  );
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

test('login loads the user with getMe afterwards', async () => {
  api.getMe.mockRejectedValueOnce(Object.assign(new Error('Not authorized'), { status: 401 }));
  api.login.mockResolvedValue({ token: 'ignored' });
  renderProvider();
  await screen.findByText('anonymous');

  api.getMe.mockResolvedValue({ name: 'Alice' });
  await act(() => captured.auth.login('a@b.com', 'pw'));

  expect(api.login).toHaveBeenCalledWith('a@b.com', 'pw');
  expect(api.getMe).toHaveBeenCalledTimes(2);
  expect(await screen.findByText('Alice')).toBeInTheDocument();
  expect(screen.getByText('no error')).toBeInTheDocument();
});

test('getMe 401 on mount means logged out without an error', async () => {
  api.getMe.mockRejectedValue(Object.assign(new Error('Not authorized'), { status: 401 }));
  renderProvider();

  expect(screen.getByText('loading')).toBeInTheDocument();
  await screen.findByText('anonymous');
  expect(screen.getByText('no error')).toBeInTheDocument();
});

test('a network error on mount sets an error and no user', async () => {
  api.getMe.mockRejectedValue(new Error('Failed to fetch'));
  renderProvider();

  await screen.findByText('anonymous');
  expect(screen.getByText(/^error: Could not reach the server/)).toBeInTheDocument();
});

test('logout clears the user', async () => {
  api.getMe.mockResolvedValue({ name: 'Alice' });
  api.logout.mockResolvedValue();
  renderProvider();
  await screen.findByText('Alice');

  await act(() => captured.auth.logout());

  expect(api.logout).toHaveBeenCalled();
  await waitFor(() => expect(screen.getByText('anonymous')).toBeInTheDocument());
});

test('logout clears the user even when the server call fails', async () => {
  api.getMe.mockResolvedValue({ name: 'Alice' });
  api.logout.mockRejectedValue(new Error('down'));
  renderProvider();
  await screen.findByText('Alice');

  await act(() => captured.auth.logout());

  expect(screen.getByText('anonymous')).toBeInTheDocument();
});

test('an old localStorage token is removed on mount', async () => {
  localStorage.setItem('token', 'old');
  api.getMe.mockResolvedValue({ name: 'Alice' });
  renderProvider();

  await screen.findByText('Alice');
  expect(localStorage.getItem('token')).toBeNull();
});
