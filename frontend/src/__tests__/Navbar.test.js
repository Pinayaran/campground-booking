import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import Navbar from '@/components/Navbar';
import { AuthContext } from '@/context/AuthContext';

function renderNavbar(value) {
  return render(
    <AuthContext.Provider value={value}>
      <Navbar />
    </AuthContext.Provider>
  );
}

const loggedOut = { user: null, loading: false, logout: jest.fn() };
const loggedIn = { user: { name: 'Alice', role: 'user' }, loading: false, logout: jest.fn() };

test('logged out shows Login and Register, not My Bookings', () => {
  renderNavbar(loggedOut);
  expect(screen.getByRole('link', { name: 'Campground Booking' })).toHaveAttribute('href', '/');
  expect(screen.getByRole('link', { name: 'Home' })).toHaveAttribute('href', '/');
  expect(screen.getByRole('link', { name: 'Login' })).toHaveAttribute('href', '/login');
  expect(screen.getByRole('link', { name: 'Register' })).toHaveAttribute('href', '/register');
  expect(screen.queryByRole('link', { name: 'My Bookings' })).not.toBeInTheDocument();
});

test('logged in shows the user name, My Bookings, Profile and Logout', () => {
  renderNavbar(loggedIn);
  expect(screen.getByText('Alice')).toBeInTheDocument();
  expect(screen.getByRole('link', { name: 'My Bookings' })).toHaveAttribute('href', '/bookings');
  expect(screen.getByRole('link', { name: 'Profile' })).toHaveAttribute('href', '/profile');
  expect(screen.getByRole('button', { name: 'Logout' })).toBeInTheDocument();
  expect(screen.queryByRole('link', { name: 'Login' })).not.toBeInTheDocument();
});

test('admin sees All Bookings instead of My Bookings', () => {
  renderNavbar({ ...loggedIn, user: { name: 'Admin', role: 'admin' } });
  expect(screen.getByRole('link', { name: 'All Bookings' })).toHaveAttribute('href', '/bookings');
  expect(screen.queryByRole('link', { name: 'My Bookings' })).not.toBeInTheDocument();
});

test('clicking Logout calls logout()', async () => {
  const logout = jest.fn();
  renderNavbar({ ...loggedIn, logout });
  await userEvent.click(screen.getByRole('button', { name: 'Logout' }));
  expect(logout).toHaveBeenCalledTimes(1);
});

test('shows nothing auth-related while loading', () => {
  renderNavbar({ ...loggedOut, loading: true });
  expect(screen.getByRole('link', { name: 'Home' })).toBeInTheDocument();
  expect(screen.queryByRole('link', { name: 'Login' })).not.toBeInTheDocument();
  expect(screen.queryByRole('link', { name: 'Register' })).not.toBeInTheDocument();
  expect(screen.queryByRole('button', { name: 'Logout' })).not.toBeInTheDocument();
});
