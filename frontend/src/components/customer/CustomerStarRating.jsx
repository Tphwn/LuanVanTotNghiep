import { Star } from 'lucide-react';

export default function CustomerStarRating({
  label, hint, required, value, onChange, readOnly = false,
}) {
  return (
    <div className="customer-review-criterion">
      <div className="customer-review-criterion-head">
        <span className={required ? 'required' : ''}>{label}</span>
        {hint && !readOnly && <small>{hint}</small>}
      </div>
      <div className={`customer-review-stars${readOnly ? ' customer-review-stars--readonly' : ''}`}>
        {[1, 2, 3, 4, 5].map((n) => (
          readOnly ? (
            <span
              key={n}
              className={`customer-review-star-btn${value >= n ? ' active' : ''}`}
              aria-hidden
            >
              <Star size={16} fill={value >= n ? 'currentColor' : 'none'} strokeWidth={2} />
              <span>{n}</span>
            </span>
          ) : (
            <button
              key={n}
              type="button"
              className={`customer-review-star-btn${value >= n ? ' active' : ''}`}
              onClick={() => onChange(n)}
              aria-label={`${n} sao`}
              aria-pressed={value >= n}
            >
              <Star size={16} fill={value >= n ? 'currentColor' : 'none'} strokeWidth={2} />
              <span>{n}</span>
            </button>
          )
        ))}
      </div>
    </div>
  );
}
