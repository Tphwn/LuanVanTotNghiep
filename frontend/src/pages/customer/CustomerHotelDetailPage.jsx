import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { useSelector } from 'react-redux';
import {
  AlertTriangle,
  Baby,
  Cigarette,
  Clock3,
  FileText,
  Images,
  ListChecks,
  PartyPopper,
  PawPrint,
  ShieldAlert,
  Star,
} from 'lucide-react';
import BackButton from '../../components/common/BackButton';
import CustomerButton from '../../components/customer/CustomerButton';
import CustomerAmenityTags from '../../components/customer/CustomerAmenityTags';
import CustomerPriceOffer from '../../components/customer/CustomerPriceOffer';
import RoomOfferCard from '../../components/customer/RoomOfferCard';
import HotelSearchBar from '../../components/customer/search/HotelSearchBar';
import CustomerPromotionStrip from '../../components/customer/CustomerPromotionStrip';
import publicHotelService from '../../services/publicHotelService';
import publicPromotionService from '../../services/publicPromotionService';
import { resolveUploadUrl } from '../../utils/media';
import ROUTES from '../../constants/routes';
import { formatHotelTime } from '../../utils/bookingDisplay';
import { REQUIRED_DOC_LABELS } from '../../utils/hotelPolicyUtils';
import { buildCustomerBookingUrl } from '../../utils/bookingNavigation';
import { resolveSearchForm, saveSearchForm, searchFormToParams } from '../../utils/hotelSearchStorage';
import '../../assets/styles/home.css';

const fmtDate = (d) => (d ? new Date(d).toLocaleDateString('vi-VN') : '—');
const stars = (n) => '★'.repeat(Math.max(0, Number(n) || 0));

const REVIEW_CATEGORIES = [
  { key: 'diem_sach_se', label: 'Sạch sẽ' },
  { key: 'diem_dich_vu', label: 'Dịch vụ' },
  { key: 'diem_vi_tri', label: 'Vị trí' },
  { key: 'diem_tien_nghi', label: 'Tiện nghi' },
];

const scoreLabel = (v) => {
  if (v >= 4.5) return 'Xuất sắc';
  if (v >= 4) return 'Rất tốt';
  if (v >= 3.5) return 'Tốt';
  if (v >= 3) return 'Khá';
  if (v > 0) return 'Trung bình';
  return '';
};

const avgCategory = (list, key) => {
  const vals = list.map((r) => Number(r[key])).filter((n) => n > 0);
  if (!vals.length) return 0;
  return vals.reduce((a, b) => a + b, 0) / vals.length;
};

const nameInitial = (name) => (name && name.trim() ? name.trim().charAt(0).toUpperCase() : 'K');

const money = (v) => new Intl.NumberFormat('vi-VN').format(Math.round(Number(v) || 0));

const ReviewStars = ({ value = 0, size = 14 }) => {
  const score = Math.max(0, Math.min(5, Math.round(Number(value) || 0)));
  return (
    <span className="hotel-review-stars" aria-label={`${score} trên 5 sao`}>
      {Array.from({ length: 5 }, (_, i) => (
        <Star
          key={i}
          size={size}
          strokeWidth={2}
          className={i < score ? 'is-filled' : 'is-empty'}
          fill={i < score ? 'currentColor' : 'none'}
          aria-hidden
        />
      ))}
    </span>
  );
};

