import formatCurrency from '../../utils/formatCurrency';

const CustomerPrice = ({
  amount,
  unit = 'VNĐ',
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
      {unit ? ` ${unit}` : ''}
    </span>
  );
};

export default CustomerPrice;
