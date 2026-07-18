import { Star } from 'lucide-react';

export default function CustomerStarRating({
  label,
  hint,
  required,
  value,
  onChange,
  readOnly = false,
}) {
  return (
    <div className="customer-review-criterion-card">
      <div className="customer-review-criterion-card-head">
        <div className="customer-review-criterion-card-title">
          <span className={required ? 'required' : ''}>{label}</span>
          {hint && !readOnly && <small>{hint}</small>}
        </div>
        <div className="customer-review-criterion-card-score">
          <Star size={14} fill={value > 0 ? 'currentColor' : 'none'} strokeWidth={2} />
          <strong>{value > 0 ? `${value}/5` : '—/5'}</strong>
        </div>
      </div>

      <div className={`customer-review-stars${readOnly ? ' customer-review-stars--readonly' : ''}`}>
        {[1, 2, 3, 4, 5].map((n) => (
          readOnly ? (
            <span
              key={n}
              className={`customer-review-star-btn${value === n ? ' active' : ''}`}
              aria-hidden
            >
              {n}
            </span>
          ) : (
            <button
              key={n}
              type="button"
              className={`customer-review-star-btn${value === n ? ' active' : ''}`}
              onClick={() => onChange(n)}
              aria-label={`${n} sao`}
              aria-pressed={value === n}
            >
              {n}
            </button>
          )
        ))}
      </div>
    </div>
  );
}
