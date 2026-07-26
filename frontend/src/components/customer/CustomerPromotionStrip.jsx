import { useRef, useState } from 'react';
import { Check, ChevronLeft, ChevronRight, Percent, Ticket } from 'lucide-react';

const fmtDate = (d) => (d ? new Date(d).toLocaleDateString('vi-VN') : '');

const VARIANT_CONFIG = {
  system: {
    title: 'Ưu đãi đặt phòng! Giảm giá tốt nhất cho bạn',
    hint: 'Chúng tôi sẽ áp dụng mức giảm giá tốt nhất cho bạn khi thanh toán.',
    claimLabel: 'Sao chép tất cả mã',
    claimSuccess: 'Đã sao chép tất cả mã khuyến mãi',
  },
  partner: {
    title: 'Ưu đãi đặc biệt tại khách sạn này',
    hint: 'Áp dụng mã khi đặt phòng để nhận ưu đãi từ khách sạn.',
    claimLabel: 'Sao chép tất cả mã',
    claimSuccess: 'Đã sao chép mã khuyến mãi khách sạn',
  },
};

const CustomerPromotionStrip = ({ promotions = [], variant = 'system', onClaim }) => {
  const scrollRef = useRef(null);
  const [copiedCode, setCopiedCode] = useState('');
  const [claimMsg, setClaimMsg] = useState('');
  const cfg = VARIANT_CONFIG[variant] || VARIANT_CONFIG.system;

  if (!promotions.length) return null;

  const scrollByCards = (direction) => {
    const el = scrollRef.current;
    if (!el) return;
    const step = variant === 'partner' ? 360 : 280;
    el.scrollBy({ left: direction * step, behavior: 'smooth' });
  };

  const copyText = async (text, flashKey) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedCode(flashKey);
      setTimeout(() => setCopiedCode(''), 2000);
      return true;
    } catch {
      return false;
    }
  };

  const handleCopyCode = (promo) => {
    copyText(promo.ma_code, promo.ma_code);
  };

  const handleClaimAll = async () => {
    const codes = promotions.map((p) => p.ma_code).join(', ');
    const ok = await copyText(codes, '__all__');
    if (ok) {
      setClaimMsg(cfg.claimSuccess);
      setTimeout(() => setClaimMsg(''), 3000);
      onClaim?.(promotions);
    }
  };

  const headline = promotions[0]?.discount_label
    ? `${cfg.title} — ${promotions[0].discount_label}`
    : cfg.title;

  return (
    <section
      className={`customer-promo-strip customer-promo-strip--${variant}`}
      aria-label="Khuyến mãi"
    >
      <div className="customer-promo-strip__header">
        <div className="customer-promo-strip__headline-wrap">
          <h2 className="customer-promo-strip__title">{headline}</h2>
          <p className="customer-promo-strip__hint">
            <Check size={14} strokeWidth={2.5} aria-hidden />
            {cfg.hint}
          </p>
          {claimMsg && <p className="customer-promo-strip__toast">{claimMsg}</p>}
        </div>
        <button type="button" className="customer-promo-strip__claim-btn" onClick={handleClaimAll}>
          {cfg.claimLabel}
        </button>
      </div>

      <div className="customer-promo-strip__carousel-wrap">
        {promotions.length > 2 && (
          <button
            type="button"
            className="customer-promo-strip__scroll-btn"
            onClick={() => scrollByCards(-1)}
            aria-label="Xem khuyến mãi trước"
          >
            <ChevronLeft size={20} />
          </button>
        )}
        <div className="customer-promo-strip__carousel" ref={scrollRef}>
          {promotions.map((promo) => (
            <button
              key={promo.ma_khuyen_mai || promo.ma_code}
              type="button"
              className="customer-promo-strip__card"
              onClick={() => handleCopyCode(promo)}
              title={`Nhấn để sao chép mã ${promo.ma_code}`}
            >
              <span className="customer-promo-strip__card-icon" aria-hidden>
                {promo.loai_giam === 'phan_tram' ? <Percent size={18} /> : <Ticket size={18} />}
              </span>
              <span className="customer-promo-strip__card-body">
                <strong className="customer-promo-strip__card-discount">
                  {promo.discount_label}
                </strong>
                <span className="customer-promo-strip__card-desc">
                  {promo.mo_ta || promo.ten}
                  {promo.don_hang_toi_thieu > 0 && (
                    <> · Đơn tối thiểu {Number(promo.don_hang_toi_thieu).toLocaleString('vi-VN')}đ</>
                  )}
                </span>
                <span className="customer-promo-strip__card-meta">
                  Mã: <em>{promo.ma_code}</em>
                  {promo.ngay_ket_thuc && <> · HSD {fmtDate(promo.ngay_ket_thuc)}</>}
                </span>
                {copiedCode === promo.ma_code && (
                  <span className="customer-promo-strip__card-copied">Đã sao chép!</span>
                )}
              </span>
            </button>
          ))}
        </div>
        {promotions.length > 2 && (
          <button
            type="button"
            className="customer-promo-strip__scroll-btn"
            onClick={() => scrollByCards(1)}
            aria-label="Xem thêm khuyến mãi"
          >
            <ChevronRight size={20} />
          </button>
        )}
      </div>
    </section>
  );
};

export default CustomerPromotionStrip;
