import { Link } from 'react-router-dom';

const CustomerAmenityTag = ({
  children,
  to,
  more = false,
  className = '',
  title,
  onClick,
}) => {
  const classes = [
    'customer-amenity-tag',
    more && 'customer-amenity-tag--more',
    className,
  ].filter(Boolean).join(' ');

  if (to) {
    return (
      <Link to={to} className={classes} title={title} onClick={onClick}>
        {children}
      </Link>
    );
  }

  return (
    <span className={classes} title={title} onClick={onClick}>
      {children}
    </span>
  );
};

export default CustomerAmenityTag;
