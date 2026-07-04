import { Link } from 'react-router-dom';

const CustomerButton = ({
  children,
  to,
  onClick,
  type = 'button',
  className = '',
  disabled = false,
  fullWidth = false,
  size,
  ...rest
}) => {
  const classes = [
    'btn',
    'btn-primary',
    'customer-cta',
    size === 'sm' && 'btn-sm',
    fullWidth && 'customer-btn--full',
    className,
  ].filter(Boolean).join(' ');

  if (to && disabled) {
    return (
      <span className={`${classes} customer-cta--disabled`} aria-disabled="true" {...rest}>
        {children}
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
      disabled={disabled}
      {...rest}
    >
      {children}
    </button>
  );
};

export default CustomerButton;
