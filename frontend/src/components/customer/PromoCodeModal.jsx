import { useEffect, useState } from 'react';
import { Tag, X } from 'lucide-react';

import formatCurrency from '../../utils/formatCurrency';

const fmtMoney = formatCurrency;

const PromoCodeModal = ({
  open,
  totalPay = 0,
  eligible = [],
  loadingList = false,
  applying = false,
  appliedCode = '',
  error = '',
  success = '',
  onClose,
  onApply,
  onRemove,
}) => {
  const [inputCode, setInputCode] = useState('');
  const [selectedCode, setSelectedCode] = useState('');

  useEffect(() => {
    if (!open) return;
    setInputCode(appliedCode || '');
    setSelectedCode(appliedCode || '');
  }, [open, appliedCode]);

  if (!open) return null;

  const codeToApply = (inputCode || selectedCode || '').trim().toUpperCase();

  const handlePick = (code) => {
    setSelectedCode(code);
    setInputCode(code);
  };

  const handleApply = () => {
    if (!codeToApply || applying) return;
    onApply?.(codeToApply);
  };

  return (
    <div className="promo-code-modal-overlay" role="presentation" onClick={onClose}>
      <div
        className="promo-code-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="promo-code-modal-title"
        onClick={(e) => e.stopPropagation()}
      >
        <header className="promo-code-modal__header">
          <h2 id="promo-code-modal-title">Thêm mã giảm</h2>
          <button
            type="button"
            className="promo-code-modal__close"
            onClick={onClose}
            aria-label="Đóng"
          >
            <X size={20} strokeWidth={2.25} />
          </button>
        </header>

        <div className="promo-code-modal__body">
          <label className="promo-code-modal__label" htmlFor="promo-modal-input">
            Mã giảm giá / Voucher
          </label>
          <div className="promo-code-modal__input-row">
            <div className="promo-code-modal__input-wrap">
              <Tag size={16} strokeWidth={2.25} aria-hidden />
              <input
                id="promo-modal-input"
                type="text"
                value={inputCode}
                onChange={(e) => {
                  setInputCode(e.target.value.toUpperCase());
                  setSelectedCode('');
                }}
                placeholder="NHẬP MÃ"
                maxLength={40}
                disabled={applying}
                autoComplete="off"
              />
            </div>
            <button
              type="button"
              className="promo-code-modal__apply-btn"
              onClick={handleApply}
              disabled={applying || !codeToApply}
            >
              {applying ? 'Đang áp...' : 'Áp dụng'}
            </button>
          </div>

          {success && <p className="promo-code-modal__ok">{success}</p>}
          {error && <p className="promo-code-modal__error">{error}</p>}

          <h3 className="promo-code-modal__list-title">Mã khả dụng cho đơn này</h3>
          <div className="promo-code-modal__list">
            {loadingList ? (
              <p className="promo-code-modal__empty">Đang tải mã khuyến mãi...</p>
            ) : eligible.length === 0 ? (
              <p className="promo-code-modal__empty">Không có mã khả dụng cho đơn này</p>
            ) : (
              eligible.map((item) => {
                const active = selectedCode === item.ma_code || appliedCode === item.ma_code;
                return (
                  <button
                    key={item.ma_khuyen_mai || item.ma_code}
                    type="button"
                    className={`promo-code-modal__item${active ? ' is-active' : ''}`}
                    onClick={() => handlePick(item.ma_code)}
                    disabled={applying}
                  >
                    <span className="promo-code-modal__item-main">
                      <strong>{item.ma_code}</strong>
                      <small>{item.mo_ta || item.ten || item.discount_label}</small>
                    </span>
                    <span className="promo-code-modal__item-discount">
                      -
                      {fmtMoney(item.so_tien_giam)}
                    </span>
                  </button>
                );
              })
            )}
          </div>
        </div>

        <footer className="promo-code-modal__footer">
          <div className="promo-code-modal__pay">
            <span>Thanh toán</span>
            <strong>{fmtMoney(totalPay)}</strong>
          </div>
          <div className="promo-code-modal__footer-actions">
            {appliedCode && (
              <button
                type="button"
                className="promo-code-modal__remove-btn"
                onClick={onRemove}
                disabled={applying}
              >
                Bỏ mã
              </button>
            )}
            <button type="button" className="promo-code-modal__ok-btn" onClick={onClose}>
              OK
            </button>
          </div>
        </footer>
      </div>
    </div>
  );
};

export default PromoCodeModal;
