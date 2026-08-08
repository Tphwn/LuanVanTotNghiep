import formatCurrency from '../../utils/formatCurrency';

const CustomerPrice = ({
  amount,
  className = '',
  size,
}) => {
  const classes = [
    'customer-price',
    size && `customer-price--${size}`,
    className,
  ].filter(Boolean).join(' ');

  return (
    <span className={classes}>
      {formatCurrency(amount)}
    </span>
  );
};

export default CustomerPrice;
