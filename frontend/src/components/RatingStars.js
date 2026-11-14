export default function RatingStars({ rating = 0, count = 0 }) {
  const rounded = Math.round(rating);
  const label =
    count === 0 ? 'No reviews yet' : `${rating} (${count} ${count === 1 ? 'review' : 'reviews'})`;

  return (
    <div className="flex items-center gap-2 text-sm">
      {count > 0 && (
        <span role="img" aria-label={`Rated ${rating} out of 5`} className="flex text-base leading-none">
          {[1, 2, 3, 4, 5].map((n) => (
            <span key={n} aria-hidden="true" className={n <= rounded ? 'text-amber-500' : 'text-stone-300'}>
              ★
            </span>
          ))}
        </span>
      )}
      <span className="text-stone-600">{label}</span>
    </div>
  );
}
