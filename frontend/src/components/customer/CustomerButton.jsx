import { Link } from 'react-router-dom';
import { Loader2 } from 'lucide-react';

const CustomerButton = ({
  children,
  to,
  onClick,
  type = 'button',
  className = '',
  disabled = false,
  loading = false,
  fullWidth = false,
  size,
  ...rest
}) => {
  const busy = disabled || loading;
  const classes = [
    'btn',
    'btn-primary',
    'customer-cta',
    size === 'sm' && 'btn-sm',
    fullWidth && 'customer-btn--full',
    loading && 'is-loading',
    className,
  ].filter(Boolean).join(' ');

  const content = loading ? (
    <>
      <Loader2 className="customer-cta-spinner" size={16} strokeWidth={2.25} aria-hidden />
      <span>{typeof children === 'string' ? 'Đang xử lý...' : children}</span>
    </>
  ) : children;

  if (to && busy) {
    return (
      <span className={`${classes} customer-cta--disabled`} aria-disabled="true" {...rest}>
        {content}
      </span>
    );
  }

  if (to) {
    return (
      <Link to={to} className={classes} onClick={onClick} {...rest}>
        {children}
      </Link>
    );
  }

  return (
    <button
      type={type}
      className={classes}
      onClick={onClick}
      disabled={busy}
      aria-busy={loading ? 'true' : undefined}
      {...rest}
    >
      {content}
    </button>
  );
};

export default CustomerButton;
