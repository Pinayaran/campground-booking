import { render, screen } from '@testing-library/react';
import CampgroundCard from '@/components/CampgroundCard';

const base = {
  _id: '1',
  name: 'Pine Hill',
  province: 'Chiang Mai',
  region: 'North',
  capacity: 12,
  averageRating: 4.5,
  ratingCount: 2,
  images: [],
};

test('shows name, "Chiang Mai · North" and "4.5 (2 reviews)"', () => {
  render(<CampgroundCard campground={base} />);
  expect(screen.getByText('Pine Hill')).toBeInTheDocument();
  expect(screen.getByText('Chiang Mai · North')).toBeInTheDocument();
  expect(screen.getByText('4.5 (2 reviews)')).toBeInTheDocument();
  expect(screen.getByText('Up to 12 campers')).toBeInTheDocument();
});

test('uses the placeholder image when images is empty', () => {
  render(<CampgroundCard campground={base} />);
  expect(screen.getByRole('img', { name: 'Pine Hill' }).getAttribute('src')).toContain(
    'campground-placeholder.svg'
  );
});

test('shows "No reviews yet" when ratingCount is 0', () => {
  render(<CampgroundCard campground={{ ...base, ratingCount: 0, averageRating: 0 }} />);
  expect(screen.getByText('No reviews yet')).toBeInTheDocument();
});

test('shows "1 review" for a count of 1', () => {
  render(<CampgroundCard campground={{ ...base, ratingCount: 1 }} />);
  expect(screen.getByText('4.5 (1 review)')).toBeInTheDocument();
});

test('shows "Up to 1 camper" for capacity 1', () => {
  render(<CampgroundCard campground={{ ...base, capacity: 1 }} />);
  expect(screen.getByText('Up to 1 camper')).toBeInTheDocument();
});
