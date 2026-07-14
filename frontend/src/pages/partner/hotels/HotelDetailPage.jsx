import { useEffect, useMemo, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate, useParams } from 'react-router-dom';
import {
  Calendar, ChevronLeft, ChevronRight, MapPin, Pencil, Sparkles, Star,
} from 'lucide-react';
import { resolveUploadUrl } from '../../../utils/media';
import BackButton from '../../../components/common/BackButton';
import ActionButton from '../../../components/common/ActionButton';
import ToggleSwitch from '../../../components/common/management/ToggleSwitch';
import DetailTable from '../../../components/booking/DetailTable';
import { formatDate, formatHotelTime } from '../../../utils/bookingDisplay';
import { fetchMyHotels, updateHotel, clearMsg } from '../../../store/slices/partnerHotelSlice';
import PartnerHotelPauseConfirmModal from './components/PartnerHotelPauseConfirmModal';
import { HOTEL_CATEGORY_GROUPS } from '../../admin/amenities/constants';
import { groupAmenitiesByCategory } from '../../admin/amenities/utils';
import { getHotelStatusMeta } from '../../../constants/statusConfig';
import {
  REQUIRED_DOC_LABELS,
  parseGiayToBatBuoc,
  parseNoiQuyKhac,
  formatMoneyVnd,
  formatYesNo,
} from './hotelPolicyUtils';

const PARTNER_HOTEL_TABS = [
  { id: 'overview', label: 'Tổng quan' },
  { id: 'images', label: 'Hình ảnh' },
  { id: 'amenities', label: 'Tiện nghi' },
  { id: 'policies', label: 'Nội quy & Chính sách' },
];

const formatDateTime = (date) => (date ? new Date(date).toLocaleString('vi-VN') : '—');

const getNameInitial = (name) => {
  if (!name) return '?';
  const word = name.trim().split(/\s+/).filter(Boolean)[0];
  return word?.[0]?.toUpperCase() || '?';
};

const DetailTabs = ({ tabs, activeTab, onChange }) => (
  <div className="admin-user-detail-tabs" role="tablist">
    {tabs.map((tab) => (
      <button
        key={tab.id}
        type="button"
        role="tab"
        aria-selected={activeTab === tab.id}
        className={`admin-user-detail-tab${activeTab === tab.id ? ' is-active' : ''}`}
        onClick={() => onChange(tab.id)}
      >
        {tab.label}
      </button>
    ))}
  </div>
);

