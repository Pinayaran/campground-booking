import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import Pagination from '@/components/Pagination';

test('disables Previous and Next when missing, shows Page N', () => {
  render(<Pagination pagination={{}} page={1} onPageChange={() => {}} />);
  expect(screen.getByRole('button', { name: 'Previous' })).toBeDisabled();
  expect(screen.getByRole('button', { name: 'Next' })).toBeDisabled();
  expect(screen.getByText('Page 1')).toBeInTheDocument();
});

test('enabled buttons call onPageChange', async () => {
  const onPageChange = jest.fn();
  render(
    <Pagination
      pagination={{ prev: { page: 1 }, next: { page: 3 } }}
      page={2}
      onPageChange={onPageChange}
    />
  );
  await userEvent.click(screen.getByRole('button', { name: 'Next' }));
  await userEvent.click(screen.getByRole('button', { name: 'Previous' }));
  expect(onPageChange).toHaveBeenNthCalledWith(1, 3);
  expect(onPageChange).toHaveBeenNthCalledWith(2, 1);
});