const buildPolicyRows = (h) => {
  const rows = [];

  if (h.gio_nhan_phong || h.gio_tra_phong) {
    const lines = [];
    if (h.gio_nhan_phong) {
      lines.push({
        label: 'Nhận phòng:',
        value: `Từ ${formatHotelTime(h.gio_nhan_phong, '14:00')}`,
        emphasis: true,
      });
    }
    if (h.gio_tra_phong) {
      lines.push({
        label: 'Trả phòng:',
        value: `Trước ${formatHotelTime(h.gio_tra_phong, '12:00')}`,
        emphasis: true,
      });
    }
    rows.push({
      key: 'checkin',
      label: 'Giờ nhận / trả phòng',
      Icon: Clock3,
      lines,
    });
  }

  const childLines = [];
  if (h.tuoi_toi_da_mien_phi != null) {
    childLines.push(`Trẻ em từ ${h.tuoi_toi_da_mien_phi} tuổi trở xuống được miễn phí khi dùng chung giường với người lớn.`);
  }
  if (h.phu_thu_tre_em != null && Number(h.phu_thu_tre_em) > 0) {
    childLines.push(`Phụ thu ${money(h.phu_thu_tre_em)}đ đối với trẻ em sử dụng giường hiện có.`);
  }
  if (childLines.length) {
    rows.push({ key: 'children', label: 'Chính sách trẻ em', Icon: Baby, lines: childLines });
  }

  rows.push({
    key: 'pets',
    label: 'Thú cưng',
    Icon: PawPrint,
    lines: [h.cho_phep_thu_cung
      ? (h.phu_thu_thu_cung != null && Number(h.phu_thu_thu_cung) > 0
        ? { text: `Cho phép mang theo thú cưng (phụ thu ${money(h.phu_thu_thu_cung)}đ).` }
        : { text: 'Cho phép mang theo thú cưng.', emphasisWords: ['Cho phép'] })
      : { text: 'Không được phép mang theo thú cưng.', emphasisWords: ['Không được phép'] }],
  });

  rows.push({
    key: 'smoking',
    label: 'Hút thuốc',
    Icon: Cigarette,
    lines: [h.cho_phep_hut_thuoc
      ? { text: 'Cho phép hút thuốc.', emphasisWords: ['Cho phép'] }
      : { text: 'Không cho phép hút thuốc.', emphasisWords: ['Không cho phép'] }],
  });

  rows.push({
    key: 'party',
    label: 'Tổ chức tiệc',
    Icon: PartyPopper,
    lines: [h.cho_phep_to_chuc_tiec
      ? { text: 'Cho phép tổ chức tiệc.', emphasisWords: ['Cho phép'] }
      : { text: 'Không cho phép tổ chức tiệc.', emphasisWords: ['Không cho phép'] }],
  });

  if (Array.isArray(h.giay_to_bat_buoc) && h.giay_to_bat_buoc.length) {
    rows.push({
      key: 'docs',
      label: 'Giấy tờ bắt buộc',
      Icon: FileText,
      lines: h.giay_to_bat_buoc.map((doc) => REQUIRED_DOC_LABELS[doc] || doc),
    });
  }

  if (Array.isArray(h.noi_quy_khac) && h.noi_quy_khac.length) {
    rows.push({
      key: 'rules',
      label: 'Nội quy khác',
      Icon: ListChecks,
      lines: h.noi_quy_khac,
    });
  }

  return rows;
};

const buildCancelPolicy = (h) => {
  const cancelPolicies = (h.chinh_sach_huy || [])
    .slice()
    .sort((a, b) => Number(b.so_ngay_truoc) - Number(a.so_ngay_truoc));
  if (!cancelPolicies.length) return null;
  return {
    lines: cancelPolicies.map(
      (p) => `Hủy trước ${p.so_ngay_truoc} ngày: hoàn ${Number(p.phan_tram_hoan)}% tiền đã thanh toán.`,
    ),
  };
};

const renderPolicyLine = (line, i) => {
  if (typeof line === 'string') {
    return <p key={i} className="hotel-policy-line">{line}</p>;
  }
  if (line.label && line.value) {
    return (
      <p key={i} className="hotel-policy-line">
        <span className="hotel-policy-inline-label">{line.label}</span>
        {' '}
        <strong className={line.emphasis ? 'hotel-policy-emphasis' : undefined}>{line.value}</strong>
      </p>
    );
  }
  if (line.text && line.emphasisWords?.length) {
    let parts = [line.text];
    line.emphasisWords.forEach((word) => {
      parts = parts.flatMap((part) => {
        if (typeof part !== 'string') return [part];
        const chunks = part.split(word);
        if (chunks.length === 1) return [part];
        const out = [];
        chunks.forEach((chunk, idx) => {
          if (chunk) out.push(chunk);
          if (idx < chunks.length - 1) {
            out.push(<strong key={`${word}-${idx}`} className="hotel-policy-emphasis">{word}</strong>);
          }
        });
        return out;
      });
    });
    return <p key={i} className="hotel-policy-line">{parts}</p>;
  }
  return <p key={i} className="hotel-policy-line">{line.text || ''}</p>;
};

const buildQueryString = (query) => {
  const params = new URLSearchParams();
  Object.entries(query).forEach(([k, v]) => { if (v) params.set(k, v); });
  return params.toString();
};

const buildBookingUrl = (hotelId, roomId, query) => buildCustomerBookingUrl(hotelId, roomId, query);