export default function HotelDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { list = [], loading, successMsg, error } = useSelector((s) => s.partnerHotel || {});

  const [confirmAction, setConfirmAction] = useState(null);
  const [toggleLoading, setToggleLoading] = useState(false);
  const [activeImg, setActiveImg] = useState(0);
  const [activeTab, setActiveTab] = useState('overview');

  const hotel = list.find((h) => String(h.ma_khach_san) === String(id));

  useEffect(() => {
    if (list.length === 0) dispatch(fetchMyHotels());
  }, [dispatch, list.length]);

  useEffect(() => {
    if (successMsg || error) {
      const timer = setTimeout(() => dispatch(clearMsg()), 4000);
      return () => clearTimeout(timer);
    }
    return undefined;
  }, [successMsg, error, dispatch]);

  useEffect(() => {
    setActiveImg(0);
  }, [hotel?.ma_khach_san]);

  const amenityGroups = useMemo(() => {
    if (!hotel) return [];
    const items = (hotel.khach_san_tien_nghi || []).map((tn) => ({
      ma_tien_nghi: tn.ma_tien_nghi || tn.tien_nghi?.ma_tien_nghi,
      ten: tn.tien_nghi?.ten,
      danh_muc: tn.tien_nghi?.danh_muc,
      bieu_tuong: tn.tien_nghi?.bieu_tuong,
    })).filter((item) => item.ten);
    return groupAmenitiesByCategory(items, HOTEL_CATEGORY_GROUPS).filter((g) => g.items.length > 0);
  }, [hotel]);

  const handleToggleStatus = () => {
    if (!hotel) return;
    const isActivating = hotel.trang_thai === 'bi_khoa';
    setConfirmAction({
      hotel,
      action: isActivating ? 'resume' : 'pause',
    });
  };

  const handleCloseConfirm = () => {
    if (toggleLoading) return;
    setConfirmAction(null);
  };

  const handleConfirmToggle = async () => {
    if (!confirmAction?.hotel) return;

    const { hotel: target, action } = confirmAction;
    const newStatus = action === 'resume' ? 'hoat_dong' : 'bi_khoa';

    setToggleLoading(true);
    const result = await dispatch(updateHotel({
      id: target.ma_khach_san,
      data: { trang_thai: newStatus },
    }));
    setToggleLoading(false);

    if (!updateHotel.rejected.match(result)) {
      setConfirmAction(null);
    }
  };

  if (loading && !hotel) {
    return (
      <div className="mgmt-page admin-hotel-detail-page admin-user-detail-page partner-hotels-page">
        <div className="admin-user-detail-loading">Đang tải...</div>
      </div>
    );
  }

  if (!hotel) {
    return (
      <div className="mgmt-page admin-hotel-detail-page admin-user-detail-page partner-hotels-page">
        <BackButton to="/partner/hotels" />
        <div className="content-card admin-user-detail-section" style={{ marginTop: 16 }}>
          <p className="empty-state-text">Không tìm thấy khách sạn</p>
        </div>
      </div>
    );
  }

  const st = getHotelStatusMeta(hotel, { variant: 'badge' });
  const adminLocked = hotel.trang_thai === 'bi_khoa' && !hotel.khoa_do_doi_tac;
  const images = hotel.hinh_anh?.length ? hotel.hinh_anh : [];
  const currentImg = images[activeImg] || images[0];
  const requiredDocs = parseGiayToBatBuoc(hotel.giay_to_bat_buoc)
    .map((docId) => REQUIRED_DOC_LABELS[docId] || docId);
  const noiQuyKhac = parseNoiQuyKhac(hotel.noi_quy_khac);
  const cancelPolicies = (hotel.chinh_sach_huy || [])
    .filter((p) => p.trang_thai === 'hoat_dong' || !p.trang_thai)
    .sort((a, b) => b.so_ngay_truoc - a.so_ngay_truoc);

  const currentTab = PARTNER_HOTEL_TABS.some((t) => t.id === activeTab) ? activeTab : 'overview';

  const prevImg = () => {
    if (!images.length) return;
    setActiveImg((i) => (i - 1 + images.length) % images.length);
  };

  const nextImg = () => {
    if (!images.length) return;
    setActiveImg((i) => (i + 1) % images.length);
  };

  return (
    <div className="mgmt-page admin-hotel-detail-page admin-user-detail-page partner-hotels-page">
      <div className="admin-user-detail-top">
        <BackButton to="/partner/hotels" />
      </div>

      {(successMsg || error) && (
        <div className={`mgmt-toast ${successMsg ? 'success' : 'error'}`}>
          {successMsg || error}
        </div>
      )}

      <PartnerHotelPauseConfirmModal
        hotel={confirmAction?.hotel}
        action={confirmAction?.action}
        loading={toggleLoading}
        onClose={handleCloseConfirm}
        onConfirm={handleConfirmToggle}
      />

      <div className="admin-user-detail-hero content-card">
        <div className="admin-user-detail-hero-main">
          <div className="admin-user-detail-avatar" aria-hidden>
            {getNameInitial(hotel.ten)}
          </div>
          <div className="admin-user-detail-hero-body">
            <div className="admin-user-detail-hero-title-row">
              <h1 className="admin-user-detail-name">{hotel.ten}</h1>
              <span className={`badge ${st.cls}`}>{st.label}</span>
            </div>
            <ul className="admin-user-detail-hero-meta">
              <li><MapPin size={14} strokeWidth={2} /><span>{hotel.dia_diem?.ten_dia_diem || '—'}</span></li>
              <li><Star size={14} strokeWidth={2} /><span>{hotel.so_sao ? `${hotel.so_sao} sao` : 'Chưa xếp hạng'}</span></li>
              <li><Calendar size={14} strokeWidth={2} /><span>Đăng ký: {formatDate(hotel.ngay_tao)}</span></li>
            </ul>
            <p className="admin-hotel-detail-hero-address">{hotel.dia_chi || '—'}</p>
          </div>
        </div>
        <div className="admin-user-detail-hero-side">
          <p><span>Mã khách sạn:</span> <strong>#{hotel.ma_khach_san}</strong></p>
          <p><span>Ngày duyệt:</span> <strong>{formatDateTime(hotel.ngay_duyet)}</strong></p>
          {['hoat_dong', 'bi_khoa'].includes(hotel.trang_thai) && (
            <div className="partner-hotel-detail-hero-toggle">
              <ToggleSwitch
                checked={hotel.trang_thai === 'hoat_dong'}
                disabled={adminLocked || toggleLoading}
                onChange={handleToggleStatus}
                labelOn="Đang hoạt động"
                labelOff={adminLocked ? 'Admin khóa' : 'Tạm ngừng'}
              />
            </div>
          )}
          {adminLocked && hotel.ly_do_khoa && (
            <p className="partner-hotel-detail-lock-note">
              <span>Lý do khóa:</span> {hotel.ly_do_khoa}
            </p>
          )}
        </div>
      </div>

      <section className="content-card admin-user-detail-panel">
        <DetailTabs tabs={PARTNER_HOTEL_TABS} activeTab={currentTab} onChange={setActiveTab} />

        {currentTab === 'overview' && (
          <div className="admin-user-detail-tab-panel">
            <DetailTable
              rows={[
                { label: 'Mã khách sạn', value: `#${hotel.ma_khach_san}` },
                { label: 'Tên khách sạn', value: hotel.ten },
                { label: 'Địa điểm', value: hotel.dia_diem?.ten_dia_diem || '—' },
                { label: 'Địa chỉ', value: hotel.dia_chi || '—' },
                { label: 'Hạng sao', value: hotel.so_sao ? `${hotel.so_sao} sao` : '—' },
                {
                  label: 'Loại phòng',
                  value: hotel._count?.loai_phong != null ? String(hotel._count.loai_phong) : '0',
                },
                { label: 'Giờ nhận phòng', value: formatHotelTime(hotel.gio_nhan_phong, '—') },
                { label: 'Giờ trả phòng', value: formatHotelTime(hotel.gio_tra_phong, '—') },
                { label: 'Trạng thái', value: <span className={`badge ${st.cls}`}>{st.label}</span> },
                { label: 'Mô tả', value: hotel.mo_ta?.trim() || '—' },
                { label: 'Ngày đăng ký', value: formatDateTime(hotel.ngay_tao) },
                { label: 'Ngày duyệt', value: formatDateTime(hotel.ngay_duyet) },
                {
                  label: 'Lý do từ chối / yêu cầu sửa',
                  value: hotel.ly_do_tu_choi?.trim() || '—',
                },
              ]}
            />
          </div>
        )}

        {currentTab === 'images' && (
          <div className="admin-user-detail-tab-panel">
            <div className="admin-hotel-detail-gallery">
              <div className="admin-hotel-detail-main-view">
                {currentImg ? (
                  <img src={resolveUploadUrl(currentImg.url)} alt={hotel.ten} />
                ) : (
                  <div className="admin-hotel-detail-main-view--empty">Chưa có ảnh</div>
                )}
                {images.length > 1 && (
                  <>
                    <button
                      type="button"
                      className="admin-hotel-detail-nav admin-hotel-detail-nav--prev"
                      onClick={prevImg}
                      aria-label="Ảnh trước"
                    >
                      <ChevronLeft size={22} />
                    </button>
                    <button
                      type="button"
                      className="admin-hotel-detail-nav admin-hotel-detail-nav--next"
                      onClick={nextImg}
                      aria-label="Ảnh sau"
                    >
                      <ChevronRight size={22} />
                    </button>
                  </>
                )}
              </div>
              {images.length > 0 && (
                <div className="admin-hotel-detail-thumb-row">
                  {images.map((img, i) => (
                    <button
                      key={img.ma_hinh_anh || i}
                      type="button"
                      className={`admin-hotel-detail-thumb${i === activeImg ? ' active' : ''}`}
                      onClick={() => setActiveImg(i)}
                    >
                      <img src={resolveUploadUrl(img.url)} alt="" />
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {currentTab === 'amenities' && (
          <div className="admin-user-detail-tab-panel">
            {amenityGroups.length === 0 ? (
              <p className="empty-state-text">Chưa có tiện nghi</p>
            ) : (
              <div className="admin-hotel-detail-amenities">
                <div className="partner-room-detail-block-title">
                  <Sparkles size={15} strokeWidth={1.75} />
                  Tiện nghi khách sạn
                </div>
                <div className="partner-room-detail-amenity-groups">
                  {amenityGroups.map((group) => (
                    <div key={group.id} className="partner-room-detail-amenity-group">
                      <h4 className="partner-room-detail-amenity-group-title">{group.label}</h4>
                      <div className="partner-room-detail-amenity-list">
                        {group.items.map((item) => (
                          <span key={item.ma_tien_nghi} className="partner-room-detail-amenity-tag">
                            {item.ten}
                          </span>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {currentTab === 'policies' && (
          <div className="admin-user-detail-tab-panel">
            <div className="partner-hotel-detail-section">
              <div className="booking-detail-section-title">Nội quy & Chỗ ở</div>
              <DetailTable
                rows={[
                  {
                    label: 'Giấy tờ bắt buộc',
                    value: requiredDocs.length ? requiredDocs.join(', ') : 'Không yêu cầu',
                  },
                  { label: 'Cho phép hút thuốc', value: formatYesNo(hotel.cho_phep_hut_thuoc) },
                  { label: 'Cho phép tổ chức tiệc', value: formatYesNo(hotel.cho_phep_to_chuc_tiec) },
                  { label: 'Cho phép thú cưng', value: formatYesNo(hotel.cho_phep_thu_cung) },
                  {
                    label: 'Phụ thu thú cưng',
                    value: hotel.cho_phep_thu_cung ? formatMoneyVnd(hotel.phu_thu_thu_cung) : '—',
                  },
                  {
                    label: 'Trẻ em miễn phí (tối đa)',
                    value: hotel.tuoi_toi_da_mien_phi != null ? `${hotel.tuoi_toi_da_mien_phi} tuổi` : '—',
                  },
                  { label: 'Phụ thu trẻ em', value: formatMoneyVnd(hotel.phu_thu_tre_em) },
                ]}
              />

              {noiQuyKhac.length > 0 && (
                <div className="partner-hotel-detail-subsection">
                  <div className="partner-hotel-detail-subtitle">Nội quy riêng của khách sạn</div>
                  <ul className="partner-hotel-detail-rule-list">
                    {noiQuyKhac.map((rule, idx) => (
                      <li key={idx}>{rule}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>

            <div className="partner-hotel-detail-section">
              <div className="booking-detail-section-title">Chính sách hủy</div>
              {cancelPolicies.length > 0 ? (
                <table className="data-table partner-hotel-policy-table">
                  <thead>
                    <tr>
                      <th>Hủy trước (ngày)</th>
                      <th>Hoàn tiền (%)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {cancelPolicies.map((p) => (
                      <tr key={p.ma_chinh_sach || `${p.so_ngay_truoc}-${p.phan_tram_hoan}`}>
                        <td>{p.so_ngay_truoc} ngày</td>
                        <td>{Number(p.phan_tram_hoan)}%</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <p className="partner-hotel-detail-empty">Chưa cấu hình — khách hủy sẽ mất 100% cọc</p>
              )}
            </div>
          </div>
        )}
      </section>
    </div>
  );
}
