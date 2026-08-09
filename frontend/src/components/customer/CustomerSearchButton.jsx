import { Loader2, Search } from 'lucide-react';

const CustomerSearchButton = ({
  children,
  onClick,
  showIcon = false,
  className = '',
  type = 'button',
  loading = false,
  disabled = false,
  ...rest
}) => (
  <button
    type={type}
    className={[
      'home-search-btn',
      loading ? 'is-loading' : '',
      className,
    ].filter(Boolean).join(' ')}
    onClick={onClick}
    disabled={disabled || loading}
    aria-busy={loading ? 'true' : undefined}
    {...rest}
  >
    {loading ? (
      <>
        <Loader2 className="home-search-btn__spinner" size={18} strokeWidth={2.25} aria-hidden />
        <span>Đang tìm...</span>
      </>
    ) : (
      <>
        <span>{children}</span>
        {showIcon && <Search size={18} strokeWidth={2.25} aria-hidden />}
      </>
    )}
  </button>
);

export default CustomerSearchButton;
