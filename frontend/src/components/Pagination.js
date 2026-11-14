'use client';

const buttonClass =
  'rounded-lg border border-stone-300 bg-white px-4 py-2 text-sm font-medium text-stone-700 hover:bg-stone-100 disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:bg-white';

export default function Pagination({ pagination = {}, page, onPageChange }) {
  return (
    <nav aria-label="Pagination" className="flex items-center justify-center gap-4">
      <button
        type="button"
        className={buttonClass}
        disabled={!pagination.prev}
        onClick={() => onPageChange(pagination.prev.page)}
      >
        Previous
      </button>
      <span className="text-sm text-stone-600">Page {page}</span>
      <button
        type="button"
        className={buttonClass}
        disabled={!pagination.next}
        onClick={() => onPageChange(pagination.next.page)}
      >
        Next
      </button>
    </nav>
  );
}
