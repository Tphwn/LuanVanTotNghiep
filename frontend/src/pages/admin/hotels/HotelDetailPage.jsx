import { useEffect, useState, useCallback, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { ChevronLeft, ChevronRight, Sparkles } from 'lucide-react';
import adminHotelService from '../../../services/adminHotelService';
import {
  approveHotel, rejectHotel, lockHotel, unlockHotel,
} from '../../../store/slices/adminHotelSlice';
import { resolveUploadUrl } from '../../../utils/media';
import ActionButton, { TableActions } from '../../../components/common/ActionButton';
import BackButton from '../../../components/common/BackButton';
import { HOTEL_CATEGORY_GROUPS } from '../amenities/constants';
import { groupAmenitiesByCategory } from '../amenities/utils';

const HOTEL_STATUS = {
  cho_duyet: { label: 'Chờ duyệt', cls: 'admin-hotel-detail-status--pending' },
  hoat_dong: { label: 'Hoạt động', cls: 'admin-hotel-detail-status--active' },
  tu_choi: { label: 'Từ chối', cls: 'admin-hotel-detail-status--inactive' },
  bi_khoa: { label: 'Bị khóa', cls: 'admin-hotel-detail-status--inactive' },
  yeu_cau_sua: { label: 'Yêu cầu sửa', cls: 'admin-hotel-detail-status--pending' },
  da_duyet: { label: 'Đã duyệt', cls: 'admin-hotel-detail-status--active' },
};

const PARTNER_STATUS = {
  hoat_dong: 'Đang hợp tác',
  bi_khoa: 'Ngưng hợp tác',
};

const formatDate = (d) => (d ? new Date(d).toLocaleDateString('vi-VN') : '—');

const GridItem = ({ label, value, fullWidth }) => (
  <div className={`admin-hotel-detail-grid-item${fullWidth ? ' admin-hotel-detail-grid-item--full' : ''}`}>
    <span className="admin-hotel-detail-grid-label">{label}:</span>{' '}
    <span className="admin-hotel-detail-grid-value">{value ?? '—'}</span>
  </div>
);

const PartnerLine = ({ label, value }) => (
  <p className="admin-hotel-detail-partner-line">
    <span>{label}:</span>{' '}
    <strong>{value ?? '—'}</strong>
  </p>
);

const HotelDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const [hotel, setHotel] = useState(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [activeImg, setActiveImg] = useState(0);

  const loadHotel = useCallback(async () => {
    if (!id) return;
    try {
      setLoading(true);
      const res = await adminHotelService.getById(id);
      setHotel(res.data.data || res.data);
      setActiveImg(0);
    } catch {
      setHotel(null);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => { loadHotel(); }, [loadHotel]);

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

  const handleAction = async (actionType) => {
    let actionPromise;
    if (actionType === 'approve' && window.confirm('Duyệt khách sạn này hoạt động trên sàn?')) {
      actionPromise = dispatch(approveHotel(id));
    } else if (actionType === 'reject') {
      const reason = window.prompt('Nhập lý do từ chối:');
      if (reason?.trim()) actionPromise = dispatch(rejectHotel({ id, lyDo: reason.trim() }));
    } else if (actionType === 'lock' && window.confirm('Khóa khách sạn này?')) {
      actionPromise = dispatch(lockHotel(id));
    } else if (actionType === 'unlock' && window.confirm('Mở khóa khách sạn này?')) {
      actionPromise = dispatch(unlockHotel(id));
    }

    if (!actionPromise) return;

    setActionLoading(true);
    try {
      const result = await actionPromise;
      if (result.meta?.requestStatus === 'rejected') {
        alert(result.payload || 'Thao tác thất bại');
        return;
      }
      await loadHotel();
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return <div style={{ textAlign: 'center', padding: 80, color: '#5a7a72' }}>Đang tải...</div>;
  }

  if (!hotel) {
    return (
      <div className="content-card" style={{ textAlign: 'center', padding: 48 }}>
        <p style={{ color: '#e05c5c', marginBottom: 16 }}>Không tìm thấy khách sạn</p>
        <BackButton variant="outline" onClick={() => navigate('/admin/hotels')} />
      </div>
    );
  }

  const st = HOTEL_STATUS[hotel.trang_thai] || { label: hotel.trang_thai, cls: 'admin-hotel-detail-status--inactive' };
  const partnerLocked = Boolean(hotel.khoa_do_doi_tac);
  const partner = hotel.doi_tac;
  const partnerUser = partner?.nguoi_dung_doi_tac_ma_nguoi_dungTonguoi_dung;
  const images = hotel.hinh_anh?.length ? hotel.hinh_anh : [];
  const currentImg = images[activeImg] || images[0];
  const roomCount = hotel.loai_phong?.length ?? hotel._count?.loai_phong ?? 0;

  const prevImg = () => {
    if (!images.length) return;
    setActiveImg((i) => (i - 1 + images.length) % images.length);
  };

  const nextImg = () => {
    if (!images.length) return;
    setActiveImg((i) => (i + 1) % images.length);
  };

  return (
    <div className="mgmt-page admin-hotel-detail-page">
      <BackButton to="/admin/hotels" className="page-back-btn--standalone" />
      <h1 className="admin-hotel-detail-page-title">Chi tiết khách sạn</h1>

      <div className="admin-hotel-detail-card">
        <div className="admin-hotel-detail-left">
          <section className="admin-hotel-detail-section">
            <div className="admin-hotel-detail-section-top">
              <div className="admin-hotel-detail-section-title-row">
                <h2 className="admin-hotel-detail-section-title">
                  Thông tin khách sạn: <span>{hotel.ten}</span>
                </h2>
                <span className={`admin-hotel-detail-status ${st.cls}`}>{st.label}</span>
              </div>
              <TableActions className="admin-hotel-detail-actions">
                {hotel.trang_thai === 'cho_duyet' && (
                  <>
                    <ActionButton variant="approve" disabled={actionLoading} onClick={() => handleAction('approve')}>
                      {actionLoading ? '...' : 'Duyệt'}
                    </ActionButton>
                    <ActionButton variant="reject" disabled={actionLoading} onClick={() => handleAction('reject')}>
                      Từ chối
                    </ActionButton>
                  </>
                )}
                {hotel.trang_thai === 'hoat_dong' && (
                  <ActionButton variant="lock" disabled={actionLoading} onClick={() => handleAction('lock')}>
                    Khóa
                  </ActionButton>
                )}
                {hotel.trang_thai === 'bi_khoa' && (
                  <ActionButton
                    variant="unlock"
                    disabled={actionLoading || partnerLocked}
                    title={partnerLocked ? 'Bị khóa do đối tác' : undefined}
                    onClick={() => handleAction('unlock')}
                  >
                    Mở khóa
                  </ActionButton>
                )}
              </TableActions>
            </div>

            {hotel.ly_do_tu_choi && (hotel.trang_thai === 'tu_choi' || hotel.trang_thai === 'yeu_cau_sua') && (
              <div className="admin-hotel-detail-notice">
                {hotel.trang_thai === 'tu_choi' ? 'Lý do từ chối' : 'Yêu cầu bổ sung'}: {hotel.ly_do_tu_choi}
              </div>
            )}

            <div className="admin-hotel-detail-grid">
              <GridItem label="Mã Khách sạn" value={hotel.ma_khach_san} />
              <GridItem label="Địa điểm" value={hotel.dia_diem?.ten_dia_diem} />
              <GridItem label="Đối tác" value={partner?.ten_cong_ty} />
              <GridItem label="Địa chỉ" value={hotel.dia_chi} />
              <GridItem label="Hạng sao" value={hotel.so_sao || '—'} />
              <GridItem label="Số loại phòng" value={roomCount} />
              <GridItem label="Mô tả" value={hotel.mo_ta || '—'} fullWidth />
              <GridItem label="Ngày đăng ký" value={formatDate(hotel.ngay_tao)} />
              <GridItem label="Ngày duyệt" value={formatDate(hotel.ngay_duyet)} />
            </div>
          </section>

          <section className="admin-hotel-detail-section admin-hotel-detail-section--partner">
            <h3 className="admin-hotel-detail-partner-title">Thông tin đối tác</h3>
            <PartnerLine label="Tên công ty" value={partner?.ten_cong_ty} />
            <PartnerLine label="Mã đối tác" value={partner?.ma_doi_tac} />
            <PartnerLine label="Email" value={partner?.email_lien_he || partnerUser?.email} />
            <PartnerLine label="Số điện thoại" value={partner?.so_dien_thoai || partnerUser?.so_dien_thoai} />
            <PartnerLine label="Địa chỉ công ty" value={partner?.dia_chi} />
            <PartnerLine
              label="Trạng thái hợp tác"
              value={PARTNER_STATUS[partner?.trang_thai] || partner?.trang_thai}
            />
          </section>
        </div>

        <div className="admin-hotel-detail-right">
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

          <div className="admin-hotel-detail-amenities">
            <div className="partner-room-detail-block-title">
              <Sparkles size={15} strokeWidth={1.75} />
              Tiện nghi
            </div>
            {amenityGroups.length === 0 ? (
              <p className="admin-hotel-detail-amenities-empty">Chưa có tiện nghi</p>
            ) : (
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
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default HotelDetailPage;
