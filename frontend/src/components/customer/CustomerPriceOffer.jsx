import CustomerPrice from './CustomerPrice';

const CustomerPriceOffer = ({
  amount,
  originalAmount,
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
          <CustomerPrice amount={originalAmount} />
        </div>
      )}
      <div className="customer-price-offer-current">
        {label && <span className="customer-price-offer-label">{label} </span>}
        <CustomerPrice
          amount={amount}
          className="customer-price-offer-value"
        />
      </div>
      {suffix && <span className="customer-price-offer-suffix">{suffix}</span>}
      {showTaxNote && (
        <span className="customer-price-offer-note">(Đã bao gồm thuế và phí)</span>
      )}
    </div>
  );
};

export default CustomerPriceOffer;
