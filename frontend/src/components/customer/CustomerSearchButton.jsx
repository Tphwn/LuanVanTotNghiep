import { Search } from 'lucide-react';

const CustomerSearchButton = ({
  children,
  onClick,
  showIcon = false,
  className = '',
  type = 'button',
  ...rest
}) => (
  <button
    type={type}
    className={['home-search-btn', className].filter(Boolean).join(' ')}
    onClick={onClick}
    {...rest}
  >
    <span>{children}</span>
    {showIcon && <Search size={18} strokeWidth={2.25} aria-hidden />}
  </button>
);

export default CustomerSearchButton;
