import { Star } from 'lucide-react';

const StarRating = ({ value }) => {
  if (!value) return <span className="mgmt-muted">—</span>;
  return (
    <span className="mgmt-stars">
      <Star size={14} fill="#f5a623" stroke="#f5a623" />
      {value}
    </span>
  );
};

export default StarRating;
