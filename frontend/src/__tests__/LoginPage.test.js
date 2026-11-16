import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import LoginPage from '@/app/login/page';
import { AuthContext } from '@/context/AuthContext';

const push = jest.fn();
jest.mock('next/navigation', () => ({ useRouter: () => ({ push, replace: jest.fn() }) }));

function renderPage(login) {
  return render(
    <AuthContext.Provider value={{ user: null, loading: false, login }}>
      <LoginPage />
    </AuthContext.Provider>
  );
}

beforeEach(() => push.mockClear());

test('shows the server message on failed login', async () => {
  const login = jest.fn().mockRejectedValue(new Error('Invalid credentials'));
  renderPage(login);

  await userEvent.type(screen.getByLabelText('Email'), 'a@b.com');
  await userEvent.type(screen.getByLabelText('Password'), 'wrong');
  await userEvent.click(screen.getByRole('button', { name: 'Login' }));

  expect(await screen.findByRole('alert')).toHaveTextContent('Invalid credentials');
  expect(push).not.toHaveBeenCalled();
});

test('redirects to home after a successful login', async () => {
  const login = jest.fn().mockResolvedValue();
  renderPage(login);

  await userEvent.type(screen.getByLabelText('Email'), 'a@b.com');
  await userEvent.type(screen.getByLabelText('Password'), 'pw');
  await userEvent.click(screen.getByRole('button', { name: 'Login' }));

  expect(login).toHaveBeenCalledWith('a@b.com', 'pw');
  await screen.findByRole('button', { name: 'Login' });
  expect(push).toHaveBeenCalledWith('/');
});
