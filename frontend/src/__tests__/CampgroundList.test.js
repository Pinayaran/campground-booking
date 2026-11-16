import { render, screen } from '@testing-library/react';
import CampgroundList from '@/components/CampgroundList';

test.each([
  [{ loading: true }, 'Loading campgrounds…'],
  [{ error: 'Network down' }, 'Network down'],
  [{ campgrounds: [] }, 'No campgrounds found'],
])('state %p shows %p', (props, text) => {
  render(<CampgroundList campgrounds={[]} {...props} />);
  expect(screen.getByText(text)).toBeInTheDocument();
});

test('renders a card per campground', () => {
  const c = (i) => ({
    _id: `${i}`,
    name: `Camp ${i}`,
    province: 'P',
    region: 'R',
    capacity: 1,
    ratingCount: 0,
    images: [],
  });
  render(<CampgroundList campgrounds={[c(1), c(2)]} />);
  expect(screen.getByText('Camp 1')).toBeInTheDocument();
  expect(screen.getByText('Camp 2')).toBeInTheDocument();
});
