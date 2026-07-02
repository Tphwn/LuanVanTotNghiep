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
    {showIcon && <Search size={18} strokeWidth={2.5} aria-hidden />}
    {children}
  </button>
);

export default CustomerSearchButton;
