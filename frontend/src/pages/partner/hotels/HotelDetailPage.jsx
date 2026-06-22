import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate, useParams } from 'react-router-dom';
import { resolveUploadUrl } from '../../../utils/media';
import ManagementHeader from '../../../components/common/management/ManagementHeader';
import ToggleSwitch from '../../../components/common/management/ToggleSwitch';
import { fetchMyHotels, updateHotel } from '../../../store/slices/partnerHotelSlice';
import { TRANG_THAI } from './constants';
import DetailTable from '../../../components/booking/DetailTable';

const formatTime = (d) => {
  if (!d) return '—';
  return new Date(d).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
};

export default function HotelDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { list = [], loading } = useSelector((s) => s.partnerHotel || {});

  const hotel = list.find((h) => String(h.ma_khach_san) === String(id));

  useEffect(() => {
    if (list.length === 0) dispatch(fetchMyHotels());
  }, [dispatch, list.length]);

  const handleToggleStatus = () => {
    if (!hotel) return;
    const isActivating = hotel.trang_thai === 'bi_khoa';
    const confirmMsg = isActivating
      ? `Bạn muốn MỞ LẠI hoạt động cho khách sạn "${hotel.ten}"?`
      : `Bạn có chắc chắn muốn TẠM NGƯNG khách sạn "${hotel.ten}"? Khách hàng sẽ không thể đặt phòng mới.`;

    if (window.confirm(confirmMsg)) {
      const newStatus = isActivating ? 'hoat_dong' : 'bi_khoa';
      dispatch(updateHotel({ id: hotel.ma_khach_san, data: { trang_thai: newStatus } }));
    }
  };

  if (loading && !hotel) {
    return <div style={{ textAlign: 'center', padding: 80, color: '#5a7a72' }}>Đang tải...</div>;
  }

  if (!hotel) {
    return (
      <div className="content-card" style={{ textAlign: 'center', padding: 48 }}>
        <p style={{ color: '#e05c5c', marginBottom: 16 }}>Không tìm thấy khách sạn</p>
        <button type="button" className="btn btn-outline" onClick={() => navigate('/partner/hotels')}>
          ← Quay lại
        </button>
      </div>
    );
  }

  const st = TRANG_THAI[hotel.trang_thai] || { label: hotel.trang_thai, cls: 'badge-default' };
  const mainImg = hotel.hinh_anh?.find((i) => i.la_anh_chinh === 1) || hotel.hinh_anh?.[0];

  return (
    <div className="mgmt-page">
      <ManagementHeader
        title="Quản Lý Hồ Sơ Khách sạn"
        subtitle={hotel.ten}
      />

      <button
        type="button"
        className="btn btn-ghost btn-sm"
        style={{ marginBottom: 12 }}
        onClick={() => navigate('/partner/hotels')}
      >
        ← Quay lại
      </button>

      <div className="content-card partner-hotel-detail-card">
        <div className="partner-hotel-detail-top">
          {mainImg && (
            <div className="partner-hotel-detail-thumb">
              <img src={resolveUploadUrl(mainImg.url)} alt="" />
            </div>
          )}

          <div className="partner-hotel-detail-top-meta">
            <span className={`badge ${st.cls}`}>{st.label}</span>
            {['hoat_dong', 'bi_khoa'].includes(hotel.trang_thai) && (
              <ToggleSwitch
                checked={hotel.trang_thai === 'hoat_dong'}
                onChange={handleToggleStatus}
                labelOn="Đang hoạt động"
                labelOff="Tạm ngừng"
              />
            )}
          </div>
        </div>

        <div className="hotel-detail-info-grid">
          <DetailTable
            rows={[
              { label: 'Tên khách sạn', value: hotel.ten },
              { label: 'Địa điểm', value: hotel.dia_diem?.ten_dia_diem },
              { label: 'Xếp hạng', value: hotel.so_sao ? `${hotel.so_sao} Sao` : '—' },
              { label: 'Địa chỉ cụ thể', value: hotel.dia_chi },
            ]}
          />
          <DetailTable
            rows={[
              { label: 'Giờ nhận phòng', value: formatTime(hotel.gio_nhan_phong) },
              { label: 'Giờ trả phòng', value: formatTime(hotel.gio_tra_phong) },
              { label: 'Trạng thái', value: st.label },
            ]}
          />
        </div>

        {hotel.mo_ta && (
          <div className="partner-hotel-detail-desc">
            {hotel.mo_ta}
          </div>
        )}

        {hotel.khach_san_tien_nghi?.length > 0 && (
          <div className="partner-hotel-detail-amenities">
            <div className="booking-detail-section-title">Tiện nghi chung</div>
            <div className="partner-hotel-amenity-tags">
              {hotel.khach_san_tien_nghi.map((tn) => (
                <span key={tn.ma_tien_nghi} className="mgmt-type-tag">
                  {tn.tien_nghi?.ten}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
