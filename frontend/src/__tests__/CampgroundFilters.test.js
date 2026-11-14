import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import CampgroundFilters from '@/components/CampgroundFilters';
import { todayLocal } from '@/lib/date';

const props = {
  provinces: ['Chiang Mai', 'Phuket'],
  regions: ['North', 'South'],
  value: { province: '', region: '', date: '' },
};

test('choosing a region calls onChange with { ...value, region }', async () => {
  const onChange = jest.fn();
  render(<CampgroundFilters {...props} onChange={onChange} />);
  await userEvent.selectOptions(screen.getByLabelText('Region'), 'South');
  expect(onChange).toHaveBeenCalledWith({ ...props.value, region: 'South' });
});

test('the date input has min set to today (YYYY-MM-DD)', () => {
  render(<CampgroundFilters {...props} onChange={() => {}} />);
  const min = screen.getByLabelText('Date').getAttribute('min');
  expect(min).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  expect(min).toBe(todayLocal());
});

test('todayLocal uses local time, not UTC', () => {
  expect(todayLocal(new Date(2030, 0, 5, 23, 59))).toBe('2030-01-05');
});

test('Clear filters resets province, region and date', async () => {
  const onChange = jest.fn();
  render(
    <CampgroundFilters
      {...props}
      value={{ province: 'Phuket', region: 'South', date: '2030-01-01' }}
      onChange={onChange}
    />
  );
  await userEvent.click(screen.getByRole('button', { name: 'Clear filters' }));
  expect(onChange).toHaveBeenCalledWith({ province: '', region: '', date: '' });
});
