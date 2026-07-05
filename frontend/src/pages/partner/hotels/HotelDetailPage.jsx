import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate, useParams } from 'react-router-dom';
import { resolveUploadUrl } from '../../../utils/media';
import ManagementHeader from '../../../components/common/management/ManagementHeader';
import BackButton from '../../../components/common/BackButton';
import ToggleSwitch from '../../../components/common/management/ToggleSwitch';
import { fetchMyHotels, updateHotel } from '../../../store/slices/partnerHotelSlice';
import { TRANG_THAI } from './constants';
import DetailTable from '../../../components/booking/DetailTable';
import { HotelAmenityDisplay } from './components/HotelAmenityGroups';
import {
  REQUIRED_DOC_LABELS,
  parseGiayToBatBuoc,
  formatMoneyVnd,
  formatYesNo,
} from './hotelPolicyUtils';

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
        <BackButton variant="outline" onClick={() => navigate('/partner/hotels')} />
      </div>
    );
  }

  const st = TRANG_THAI[hotel.trang_thai] || { label: hotel.trang_thai, cls: 'badge-default' };
  const adminLocked = hotel.trang_thai === 'bi_khoa' && !hotel.khoa_do_doi_tac;
  const mainImg = hotel.hinh_anh?.find((i) => i.la_anh_chinh === 1) || hotel.hinh_anh?.[0];
  const requiredDocs = parseGiayToBatBuoc(hotel.giay_to_bat_buoc)
    .map((docId) => REQUIRED_DOC_LABELS[docId] || docId);
  const cancelPolicies = (hotel.chinh_sach_huy || [])
    .filter((p) => p.trang_thai === 'hoat_dong' || !p.trang_thai)
    .sort((a, b) => b.so_ngay_truoc - a.so_ngay_truoc);

  return (
    <div className="mgmt-page">
      <ManagementHeader
        title="Quản Lý Hồ Sơ Khách sạn"
        subtitle={hotel.ten}
        onBack={() => navigate('/partner/hotels')}
      />

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
                disabled={adminLocked}
                onChange={handleToggleStatus}
                labelOn="Đang hoạt động"
                labelOff={adminLocked ? 'Admin khóa' : 'Tạm ngừng'}
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
            <div className="booking-detail-section-title">Tiện nghi khách sạn</div>
            <HotelAmenityDisplay items={hotel.khach_san_tien_nghi} />
          </div>
        )}

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

          <div className="partner-hotel-detail-subsection">
            <div className="partner-hotel-detail-subtitle">Trường hợp hoàn tiền đặc biệt</div>
            <DetailTable
              rows={[
                { label: 'Bị bệnh', value: formatYesNo(hotel.hoan_khi_benh) },
                { label: 'Công việc đột xuất', value: formatYesNo(hotel.hoan_cong_viec_dot_xuat) },
                { label: 'Yêu cầu minh chứng', value: formatYesNo(hotel.yeu_cau_minh_chung_huy) },
                { label: 'Ghi chú', value: hotel.mo_ta_chinh_sach_huy || '—' },
              ]}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
