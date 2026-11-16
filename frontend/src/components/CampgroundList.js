import CampgroundCard from './CampgroundCard';

export default function CampgroundList({ campgrounds = [], loading = false, error = null }) {
  if (loading) return <p className="py-12 text-center text-stone-600">Loading campgrounds…</p>;
  if (error) {
    return (
      <p role="alert" className="py-12 text-center text-red-700">
        {error}
      </p>
    );
  }
  if (campgrounds.length === 0) {
    return <p className="py-12 text-center text-stone-600">No campgrounds found</p>;
  }
  return (
    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
      {campgrounds.map((c) => (
        <CampgroundCard key={c._id} campground={c} />
      ))}
    </div>
  );
}
