import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate, useParams } from 'react-router-dom';
import { Pencil } from 'lucide-react';
import { resolveUploadUrl } from '../../../utils/media';
import ActionButton from '../../../components/common/ActionButton';
import ManagementHeader from '../../../components/common/management/ManagementHeader';
import ToggleSwitch from '../../../components/common/management/ToggleSwitch';
import { fetchMyHotels, updateHotel } from '../../../store/slices/partnerHotelSlice';
import { TRANG_THAI } from './constants';
import InfoRow from './components/InfoRow';

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
    <div>
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

      <div className="content-card">
        {mainImg && (
          <div style={{ borderRadius: 10, overflow: 'hidden', marginBottom: 16, aspectRatio: '16/7' }}>
            <img src={resolveUploadUrl(mainImg.url)} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          </div>
        )}

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, flexWrap: 'wrap', gap: 12 }}>
          <span className={`badge ${st.cls}`}>{st.label}</span>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
           
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

        <div className="detail-page-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
          <div>
            <InfoRow label="Tên khách sạn" value={hotel.ten} />
            <InfoRow label="Địa điểm" value={hotel.dia_diem?.ten_dia_diem} />
            <InfoRow label="Xếp hạng" value={hotel.so_sao ? `${hotel.so_sao} Sao` : '—'} />
          </div>
          <div>
            <InfoRow label="Giờ nhận phòng" value={hotel.gio_nhan_phong ? new Date(hotel.gio_nhan_phong).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '—'} />
            <InfoRow label="Giờ trả phòng" value={hotel.gio_tra_phong ? new Date(hotel.gio_tra_phong).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '—'} />
            <InfoRow label="Trạng thái" value={st.label} />
          </div>
        </div>

        <InfoRow label="Địa chỉ cụ thể" value={hotel.dia_chi} />

        {hotel.mo_ta && (
          <div style={{ marginTop: 12, padding: '10px 12px', background: '#f8fdfb', borderRadius: 8, fontSize: 14, color: '#5a7a72' }}>
            {hotel.mo_ta}
          </div>
        )}

        {hotel.khach_san_tien_nghi?.length > 0 && (
          <div style={{ marginTop: 14 }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: '#3C7363', marginBottom: 8 }}>Tiện nghi chung</div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
              {hotel.khach_san_tien_nghi.map((tn) => (
                <span key={tn.ma_tien_nghi} style={{ padding: '4px 12px', borderRadius: 20, background: '#e8f5f1', color: '#3C7363', fontSize: 13 }}>
                  {tn.tien_nghi?.ten}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>

      <style>{`@media (max-width: 900px) { .detail-page-grid { grid-template-columns: 1fr !important; } }`}</style>
    </div>
  );
}
