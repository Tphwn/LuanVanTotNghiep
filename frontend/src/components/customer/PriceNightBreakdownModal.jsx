import { useEffect } from 'react';
import CustomerPrice from './CustomerPrice';
import formatCurrency from '../../utils/formatCurrency';
import { formatVN } from '../../utils/formatDate';

const buildNightSummary = (row) => {
  const parts = [];
  if (row.so_phong_giam_gia > 0 && row.don_gia_giam_vat != null) {
    parts.push(`${row.so_phong_giam_gia} phòng × ${formatCurrency(row.don_gia_giam_vat)}`);
  }
  if (row.so_phong_gia_goc > 0) {
    parts.push(`${row.so_phong_gia_goc} phòng × ${formatCurrency(row.don_gia_goc_vat)}`);
  }
  return parts.join(' + ') || '—';
};

const PriceNightBreakdownModal = ({
  open,
  onClose,
  chiTietDem = [],
  soPhong = 1,
  nights = 1,
  mode = 'search',
}) => {
  const isBookingMode = mode === 'booking';

  useEffect(() => {
    if (!open) return undefined;
    const onKey = (e) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
    };
  }, [open, onClose]);

  if (!open || !chiTietDem.length) return null;

  return (
    <div className="modal-overlay price-night-modal-overlay" onClick={onClose} role="presentation">
      <div
        className="price-night-modal"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="price-night-modal-title"
      >
        <div className="price-night-modal-header">
          <div>
            <p className="price-night-modal-eyebrow">Chi tiết giá</p>
            <h2 id="price-night-modal-title" className="price-night-modal-title">
              Giá từng đêm
            </h2>
            <p className="price-night-modal-sub">
              {soPhong} phòng · {nights} đêm · giá đã bao gồm thuế
            </p>
          </div>
          <button type="button" className="modal-close" onClick={onClose} aria-label="Đóng">
            ×
          </button>
        </div>

        <div className="price-night-modal-body">
          {isBookingMode ? (
            <ul className="price-night-booking-list">
              {chiTietDem.map((row, index) => (
                <li key={row.ngay} className="price-night-booking-item">
                  <span>
                    Đêm
                    {' '}
                    {index + 1}
                    {' '}
                    (
                    {formatVN(row.ngay)}
                    )
                  </span>
                  <strong>
                    <CustomerPrice amount={row.tong_dem_vat ?? row.gia_trung_binh_dem_vat} />
                  </strong>
                </li>
              ))}
            </ul>
          ) : (
            <table className="price-night-table">
              <thead>
                <tr>
                  <th>Đêm</th>
                  <th>Chi tiết</th>
                  <th>Giá TB / phòng</th>
                </tr>
              </thead>
              <tbody>
                {chiTietDem.map((row) => (
                  <tr key={row.ngay}>
                    <td>{formatVN(row.ngay)}</td>
                    <td>{buildNightSummary(row)}</td>
                    <td>
                      <CustomerPrice amount={row.gia_trung_binh_dem_vat} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
          <p className="price-night-modal-tax-note">(Giá đã bao gồm thuế &amp; phí)</p>
        </div>

        <div className="price-night-modal-footer">
          <button type="button" className="price-night-modal-close-btn" onClick={onClose}>
            Đóng
          </button>
        </div>
      </div>
    </div>
  );
};

export default PriceNightBreakdownModal;
