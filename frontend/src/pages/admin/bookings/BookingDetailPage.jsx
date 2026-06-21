import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate, useParams } from 'react-router-dom';
import {
  fetchAdminBookingDetail,
  cancelAdminBooking,
  fetchBookingStats,
  fetchAdminBookings,
  clearDetail,
  clearMsg,
} from '../../../store/slices/adminBookingSlice';
import {
  TRANG_THAI,
  PHUONG_THUC,
  formatCurrency,
  formatDate,
  formatDateTime,
  diffDays,
} from '../../../utils/bookingDisplay';
import ManagementHeader from '../../../components/common/management/ManagementHeader';

const InfoRow = ({ label, value }) => (
  <div style={{ padding: '10px 0', borderBottom: '1px solid #f0f4f3' }}>
    <div style={{ fontSize: 12, color: '#5a7a72', marginBottom: 4 }}>{label}</div>
    <div style={{ fontSize: 14, fontWeight: 500, color: '#1a2e28', lineHeight: 1.5 }}>{value ?? '—'}</div>
  </div>
);

export default function BookingDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { detail, detailLoading, loading, error, successMsg } = useSelector(
    (s) => s.adminBooking || {},
  );

  const [cancelMode, setCancelMode] = useState(false);
  const [lyDo, setLyDo] = useState('');

  useEffect(() => {
    if (id) dispatch(fetchAdminBookingDetail(id));
    return () => { dispatch(clearDetail()); };
  }, [dispatch, id]);

  useEffect(() => {
    if (successMsg || error) {
      const t = setTimeout(() => dispatch(clearMsg()), 4000);
      return () => clearTimeout(t);
    }
  }, [successMsg, error, dispatch]);

  const handleCancel = async () => {
    if (!detail || !lyDo.trim()) return alert('Nhập lý do hủy');
    await dispatch(cancelAdminBooking({ id: detail.ma_dat_phong, ly_do: lyDo }));
    dispatch(fetchBookingStats());
    dispatch(fetchAdminBookings());
    navigate('/admin/bookings');
  };

  if (detailLoading) {
    return (
      <div style={{ textAlign: 'center', padding: 80, color: '#5a7a72' }}>
        Đang tải...
      </div>
    );
  }

  if (!detail) {
    return (
      <div className="content-card" style={{ textAlign: 'center', padding: 48 }}>
        <p style={{ color: '#e05c5c', marginBottom: 16 }}>Không tìm thấy đơn đặt phòng</p>
        <button type="button" className="btn btn-outline" onClick={() => navigate('/admin/bookings')}>
          ← Quay lại
        </button>
      </div>
    );
  }

  const st = TRANG_THAI[detail.trang_thai] || { label: detail.trang_thai, cls: 'badge-default' };
  const nights = diffDays(detail.ngay_nhan_phong, detail.ngay_tra_phong);
  const canCancel = !['hoan_thanh', 'da_huy', 'tu_choi'].includes(detail.trang_thai);

  return (
    <div>
      <ManagementHeader
        title="Quản lý Đặt phòng"
        subtitle={`Chi tiết đơn #${detail.ma_don_hang}`}
      />

      <button
        type="button"
        className="btn btn-ghost btn-sm"
        style={{ marginBottom: 12 }}
        onClick={() => navigate('/admin/bookings')}
      >
        ← Quay lại
      </button>

      <div style={{ display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap', alignItems: 'center' }}>
        <span className="mgmt-type-tag" style={{ padding: '8px 14px', fontSize: 13, background: '#f1f5f9' }}>
          Chi tiết đơn #{detail.ma_don_hang}
        </span>
        <span className={`badge ${st.cls}`}>{st.label}</span>
        <span style={{ fontSize: 13, color: '#5a7a72' }}>
          Đặt lúc {formatDateTime(detail.ngay_dat)}
        </span>
      </div>

      {(successMsg || error) && (
        <div className={`mgmt-toast ${successMsg ? 'success' : 'error'}`} style={{ marginBottom: 16 }}>
          {successMsg || error}
        </div>
      )}

      {canCancel && !cancelMode && (
        <div style={{ marginBottom: 16 }}>
          <button type="button" className="btn btn-danger btn-sm" onClick={() => setCancelMode(true)}>
            Hủy đơn (Admin)
          </button>
        </div>
      )}

      {cancelMode && (
        <div className="content-card" style={{ marginBottom: 16, background: '#fffafa', borderColor: '#fecaca' }}>
          <p style={{ fontSize: 13, fontWeight: 600, color: '#e05c5c', margin: '0 0 12px' }}>
            Hủy đơn sẽ thông báo cho khách hàng. Vui lòng nhập lý do rõ ràng.
          </p>
          <div style={{ marginBottom: 12 }}>
            <div style={{ fontSize: 12, color: '#5a7a72', marginBottom: 6 }}>
              Lý do hủy <span style={{ color: '#e05c5c' }}>*</span>
            </div>
            <textarea
              rows={3}
              placeholder="VD: Khách sạn không đủ điều kiện phục vụ..."
              value={lyDo}
              onChange={(e) => setLyDo(e.target.value)}
              className="search-input"
              style={{ width: '100%', boxSizing: 'border-box', resize: 'vertical' }}
            />
          </div>
          <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
            <button type="button" className="btn btn-ghost btn-sm" onClick={() => { setCancelMode(false); setLyDo(''); }}>
              Hủy bỏ
            </button>
            <button type="button" className="btn btn-danger btn-sm" disabled={loading} onClick={handleCancel}>
              {loading ? 'Đang xử lý...' : 'Xác nhận hủy đơn'}
            </button>
          </div>
        </div>
      )}

      <div className="detail-page-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
        <div className="content-card">
          <h3 className="content-card-title" style={{ marginBottom: 12 }}>Thông tin phòng</h3>
          <InfoRow label="Khách sạn" value={detail.loai_phong?.khach_san?.ten} />
          <InfoRow label="Đối tác" value={detail.loai_phong?.khach_san?.doi_tac?.ten_cong_ty} />
          <InfoRow label="Loại phòng" value={detail.loai_phong?.ten_loai} />
          <InfoRow label="Địa chỉ" value={detail.loai_phong?.khach_san?.dia_chi} />
          <InfoRow label="Nhận phòng" value={formatDate(detail.ngay_nhan_phong)} />
          <InfoRow label="Trả phòng" value={formatDate(detail.ngay_tra_phong)} />
          <InfoRow label="Số đêm" value={`${nights} đêm`} />
          <InfoRow label="Số khách" value={`${detail.so_khach} khách`} />
        </div>

        <div className="content-card">
          <h3 className="content-card-title" style={{ marginBottom: 12 }}>Thông tin khách</h3>
          <InfoRow label="Khách hàng" value={detail.khach_hang?.ho_ten} />
          <InfoRow label="Email" value={detail.khach_hang?.nguoi_dung?.email} />
          <InfoRow label="SĐT" value={detail.khach_hang?.nguoi_dung?.so_dien_thoai} />
          <InfoRow label="Người nhận phòng" value={detail.ten_nguoi_nhan} />
          <InfoRow label="SĐT người nhận" value={detail.sdt_nguoi_nhan} />
          <InfoRow label="Tổng lượt đặt" value={`${detail.khach_hang?.tong_lan_dat || 0} lần`} />
          <InfoRow label="Tổng chi tiêu" value={formatCurrency(detail.khach_hang?.tong_tien_da_chi)} />
          {detail.ghi_chu && <InfoRow label="Ghi chú" value={detail.ghi_chu} />}
        </div>
      </div>

      <div className="content-card" style={{ marginBottom: 16 }}>
        <h3 className="content-card-title" style={{ marginBottom: 12 }}>Thanh toán</h3>
        <InfoRow label="Tổng tiền gốc" value={formatCurrency(detail.tong_tien_goc)} />
        {Number(detail.tien_giam) > 0 && (
          <InfoRow
            label={`Giảm giá${detail.khuyen_mai ? ` (${detail.khuyen_mai.ma_code})` : ''}`}
            value={`- ${formatCurrency(detail.tien_giam)}`}
          />
        )}
        <InfoRow label="Thành tiền" value={formatCurrency(detail.thanh_toan_cuoi)} />
        <InfoRow label="Phương thức" value={PHUONG_THUC[detail.phuong_thuc_tt] || detail.phuong_thuc_tt} />
        {detail.thanh_toan && (
          <InfoRow
            label="Trạng thái thanh toán"
            value={detail.thanh_toan.trang_thai === 'thanh_cong' ? 'Đã thanh toán' : 'Chờ thanh toán'}
          />
        )}
      </div>

      {detail.chi_tiet_dat_phong?.length > 0 && (
        <div className="content-card" style={{ marginBottom: 16 }}>
          <h3 className="content-card-title" style={{ marginBottom: 12 }}>Chi tiết giá từng đêm</h3>
          <div style={{ overflowX: 'auto' }}>
            <table className="data-table" style={{ minWidth: 360 }}>
              <thead>
                <tr>
                  <th>Ngày</th>
                  <th>Giá/đêm</th>
                  <th>Loại giá</th>
                </tr>
              </thead>
              <tbody>
                {detail.chi_tiet_dat_phong.map((ct) => (
                  <tr key={ct.ma_chi_tiet}>
                    <td>{formatDate(ct.ngay)}</td>
                    <td style={{ fontWeight: 500 }}>{formatCurrency(ct.don_gia)}</td>
                    <td>
                      <span className={`badge ${
                        ct.loai_gia === 'co_ban' ? 'badge-default'
                          : ct.loai_gia === 'cuoi_tuan' ? 'badge-warning'
                            : ct.loai_gia === 'le_tet' ? 'badge-danger' : 'badge-info'
                      }`} style={{ fontSize: 11 }}>
                        {ct.loai_gia === 'co_ban' ? 'Cơ bản'
                          : ct.loai_gia === 'cuoi_tuan' ? 'Cuối tuần'
                            : ct.loai_gia === 'le_tet' ? 'Lễ tết' : 'Cao điểm'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {detail.thong_bao?.length > 0 && (
        <div className="content-card">
          <h3 className="content-card-title" style={{ marginBottom: 12 }}>Lịch sử thay đổi</h3>
          {detail.thong_bao.map((tb, i) => (
            <div
              key={tb.ma_thong_bao}
              style={{
                display: 'flex',
                gap: 12,
                padding: '10px 0',
                borderBottom: i < detail.thong_bao.length - 1 ? '1px solid #f0f4f3' : 'none',
              }}
            >
              <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#3C7363', flexShrink: 0, marginTop: 5 }} />
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 13, fontWeight: 500, color: '#1a2e28' }}>{tb.tieu_de}</div>
                <div style={{ fontSize: 12, color: '#5a7a72', marginTop: 2 }}>{tb.noi_dung}</div>
              </div>
              <div style={{ fontSize: 11, color: '#5a7a72', flexShrink: 0 }}>{formatDateTime(tb.ngay_gui)}</div>
            </div>
          ))}
        </div>
      )}

      <style>{`
        @media (max-width: 900px) {
          .detail-page-grid { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </div>
  );
}
