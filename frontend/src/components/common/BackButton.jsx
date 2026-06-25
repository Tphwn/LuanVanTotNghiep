import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';

const getClassName = (variant, className) => {
  const base = 'page-back-btn';
  const variantClass = {
    default: `${base} page-back-btn--default`,
    outline: `${base} page-back-btn--outline`,
  }[variant] || `${base} page-back-btn--default`;

  return className ? `${variantClass} ${className}` : variantClass;
};

export default function BackButton({
  to,
  onClick,
  label = 'Quay lại',
  variant = 'default',
  className = '',
}) {
  const classes = getClassName(variant, className);
  const content = (
    <>
      <ArrowLeft size={14} strokeWidth={2.5} aria-hidden />
      <span>{label}</span>
    </>
  );

  if (to) {
    return (
      <Link to={to} className={classes}>
        {content}
      </Link>
    );
  }

  return (
    <button type="button" className={classes} onClick={onClick}>
      {content}
    </button>
  );
}
