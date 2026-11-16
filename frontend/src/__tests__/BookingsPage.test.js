import { render, screen } from '@testing-library/react';
import BookingsPage from '@/app/bookings/page';
import { AuthContext } from '@/context/AuthContext';
import * as api from '@/lib/api';

jest.mock('@/lib/api');

const router = { push: jest.fn(), replace: jest.fn() };
jest.mock('next/navigation', () => ({ useRouter: () => router }));

function renderPage(value) {
  return render(
    <AuthContext.Provider value={value}>
      <BookingsPage />
    </AuthContext.Provider>
  );
}

beforeEach(() => {
  jest.resetAllMocks();
  api.getMyBookings.mockResolvedValue([]);
});

test('an auth error is shown and does not redirect', () => {
  renderPage({ user: null, loading: false, error: 'Could not reach the server.' });

  expect(screen.getByRole('alert')).toHaveTextContent('Could not reach the server.');
  expect(router.replace).not.toHaveBeenCalled();
  expect(api.getMyBookings).not.toHaveBeenCalled();
});

test('logged out redirects to login', () => {
  renderPage({ user: null, loading: false, error: '' });

  expect(router.replace).toHaveBeenCalledWith('/login');
});

test('an admin sees All Bookings', async () => {
  renderPage({ user: { name: 'Admin', role: 'admin' }, loading: false, error: '' });

  expect(await screen.findByRole('heading', { name: 'All Bookings' })).toBeInTheDocument();
});

test('a user sees My Bookings', async () => {
  renderPage({ user: { name: 'Alice', role: 'user' }, loading: false, error: '' });

  expect(await screen.findByRole('heading', { name: 'My Bookings' })).toBeInTheDocument();
});
