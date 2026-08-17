import { useState } from 'react';
import { Info } from 'lucide-react';
import CustomerPrice from './CustomerPrice';
import PriceNightBreakdownModal from './PriceNightBreakdownModal';

const CustomerPriceOffer = ({
  amount,
  originalAmount,
  label = 'Giá từ:',
  suffix,
  showTaxNote = true,
  className = '',
  align = 'right',
  isAveragePrice = false,
  chiTietDem = [],
  soPhong = 1,
  nights = 1,
  showNightDetailLink = false,
}) => {
  const [breakdownOpen, setBreakdownOpen] = useState(false);
  const hasDiscount = originalAmount != null
    && Number(originalAmount) > Number(amount);
  const priceLabel = isAveragePrice ? 'Giá trung bình:' : label;
  const showNightDetail = showNightDetailLink && chiTietDem.length > 0;

  return (
    <>
      <div className={`customer-price-offer customer-price-offer--${align}${className ? ` ${className}` : ''}`}>
        {hasDiscount && (
          <div className="customer-price-offer-original">
            <CustomerPrice amount={originalAmount} />
          </div>
        )}
        <div className="customer-price-offer-current">
          {priceLabel && <span className="customer-price-offer-label">{priceLabel} </span>}
          <CustomerPrice
            amount={amount}
            className="customer-price-offer-value"
          />
        </div>
        {suffix && <span className="customer-price-offer-suffix">{suffix}</span>}
        {showTaxNote && (
          <span className="customer-price-offer-note">(Đã bao gồm thuế và phí)</span>
        )}
        {showNightDetail && (
          <button
            type="button"
            className="customer-price-offer-detail-link"
            onClick={() => setBreakdownOpen(true)}
            title="Xem chi tiết giá từng đêm"
          >
            <Info size={14} aria-hidden />
            Chi tiết giá từng đêm
          </button>
        )}
      </div>

      <PriceNightBreakdownModal
        open={breakdownOpen}
        onClose={() => setBreakdownOpen(false)}
        chiTietDem={chiTietDem}
        soPhong={soPhong}
        nights={nights}
      />
    </>
  );
};

export default CustomerPriceOffer;
