import CustomerPrice from './CustomerPrice';

const CustomerPriceOffer = ({
  amount,
  originalAmount,
  unit = 'VNĐ',
  valueUnit = '₫',
  label = 'Giá từ:',
  suffix,
  showTaxNote = true,
  className = '',
  align = 'right',
}) => {
  const hasDiscount = originalAmount != null
    && Number(originalAmount) > Number(amount);

  return (
    <div className={`customer-price-offer customer-price-offer--${align}${className ? ` ${className}` : ''}`}>
      {hasDiscount && (
        <div className="customer-price-offer-original">
          <CustomerPrice amount={originalAmount} unit={unit} />
        </div>
      )}
      <div className="customer-price-offer-current">
        {label && <span className="customer-price-offer-label">{label} </span>}
        <CustomerPrice
          amount={amount}
          unit={valueUnit}
          className="customer-price-offer-value"
        />
      </div>
      {suffix && <span className="customer-price-offer-suffix">{suffix}</span>}
      {hasDiscount && showTaxNote && (
        <span className="customer-price-offer-note">Chưa bao gồm thuế và phí</span>
      )}
    </div>
  );
};

export default CustomerPriceOffer;