const ExpandableIntro = ({ text }) => {
  const [expanded, setExpanded] = useState(false);
  const [overflows, setOverflows] = useState(false);
  const textRef = useRef(null);

  useEffect(() => {
    if (expanded) return undefined;
    const el = textRef.current;
    if (!el) return undefined;

    const checkOverflow = () => {
      setOverflows(el.scrollHeight > el.clientHeight + 1);
    };

    const frameId = requestAnimationFrame(checkOverflow);
    return () => cancelAnimationFrame(frameId);
  }, [text, expanded]);

  return (
    <div className="hotel-detail-intro-wrap">
      <p
        ref={textRef}
        className={`hotel-detail-intro${expanded ? '' : ' hotel-detail-intro--clamped'}`}
      >
        {text}
      </p>
      {(overflows || expanded) && (
        <button
          type="button"
          className="hotel-detail-intro-toggle"
          onClick={() => setExpanded((v) => !v)}
        >
          {expanded ? 'Thu gọn' : 'Xem thêm'}
        </button>
      )}
    </div>
  );
};

const CustomerHotelDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { token } = useSelector((state) => state.auth);
  const [searchParams, setSearchParams] = useSearchParams();
  const [hotel, setHotel] = useState(null);
  const [locations, setLocations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeImg, setActiveImg] = useState(0);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [hotelPromotions, setHotelPromotions] = useState([]);
  const roomListRef = useRef(null);
  const stickyBarRef = useRef(null);
  const [stickyBarHeight, setStickyBarHeight] = useState(110);

  useEffect(() => {
    publicHotelService.getLocations()
      .then((res) => setLocations(res.data?.data || []))
      .catch(() => setLocations([]));
  }, []);

  useLayoutEffect(() => {
    const el = stickyBarRef.current;
    if (!el) return undefined;

    const updateHeight = () => {
      setStickyBarHeight(el.getBoundingClientRect().height);
    };

    updateHeight();
    const observer = new ResizeObserver(updateHeight);
    observer.observe(el);
    window.addEventListener('resize', updateHeight);

    return () => {
      observer.disconnect();
      window.removeEventListener('resize', updateHeight);
    };
  }, [hotel?.ma_khach_san, locations.length]);

  const query = useMemo(() => {
    const resolved = resolveSearchForm({
      ma_dia_diem: searchParams.get('ma_dia_diem') || '',
      ngay_nhan: searchParams.get('ngay_nhan') || '',
      ngay_tra: searchParams.get('ngay_tra') || '',
      so_khach: searchParams.get('so_khach') || '',
      tre_em: searchParams.get('tre_em') || '',
      so_phong: searchParams.get('so_phong') || '',
    });
    return {
      ma_dia_diem: resolved.ma_dia_diem,
      ngay_nhan: resolved.ngay_nhan,
      ngay_tra: resolved.ngay_tra,
      so_khach: String(resolved.so_khach),
      tre_em: String(resolved.tre_em || 0),
      so_phong: String(resolved.so_phong || 1),
    };
  }, [searchParams]);

  const isSearchMode = Boolean(query.ngay_nhan && query.ngay_tra);

  const backUrl = useMemo(() => {
    const qs = buildQueryString(query);
    const base = isSearchMode ? ROUTES.CUSTOMER.ROOM_SEARCH : ROUTES.CUSTOMER.HOTELS;
    return `${base}${qs ? `?${qs}` : ''}`;
  }, [query, isSearchMode]);

  const nights = useMemo(() => {
    if (!query.ngay_nhan || !query.ngay_tra) return 1;
    const a = new Date(query.ngay_nhan);
    const b = new Date(query.ngay_tra);
    return Math.max(Math.round((b - a) / (1000 * 60 * 60 * 24)), 1);
  }, [query.ngay_nhan, query.ngay_tra]);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setError('');
      try {
        const res = await publicHotelService.getHotelById(id, query);
        setHotel(res.data?.data || null);
        setActiveImg(0);
      } catch (err) {
        setHotel(null);
        setError(err.response?.data?.message || 'Không thể tải thông tin khách sạn');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [id, query]);

  useEffect(() => {
    if (!id) {
      setHotelPromotions([]);
      return;
    }
    publicPromotionService.getHotelPromotions(id)
      .then((res) => setHotelPromotions(res.data?.data || []))
      .catch(() => setHotelPromotions([]));
  }, [id]);

  const scrollToRooms = () => {
    roomListRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const handleSearchBar = (data) => {
    saveSearchForm(data);
    const hotelLocationId = String(hotel?.ma_dia_diem || hotel?.dia_diem?.ma_dia_diem || '');
    const selectedLocationId = String(data.ma_dia_diem || '');

    // Cùng địa điểm với khách sạn đang xem → cập nhật ngày/khách và cuộn tới phòng
    if (selectedLocationId && selectedLocationId === hotelLocationId) {
      setSearchParams({
        ma_dia_diem: selectedLocationId,
        ngay_nhan: data.ngay_nhan,
        ngay_tra: data.ngay_tra,
        so_khach: String(data.so_khach),
        tre_em: String(data.tre_em || 0),
        so_phong: String(data.so_phong || 1),
      }, { replace: true });
      setTimeout(() => scrollToRooms(), 120);
      return;
    }

    navigate(`${ROUTES.CUSTOMER.ROOM_SEARCH}?${searchFormToParams(data).toString()}`);
  };

  const handleBookRoom = (roomId) => {
    const room = hotel?.loai_phong?.find((r) => r.ma_loai_phong === roomId);
    if (!room || (room.phong_con_lai ?? 0) < Number(query.so_phong || 1)) return;

    const bookingUrl = buildBookingUrl(id, roomId, query);
    if (!token) {
      navigate(ROUTES.LOGIN, { state: { from: bookingUrl } });
      return;
    }
    navigate(bookingUrl);
  };

  if (loading) {
    return (
      <div className="hotel-detail-page">
        <div className="content-card" style={{ textAlign: 'center', padding: 64, color: '#5a7a72' }}>
          Đang tải chi tiết khách sạn...
        </div>
      </div>
    );
  }

  if (error || !hotel) {
    return (
      <div className="hotel-detail-page">
        <div className="content-card" style={{ textAlign: 'center', padding: 48 }}>
          <p style={{ color: '#e05c5c', marginBottom: 16 }}>{error || 'Không tìm thấy khách sạn'}</p>
          <BackButton to={backUrl} variant="outline" />
        </div>
      </div>
    );
  }

  const images = hotel.hinh_anh || [];
  const mainImg = images[activeImg] || images[0];
  const sideImages = images.slice(1, 5);
  const reviews = hotel.danh_gia || [];
  const policyRows = buildPolicyRows(hotel);
  const cancelPolicy = buildCancelPolicy(hotel);
  const addressLine = [
    hotel.dia_diem?.ten_dia_diem,
    hotel.dia_chi,
  ].filter(Boolean).join(' - ');

  return (
    <div
      className="hotel-detail-shell"
      style={{ '--hotel-sticky-bar-height': `${stickyBarHeight}px` }}
    >
      <div ref={stickyBarRef} className="hotel-detail-sticky-bar">
        <div className="hotel-detail-sticky-inner">
          <HotelSearchBar
            variant="page"
            locations={locations}
            initialValues={{
              ...query,
              ma_dia_diem: String(
                query.ma_dia_diem
                || hotel.ma_dia_diem
                || hotel.dia_diem?.ma_dia_diem
                || '',
              ),
            }}
            onSearch={handleSearchBar}
          />
        </div>
      </div>
      <div className="hotel-detail-sticky-spacer" aria-hidden="true" />

      <div className="hotel-detail-page">
        <BackButton to={backUrl} className="page-back-btn--standalone" />

      {images.length > 0 ? (
        <div className="hotel-gallery-mosaic hotel-gallery-mosaic--tall">
          <div className="hotel-gallery-main">
            {mainImg && (
              <img src={resolveUploadUrl(mainImg.url)} alt={hotel.ten} />
            )}
          </div>
          {sideImages.length > 0 && (
            <div className="hotel-gallery-side hotel-gallery-side--3rows">
              {sideImages.map((img, i) => {
                const realIndex = i + 1;
                const isLast = i === sideImages.length - 1 && images.length > 5;
                return (
                  <button
                    key={img.ma_hinh_anh || realIndex}
                    type="button"
                    className={`hotel-gallery-thumb${isLast ? ' hotel-gallery-thumb--more' : ''}`}
                    onClick={() => (isLast ? setLightboxOpen(true) : setActiveImg(realIndex))}
                  >
                    <img src={resolveUploadUrl(img.url)} alt="" />
                    {isLast && (
                      <span className="hotel-gallery-more-label">
                        <Images size={20} strokeWidth={1.5} style={{ marginBottom: 4 }} />
                        Xem tất cả {images.length} hình
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          )}
        </div>
      ) : (
        <div className="hotel-detail-main-img hotel-detail-img-placeholder" style={{ marginBottom: 16 }} />
      )}

      <div className="hotel-detail-body">
        <div className="hotel-detail-main-col">
          <h1 className="hotel-detail-name">{hotel.ten}</h1>
          <div className="hotel-detail-meta-row">
            <span className="hotel-detail-type-badge">Khách sạn</span>
            {hotel.so_sao > 0 && (
              <span className="hotel-result-stars">{stars(hotel.so_sao)}</span>
            )}
          </div>
          {addressLine && (
            <p className="hotel-detail-location">{addressLine}</p>
          )}

          {hotel.tien_nghi?.length > 0 && (
            <section className="hotel-detail-block">
              <h2 className="hotel-detail-block-title">Tiện nghi</h2>
              <CustomerAmenityTags
                items={hotel.tien_nghi}
                className="hotel-detail-amenity-grid customer-amenity-tags"
              />
            </section>
          )}

          {hotel.mo_ta && (
            <section className="hotel-detail-block">
              <h2 className="hotel-detail-block-title">Giới thiệu</h2>
              <ExpandableIntro key={hotel.mo_ta} text={hotel.mo_ta} />
            </section>
          )}
        </div>

        <aside className="hotel-detail-booking-card">
          {hotel.gia_tu && (
            <CustomerPriceOffer
              amount={hotel.gia_tu}
              originalAmount={hotel.gia_goc}
              align="left"
              showTaxNote={false}
              className="hotel-detail-booking-price-row"
            />
          )}
          {query.ngay_nhan && query.ngay_tra ? (
            <p className="hotel-detail-booking-sub">
              {fmtDate(query.ngay_nhan)} – {fmtDate(query.ngay_tra)} · {nights} đêm
            </p>
          ) : (
            <p className="hotel-detail-booking-sub">(Chưa bao gồm thuế và phí)</p>
          )}
          <div className="hotel-detail-check-times">
            <div>
              <span className="hotel-detail-check-label">Nhận phòng:</span>
              <strong>{formatHotelTime(hotel.gio_nhan_phong, '14:00')}</strong>
            </div>
            <div>
              <span className="hotel-detail-check-label">Trả phòng:</span>
              <strong>{formatHotelTime(hotel.gio_tra_phong, '12:00')}</strong>
            </div>
          </div>
          <CustomerButton className="hotel-detail-booking-btn" fullWidth onClick={scrollToRooms}>
            Chọn phòng
          </CustomerButton>
        </aside>
      </div>

      {hotelPromotions.length > 0 && (
        <div className="hotel-detail-promo-full">
          <CustomerPromotionStrip promotions={hotelPromotions} variant="partner" />
        </div>
      )}

      <section className="hotel-detail-rooms-section" ref={roomListRef}>
        <h2 className="hotel-detail-rooms-heading">
          Các Loại phòng có tại: {hotel.ten}
        </h2>

        {!hotel.loai_phong?.length ? (
          <div className="empty-state">
            <p className="empty-state-text">
              Không có loại phòng phù hợp cho {Number(query.so_phong || 1)} phòng, {Number(query.so_khach) + Number(query.tre_em || 0)} người
              {isSearchMode ? ' trong khoảng thời gian đã chọn' : ''}
            </p>
          </div>
        ) : (
          <div className="hotel-detail-room-list">
            {hotel.loai_phong.map((room) => (
              <RoomOfferCard
                key={room.ma_loai_phong}
                room={room}
                soPhong={Number(query.so_phong) || 1}
                onBook={handleBookRoom}
              />
            ))}
          </div>
        )}
      </section>

      <section className="hotel-detail-reviews-section">
        <h2 className="hotel-detail-block-title hotel-detail-reviews-title">
          Đánh giá của khách hàng
        </h2>
        {reviews.length === 0 ? (
          <p className="hotel-detail-reviews-empty">Chưa có đánh giá cho khách sạn này</p>
        ) : (
          <>
            <div className="hotel-review-summary">
              <div className="hotel-review-summary-bars">
                {REVIEW_CATEGORIES.map((c) => {
                  const v = avgCategory(reviews, c.key);
                  return (
                    <div key={c.key} className="hotel-review-bar-row">
                      <span className="hotel-review-bar-label">{c.label}</span>
                      <span className="hotel-review-bar-track">
                        <span
                          className="hotel-review-bar-fill"
                          style={{ width: `${(Math.min(v, 5) / 5) * 100}%` }}
                        />
                      </span>
                      <span className="hotel-review-bar-value">{v ? v.toFixed(1) : '0.0'}</span>
                    </div>
                  );
                })}
              </div>
              <div className="hotel-review-summary-score">
                <div className="hotel-review-score-badge">
                  <strong>{Number(hotel.diem_trung_binh || 0).toFixed(1)}</strong>
                  <span className="hotel-review-score-badge-meta">
                    <span className="hotel-review-score-badge-scale">/ 5</span>
                    <span className="hotel-review-summary-score-label">
                      {scoreLabel(hotel.diem_trung_binh || 0)}
                    </span>
                  </span>
                </div>
                <div className="hotel-review-summary-count">
                  {hotel.so_danh_gia || reviews.length} đánh giá
                </div>
              </div>
            </div>

            <div className="hotel-review-list">
              {reviews.map((rv) => (
                <article key={rv.ma_danh_gia} className="hotel-review-item">
                  <div className="hotel-review-identity">
                    <span className="hotel-review-avatar">
                      {nameInitial(rv.khach_hang?.ho_ten)}
                    </span>
                    <div className="hotel-review-card-meta">
                      <div className="hotel-review-author">{rv.khach_hang?.ho_ten || 'Khách hàng'}</div>
                      {rv.ten_loai_phong && (
                        <div className="hotel-review-room-name">{rv.ten_loai_phong}</div>
                      )}
                    </div>
                  </div>
                  <div className="hotel-review-body">
                    <div className="hotel-review-card-sub">
                      <ReviewStars value={rv.so_sao} size={14} />
                      <span className="hotel-review-date">Đánh giá ngày {fmtDate(rv.ngay_danh_gia)}</span>
                    </div>
                    {rv.noi_dung && (
                      <p className="hotel-review-content">{rv.noi_dung}</p>
                    )}
                    {rv.phan_hoi_doi_tac && (
                      <div className="hotel-review-partner-reply">
                        {rv.phan_hoi_doi_tac}
                      </div>
                    )}
                  </div>
                </article>
              ))}
            </div>
          </>
        )}
      </section>

      {(policyRows.length > 0 || cancelPolicy) && (
      <section className="hotel-detail-policy-section">
        <h2 className="hotel-detail-block-title hotel-detail-reviews-title">
          Chính sách hủy và chỗ ở
        </h2>
        <div className="hotel-policy-table">
          {policyRows.map((row) => {
            const Icon = row.Icon;
            return (
              <div key={row.key || row.label} className="hotel-policy-row">
                <div className="hotel-policy-label">
                  {Icon && (
                    <span className="hotel-policy-label-icon" aria-hidden>
                      <Icon size={18} strokeWidth={2} />
                    </span>
                  )}
                  <span>{row.label}</span>
                </div>
                <div className="hotel-policy-value">
                  {row.lines.map((line, i) => renderPolicyLine(line, i))}
                </div>
              </div>
            );
          })}
        </div>

        {cancelPolicy && (
          <div className="hotel-policy-cancel-box">
            <div className="hotel-policy-cancel-head">
              <span className="hotel-policy-cancel-icon" aria-hidden>
                <ShieldAlert size={20} strokeWidth={2} />
              </span>
              <div>
                <h3 className="hotel-policy-cancel-title">Chính sách hủy</h3>
                <p className="hotel-policy-cancel-hint">
                  <AlertTriangle size={14} strokeWidth={2.25} aria-hidden />
                  Đọc kỹ trước khi đặt — hủy muộn có thể mất một phần hoặc toàn bộ tiền đã thanh toán.
                </p>
              </div>
            </div>
            <ul className="hotel-policy-cancel-list">
              {cancelPolicy.lines.map((line) => (
                <li key={line}>{line}</li>
              ))}
            </ul>
          </div>
        )}
      </section>
      )}

      {lightboxOpen && images.length > 0 && (
        <div className="hotel-gallery-lightbox" role="dialog" aria-modal="true">
          <button type="button" className="hotel-gallery-lightbox-close" onClick={() => setLightboxOpen(false)}>
            ×
          </button>
          <div className="hotel-gallery-lightbox-grid">
            {images.map((img, i) => (
              <button
                key={img.ma_hinh_anh || i}
                type="button"
                className={`hotel-gallery-lightbox-item${i === activeImg ? ' active' : ''}`}
                onClick={() => { setActiveImg(i); setLightboxOpen(false); }}
              >
                <img src={resolveUploadUrl(img.url)} alt="" />
              </button>
            ))}
          </div>
        </div>
      )}
      </div>
    </div>
  );
};

export default CustomerHotelDetailPage;
