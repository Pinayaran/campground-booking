import RatingStars from './RatingStars';

export default function CampgroundCard({ campground }) {
  const { name, province, region, capacity, averageRating, ratingCount, images } = campground;
  const image = images?.[0] || '/campground-placeholder.svg';

  return (
    <article className="flex flex-col overflow-hidden rounded-xl border border-stone-200 bg-white shadow-sm">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={image} alt={name} className="h-40 w-full object-cover" />
      <div className="flex flex-col gap-2 p-4">
        <h2 className="text-lg font-semibold text-stone-900">{name}</h2>
        <p className="text-sm text-emerald-700">{`${province} · ${region}`}</p>
        <RatingStars rating={averageRating} count={ratingCount} />
        <p className="text-sm text-stone-600">Up to {capacity} {capacity === 1 ? 'camper' : 'campers'}</p>
      </div>
    </article>
  );
}
