import { useState } from 'react';
import {
  TRANG_THAI,
  PHUONG_THUC,
  formatCurrency,
  formatDate,
  formatDateTime,
  diffDays,
} from '../../../../utils/bookingDisplay';

const InfoRow = ({ label, value }) => (
  <div style={{
    display: 'flex', padding: '9px 0',
    borderBottom: '0.5px solid #f0f0f0',
    fontSize: 14, gap: 12,
  }}>
    <span style={{ width: 180, color: '#5a7a72', flexShrink: 0, fontSize: 13 }}>{label}</span>
    <span style={{ color: '#1a2e28', fontWeight: 500, flex: 1 }}>{value || '—'}</span>
  </div>
);

export default function BookingDetailModal({ booking, onClose, onCancel, loading }) {
  const [cancelMode, setCancelMode] = useState(false);
  const [lyDo, setLyDo] = useState('');

  if (!booking) return null;

  const st = TRANG_THAI[booking.trang_thai] || { label: booking.trang_thai, cls: 'badge-default' };
  const nights = diffDays(booking.ngay_nhan_phong, booking.ngay_tra_phong);
  const canCancel = !['hoan_thanh', 'da_huy', 'tu_choi', 'da_checkin'].includes(booking.trang_thai);

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="modal-box"
        style={{ maxWidth: 720, maxHeight: '92vh', overflowY: 'auto' }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="modal-header">
          <div>
            <h3 className="modal-title"> Chi tiết đơn đặt phòng</h3>
            <p style={{ fontSize: 13, color: '#5a7a72', margin: '2px 0 0' }}>
              #{booking.ma_don_hang}
            </p>
          </div>
          <button className="modal-close" onClick={onClose}>×</button>
        </div>

        <div style={{
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          padding: '10px 14px', background: '#f8fdfb',
          borderRadius: 8, border: '1px solid #d4ede6', marginBottom: 16,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <span className={`badge ${st.cls}`}>{st.label}</span>
            <span style={{ fontSize: 13, color: '#5a7a72' }}>
              Đặt lúc {formatDateTime(booking.ngay_dat)}
            </span>
          </div>
          {canCancel && !cancelMode && (
            <button
              className="btn btn-danger btn-sm"
              onClick={() => setCancelMode(true)}
            >
               Hủy đơn (Admin)
            </button>
          )}
        </div>

        {cancelMode && (
          <div style={{
            marginBottom: 16, padding: 14,
            background: '#fff0f0', borderRadius: 8,
            border: '1px solid #ffb3b3',
          }}>
            <p style={{ fontSize: 13, fontWeight: 600, color: '#e05c5c', marginBottom: 8 }}>
               Hủy đơn sẽ thông báo cho khách hàng. Vui lòng nhập lý do rõ ràng.
            </p>
            <label style={{ fontSize: 13, fontWeight: 500, display: 'block', marginBottom: 6 }}>
              Lý do hủy <span style={{ color: '#e05c5c' }}>*</span>
            </label>
            <textarea
              rows={3}
              placeholder="VD: Khách sạn không đủ điều kiện phục vụ, vi phạm quy định..."
              value={lyDo}
              onChange={(e) => setLyDo(e.target.value)}
              style={{
                width: '100%', padding: '9px 12px',
                border: '1px solid #ffb3b3', borderRadius: 8,
                fontSize: 14, resize: 'vertical',
                fontFamily: 'inherit', boxSizing: 'border-box',
              }}
            />
            <div style={{ display: 'flex', gap: 8, marginTop: 10, justifyContent: 'flex-end' }}>
              <button className="btn btn-ghost btn-sm" onClick={() => { setCancelMode(false); setLyDo(''); }}>
                Hủy bỏ
              </button>
              <button
                className="btn btn-danger btn-sm"
                disabled={loading}
                onClick={() => {
                  if (!lyDo.trim()) return alert('Nhập lý do hủy');
                  onCancel(lyDo);
                }}
              >
                {loading ? 'Đang xử lý...' : 'Xác nhận hủy đơn'}
              </button>
            </div>
          </div>
        )}

        <div className="form-grid" style={{ marginBottom: 16 }}>
          <div>
            <h4 style={{ fontSize: 13, fontWeight: 600, color: '#3C7363', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '.05em' }}>
               Thông tin phòng
            </h4>
            <InfoRow label="Khách sạn" value={booking.loai_phong?.khach_san?.ten} />
            <InfoRow label="Đối tác" value={booking.loai_phong?.khach_san?.doi_tac?.ten_cong_ty} />
            <InfoRow label="Loại phòng" value={booking.loai_phong?.ten_loai} />
            <InfoRow label="Địa chỉ" value={booking.loai_phong?.khach_san?.dia_chi} />
            <InfoRow label="Nhận phòng" value={formatDate(booking.ngay_nhan_phong)} />
            <InfoRow label="Trả phòng" value={formatDate(booking.ngay_tra_phong)} />
            <InfoRow label="Số đêm" value={`${nights} đêm`} />
            <InfoRow label="Số khách" value={`${booking.so_khach} khách`} />
          </div>

          <div>
            <h4 style={{ fontSize: 13, fontWeight: 600, color: '#3C7363', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '.05em' }}>
               Thông tin khách
            </h4>
            <InfoRow label="Khách hàng" value={booking.khach_hang?.ho_ten} />
            <InfoRow label="Email" value={booking.khach_hang?.nguoi_dung?.email} />
            <InfoRow label="SĐT" value={booking.khach_hang?.nguoi_dung?.so_dien_thoai} />
            <InfoRow label="Người nhận phòng" value={booking.ten_nguoi_nhan} />
            <InfoRow label="SĐT người nhận" value={booking.sdt_nguoi_nhan} />
            <InfoRow label="Tổng lượt đặt" value={`${booking.khach_hang?.tong_lan_dat || 0} lần`} />
            <InfoRow label="Tổng chi tiêu" value={formatCurrency(booking.khach_hang?.tong_tien_da_chi)} />
            {booking.ghi_chu && (
              <InfoRow label="Ghi chú" value={booking.ghi_chu} />
            )}
          </div>
        </div>

        <div style={{ marginBottom: 16 }}>
          <h4 style={{ fontSize: 13, fontWeight: 600, color: '#3C7363', marginBottom: 10, textTransform: 'uppercase', letterSpacing: '.05em' }}>
             Thanh toán
          </h4>
          <div style={{
            background: '#f8fdfb', borderRadius: 10,
            border: '1px solid #d4ede6', padding: '14px 16px',
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6, fontSize: 14 }}>
              <span style={{ color: '#5a7a72' }}>Tổng tiền gốc</span>
              <span>{formatCurrency(booking.tong_tien_goc)}</span>
            </div>
            {Number(booking.tien_giam) > 0 && (
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6, fontSize: 14 }}>
                <span style={{ color: '#5a7a72' }}>
                  Giảm giá {booking.khuyen_mai ? `(${booking.khuyen_mai.ma_code})` : ''}
                </span>
                <span style={{ color: '#e05c5c' }}>- {formatCurrency(booking.tien_giam)}</span>
              </div>
            )}
            <div style={{
              display: 'flex', justifyContent: 'space-between',
              paddingTop: 10, borderTop: '0.5px solid #d4ede6',
              fontWeight: 700, fontSize: 17,
            }}>
              <span>Thành tiền</span>
              <span style={{ color: '#3C7363' }}>{formatCurrency(booking.thanh_toan_cuoi)}</span>
            </div>
            <div style={{ marginTop: 10, display: 'flex', gap: 16, fontSize: 13, color: '#5a7a72' }}>
              <span>Phương thức: {PHUONG_THUC[booking.phuong_thuc_tt] || booking.phuong_thuc_tt}</span>
              {booking.thanh_toan && (
                <span>
                  Thanh toán:{' '}
                  <span className={`badge ${booking.thanh_toan.trang_thai === 'thanh_cong' ? 'badge-success' : 'badge-warning'}`} style={{ fontSize: 11 }}>
                    {booking.thanh_toan.trang_thai === 'thanh_cong' ? 'Đã thanh toán' : 'Chờ thanh toán'}
                  </span>
                </span>
              )}
            </div>
          </div>
        </div>

        {booking.chi_tiet_dat_phong?.length > 0 && (
          <div style={{ marginBottom: 16 }}>
            <h4 style={{ fontSize: 13, fontWeight: 600, color: '#3C7363', marginBottom: 10, textTransform: 'uppercase', letterSpacing: '.05em' }}>
               Chi tiết giá từng đêm
            </h4>
            <div style={{ maxHeight: 200, overflowY: 'auto' }}>
              <table className="data-table" style={{ minWidth: 'auto' }}>
                <thead>
                  <tr>
                    <th>Ngày</th>
                    <th>Giá/đêm</th>
                    <th>Loại giá</th>
                  </tr>
                </thead>
                <tbody>
                  {booking.chi_tiet_dat_phong.map((ct) => (
                    <tr key={ct.ma_chi_tiet}>
                      <td>{formatDate(ct.ngay)}</td>
                      <td style={{ fontWeight: 500 }}>{formatCurrency(ct.don_gia)}</td>
                      <td>
                        <span className={`badge ${
                          ct.loai_gia === 'co_ban' ? 'badge-default' :
                          ct.loai_gia === 'cuoi_tuan' ? 'badge-warning' :
                          ct.loai_gia === 'le_tet' ? 'badge-danger' : 'badge-info'}`} style={{ fontSize: 11 }}>
                          {ct.loai_gia === 'co_ban' ? 'Cơ bản' :
                           ct.loai_gia === 'cuoi_tuan' ? 'Cuối tuần' :
                           ct.loai_gia === 'le_tet' ? 'Lễ tết' : 'Cao điểm'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {booking.thong_bao?.length > 0 && (
          <div>
            <h4 style={{ fontSize: 13, fontWeight: 600, color: '#3C7363', marginBottom: 10, textTransform: 'uppercase', letterSpacing: '.05em' }}>
               Lịch sử thay đổi
            </h4>
            <div style={{
              border: '0.5px solid #d4ede6', borderRadius: 8, overflow: 'hidden',
            }}>
              {booking.thong_bao.map((tb, i) => (
                <div
                  key={tb.ma_thong_bao}
                  style={{
                    display: 'flex', gap: 12, padding: '10px 14px',
                    borderBottom: i < booking.thong_bao.length - 1 ? '0.5px solid #f0f0f0' : 'none',
                    background: i % 2 === 0 ? '#fff' : '#f8fdfb',
                  }}
                >
                  <div style={{
                    width: 8, height: 8, borderRadius: '50%',
                    background: '#3C7363', flexShrink: 0, marginTop: 5,
                  }} />
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 13, fontWeight: 500, color: '#1a2e28' }}>{tb.tieu_de}</div>
                    <div style={{ fontSize: 12, color: '#5a7a72', marginTop: 2 }}>{tb.noi_dung}</div>
                  </div>
                  <div style={{ fontSize: 11, color: '#5a7a72', flexShrink: 0, marginTop: 2 }}>
                    {formatDateTime(tb.ngay_gui)}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
