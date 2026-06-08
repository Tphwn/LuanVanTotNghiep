import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  fetchMyHotels, fetchDiaDiem, fetchAmenitiesForHotel,
  createHotel, updateHotel, clearMsg,
} from '../../../store/slices/partnerHotelSlice';
import api from '../../../services/api';

// ===== CONSTANTS =====
const TRANG_THAI = {
  cho_duyet:   { label: 'Chờ duyệt',    cls: 'badge-warning' },
  da_duyet:    { label: 'Đã duyệt',     cls: 'badge-info' },
  hoat_dong:   { label: 'Hoạt động',    cls: 'badge-success' },
  tu_choi:     { label: 'Từ chối',      cls: 'badge-danger' },
  yeu_cau_sua: { label: 'Cần sửa',      cls: 'badge-warning' },
  bi_khoa:     { label: 'Bị khóa',      cls: 'badge-danger' },
};

const INIT_FORM = {
  ten: '', dia_chi: '', mo_ta: '',
  so_sao: 3, gio_nhan_phong: '14:00',
  gio_tra_phong: '12:00', ma_dia_diem: '',
  tien_nghi_ids: [],
};


const HotelFormModal = ({ hotel, diaDiem, amenities, onClose, onSubmit, loading }) => {
  const isEdit = !!hotel;
  const [form, setForm] = useState(
    isEdit ? {
      ten: hotel.ten,
      dia_chi: hotel.dia_chi,
      mo_ta: hotel.mo_ta || '',
      so_sao: hotel.so_sao || 3,
      gio_nhan_phong: hotel.gio_nhan_phong
        ? new Date(hotel.gio_nhan_phong).toTimeString().slice(0, 5)
        : '14:00',
      gio_tra_phong: hotel.gio_tra_phong
        ? new Date(hotel.gio_tra_phong).toTimeString().slice(0, 5)
        : '12:00',
      ma_dia_diem: hotel.ma_dia_diem || '',
      tien_nghi_ids: hotel.khach_san_tien_nghi?.map(x => x.ma_tien_nghi) || [],
    } : { ...INIT_FORM }
  );

  // Đề xuất tiện nghi mới
  const [showPropose, setShowPropose] = useState(false);
  const [proposeForm, setProposeForm] = useState({ ten_de_xuat: '', mo_ta: '' });
  const [proposing, setProposing] = useState(false);
  const [proposeSuccess, setProposeSuccess] = useState(false);

  const toggleAmenity = (id) => {
    setForm(prev => ({
      ...prev,
      tien_nghi_ids: prev.tien_nghi_ids.includes(id)
        ? prev.tien_nghi_ids.filter(x => x !== id)
        : [...prev.tien_nghi_ids, id],
    }));
  };

  const handlePropose = async () => {
    if (!proposeForm.ten_de_xuat.trim()) return alert('Nhập tên tiện nghi đề xuất');
    setProposing(true);
    try {
      await api.post('/amenities/requests', proposeForm);
      setProposeSuccess(true);
      setProposeForm({ ten_de_xuat: '', mo_ta: '' });
      setTimeout(() => setProposeSuccess(false), 3000);
    } catch {
      alert('Gửi đề xuất thất bại');
    } finally {
      setProposing(false);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!form.ten.trim()) return alert('Nhập tên khách sạn');
    if (!form.dia_chi.trim()) return alert('Nhập địa chỉ');
    if (!form.ma_dia_diem) return alert('Chọn địa điểm');
    onSubmit(form);
  };

  const inputStyle = {
    width: '100%', padding: '9px 12px',
    border: '1px solid #d4ede6', borderRadius: 8,
    fontSize: 14, outline: 'none', boxSizing: 'border-box',
    fontFamily: 'inherit',
  };

  const labelStyle = {
    display: 'block', fontSize: 13,
    fontWeight: 500, marginBottom: 6, color: '#1a2e28',
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="modal-box"
        style={{ maxWidth: 640 }}
        onClick={e => e.stopPropagation()}
      >
        <div className="modal-header">
          <h3 className="modal-title">
            {isEdit ? '✏️ Chỉnh sửa khách sạn' : '🏨 Thêm khách sạn mới'}
          </h3>
          <button className="modal-close" onClick={onClose}>×</button>
        </div>

        {/* Note duyệt */}
        {!isEdit && (
          <div style={{
            background: '#fff8e6', border: '1px solid #fac775',
            borderRadius: 8, padding: '10px 14px',
            fontSize: 13, color: '#854F0B', marginBottom: 16,
          }}>
            ⏳ Sau khi thêm, khách sạn sẽ được gửi cho admin duyệt trước khi hoạt động.
          </div>
        )}
        {isEdit && (
          <div style={{
            background: '#e8f5f1', border: '1px solid #8FD9C4',
            borderRadius: 8, padding: '10px 14px',
            fontSize: 13, color: '#3C7363', marginBottom: 16,
          }}>
            ✓ Chỉnh sửa thông tin không cần duyệt lại.
          </div>
        )}

        <form onSubmit={handleSubmit}>
          {/* Tên + Địa điểm */}
          <div className="form-grid" style={{ marginBottom: 12 }}>
            <div>
              <label style={labelStyle}>Tên khách sạn <span style={{ color: '#e05c5c' }}>*</span></label>
              <input style={inputStyle} value={form.ten}
                onChange={e => setForm({ ...form, ten: e.target.value })}
                placeholder="VD: Khách sạn Mặt Trời" />
            </div>
            <div>
              <label style={labelStyle}>Địa điểm <span style={{ color: '#e05c5c' }}>*</span></label>
              <select style={inputStyle} value={form.ma_dia_diem}
                onChange={e => setForm({ ...form, ma_dia_diem: e.target.value })}>
                <option value="">-- Chọn địa điểm --</option>
                {diaDiem.map(d => (
                  <option key={d.ma_dia_diem} value={d.ma_dia_diem}>
                    {d.ten_dia_diem} {d.tinh_thanh ? `- ${d.tinh_thanh}` : ''}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Địa chỉ */}
          <div style={{ marginBottom: 12 }}>
            <label style={labelStyle}>Địa chỉ cụ thể <span style={{ color: '#e05c5c' }}>*</span></label>
            <input style={inputStyle} value={form.dia_chi}
              onChange={e => setForm({ ...form, dia_chi: e.target.value })}
              placeholder="Số nhà, đường, phường/xã..." />
          </div>

          {/* Mô tả */}
          <div style={{ marginBottom: 12 }}>
            <label style={labelStyle}>Mô tả</label>
            <textarea rows={3} style={{ ...inputStyle, resize: 'vertical' }}
              value={form.mo_ta}
              onChange={e => setForm({ ...form, mo_ta: e.target.value })}
              placeholder="Giới thiệu về khách sạn..." />
          </div>

          {/* Sao + Giờ */}
          <div className="form-grid" style={{ marginBottom: 12 }}>
            <div>
              <label style={labelStyle}>Số sao</label>
              <select style={inputStyle} value={form.so_sao}
                onChange={e => setForm({ ...form, so_sao: e.target.value })}>
                {[1, 2, 3, 4, 5].map(n => (
                  <option key={n} value={n}>{n} ⭐</option>
                ))}
              </select>
            </div>
            <div>
              <label style={labelStyle}>Giờ nhận phòng</label>
              <input type="time" style={inputStyle} value={form.gio_nhan_phong}
                onChange={e => setForm({ ...form, gio_nhan_phong: e.target.value })} />
            </div>
            <div>
              <label style={labelStyle}>Giờ trả phòng</label>
              <input type="time" style={inputStyle} value={form.gio_tra_phong}
                onChange={e => setForm({ ...form, gio_tra_phong: e.target.value })} />
            </div>
          </div>

          {/* Tiện nghi */}
          <div style={{ marginBottom: 16 }}>
            <label style={labelStyle}>Tiện nghi khách sạn</label>
            <div style={{
              display: 'flex', flexWrap: 'wrap', gap: 8,
              padding: 12, background: '#f8fdfb',
              borderRadius: 8, border: '1px solid #d4ede6',
              minHeight: 60,
            }}>
              {amenities.length === 0 && (
                <span style={{ fontSize: 13, color: '#5a7a72' }}>Chưa có tiện nghi nào</span>
              )}
              {amenities.map(a => {
                const checked = form.tien_nghi_ids.includes(a.ma_tien_nghi);
                return (
                  <button
                    key={a.ma_tien_nghi}
                    type="button"
                    onClick={() => toggleAmenity(a.ma_tien_nghi)}
                    style={{
                      padding: '6px 12px',
                      borderRadius: 20,
                      border: checked ? 'none' : '1px solid #d4ede6',
                      background: checked ? '#3C7363' : '#fff',
                      color: checked ? '#fff' : '#334155',
                      fontSize: 13, cursor: 'pointer',
                      display: 'flex', alignItems: 'center', gap: 5,
                      transition: 'all .15s',
                    }}
                  >
                    {a.bieu_tuong} {a.ten}
                    {checked && <span style={{ fontSize: 11 }}>✓</span>}
                  </button>
                );
              })}
            </div>

            {/* Đề xuất tiện nghi mới */}
            <button
              type="button"
              onClick={() => setShowPropose(!showPropose)}
              style={{
                marginTop: 8, fontSize: 13,
                color: '#3C7363', background: 'none',
                border: 'none', cursor: 'pointer',
                textDecoration: 'underline', padding: 0,
              }}
            >
              {showPropose ? '▲ Ẩn' : '▼ Không tìm thấy? Đề xuất tiện nghi mới'}
            </button>

            {showPropose && (
              <div style={{
                marginTop: 8, padding: 12,
                background: '#fff8e6', borderRadius: 8,
                border: '1px solid #fac775',
              }}>
                <p style={{ fontSize: 13, color: '#854F0B', marginBottom: 8 }}>
                  Gửi đề xuất cho admin — tiện nghi sẽ được tạo sau khi duyệt.
                </p>
                {proposeSuccess && (
                  <div style={{
                    background: '#e8f5f1', color: '#3C7363',
                    padding: '8px 12px', borderRadius: 6,
                    fontSize: 13, marginBottom: 8,
                  }}>
                    ✅ Đã gửi đề xuất thành công!
                  </div>
                )}
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  <input
                    style={{ ...inputStyle, flex: 2 }}
                    placeholder="Tên tiện nghi đề xuất *"
                    value={proposeForm.ten_de_xuat}
                    onChange={e => setProposeForm({ ...proposeForm, ten_de_xuat: e.target.value })}
                  />
                  <input
                    style={{ ...inputStyle, flex: 3 }}
                    placeholder="Mô tả thêm (tùy chọn)"
                    value={proposeForm.mo_ta}
                    onChange={e => setProposeForm({ ...proposeForm, mo_ta: e.target.value })}
                  />
                  <button
                    type="button"
                    className="btn btn-outline btn-sm"
                    onClick={handlePropose}
                    disabled={proposing}
                  >
                    {proposing ? 'Đang gửi...' : 'Gửi đề xuất'}
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Actions */}
          <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
            <button type="button" className="btn btn-ghost" onClick={onClose}>
              Hủy
            </button>
            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading
                ? 'Đang lưu...'
                : isEdit ? 'Lưu thay đổi' : '📤 Gửi duyệt'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// ===== MAIN PAGE =====
const HotelsPage = () => {
  const dispatch = useDispatch();
  const { list, diaDiem, amenities, loading, error, successMsg } = useSelector(
    s => s.partnerHotel || {}
  );

  const [modal, setModal] = useState(null); // null | 'add' | hotel_object

  useEffect(() => {
    dispatch(fetchMyHotels());
    dispatch(fetchDiaDiem());
    dispatch(fetchAmenitiesForHotel());
  }, [dispatch]);

  useEffect(() => {
    if (successMsg || error) {
      const t = setTimeout(() => dispatch(clearMsg()), 4000);
      return () => clearTimeout(t);
    }
  }, [successMsg, error]);

  const handleSubmit = async (formData) => {
    if (modal === 'add') {
      const res = await dispatch(createHotel(formData));
      if (!res.error) setModal(null);
    } else {
      const res = await dispatch(updateHotel({ id: modal.ma_khach_san, data: formData }));
      if (!res.error) setModal(null);
    }
  };

  const pendingCount  = list.filter(h => h.trang_thai === 'cho_duyet').length;
  const activeCount   = list.filter(h => h.trang_thai === 'hoat_dong').length;
  const rejectedCount = list.filter(h => ['tu_choi', 'yeu_cau_sua'].includes(h.trang_thai)).length;

  return (
    <div>
      {/* Header */}
      <div className="page-header">
        <div className="page-header-left">
          <h1 className="page-title">Quản lý Khách sạn</h1>
          <p className="page-subtitle">Danh sách khách sạn của bạn</p>
        </div>
        <button className="btn btn-primary" onClick={() => setModal('add')}>
          + Thêm khách sạn
        </button>
      </div>

      {/* Toast thông báo */}
      {successMsg && (
        <div style={{
          background: '#e8f5f1', border: '1px solid #8FD9C4',
          color: '#3C7363', padding: '10px 16px',
          borderRadius: 8, marginBottom: 16, fontSize: 14,
        }}>
          ✅ {successMsg}
        </div>
      )}
      {error && (
        <div style={{
          background: '#fff0f0', border: '1px solid #ffb3b3',
          color: '#e05c5c', padding: '10px 16px',
          borderRadius: 8, marginBottom: 16, fontSize: 14,
        }}>
          ❌ {error}
        </div>
      )}

      {/* Stats */}
      <div className="stats-grid" style={{ gridTemplateColumns: 'repeat(4,1fr)', marginBottom: 16 }}>
        <div className="stat-card" style={{ borderTop: '3px solid #3C7363' }}>
          <div className="stat-card-label">Tổng khách sạn</div>
          <div className="stat-card-value" style={{ color: '#3C7363' }}>{list.length}</div>
        </div>
        <div className="stat-card" style={{ borderTop: '3px solid #52c41a' }}>
          <div className="stat-card-label">Hoạt động</div>
          <div className="stat-card-value" style={{ color: '#52c41a' }}>{activeCount}</div>
        </div>
        <div className="stat-card" style={{ borderTop: '3px solid #b36b00' }}>
          <div className="stat-card-label">Chờ duyệt</div>
          <div className="stat-card-value" style={{ color: '#b36b00' }}>{pendingCount}</div>
        </div>
        <div className="stat-card" style={{ borderTop: '3px solid #e05c5c' }}>
          <div className="stat-card-label">Từ chối / Cần sửa</div>
          <div className="stat-card-value" style={{ color: '#e05c5c' }}>{rejectedCount}</div>
        </div>
      </div>

      {/* Danh sách */}
      <div className="content-card">
        <div className="content-card-header">
          <h3 className="content-card-title">Danh sách ({list.length})</h3>
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: 40, color: '#5a7a72' }}>
            ⏳ Đang tải...
          </div>
        ) : list.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon">🏨</div>
            <p className="empty-state-text">Chưa có khách sạn nào. Thêm ngay!</p>
          </div>
        ) : (
          <table className="data-table">
            <thead>
              <tr>
                <th>Tên khách sạn</th>
                <th>Địa điểm</th>
                <th>Sao</th>
                <th>Tiện nghi</th>
                <th>Trạng thái</th>
                <th>Ngày tạo</th>
                <th>Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {list.map(hotel => {
                const st = TRANG_THAI[hotel.trang_thai] || { label: hotel.trang_thai, cls: 'badge-default' };
                return (
                  <tr key={hotel.ma_khach_san}>
                    <td>
                      <div style={{ fontWeight: 500 }}>{hotel.ten}</div>
                      <div style={{ fontSize: 12, color: '#5a7a72' }}>{hotel.dia_chi}</div>
                    </td>
                    <td>{hotel.dia_diem?.ten_dia_diem || '—'}</td>
                    <td>{'⭐'.repeat(hotel.so_sao || 0)}</td>
                    <td>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                        {hotel.khach_san_tien_nghi?.slice(0, 3).map(tn => (
                          <span key={tn.ma_tien_nghi} style={{ fontSize: 18 }}>
                            {tn.tien_nghi?.bieu_tuong}
                          </span>
                        ))}
                        {hotel.khach_san_tien_nghi?.length > 3 && (
                          <span style={{ fontSize: 12, color: '#5a7a72' }}>
                            +{hotel.khach_san_tien_nghi.length - 3}
                          </span>
                        )}
                      </div>
                    </td>
                    <td>
                      <div>
                        <span className={`badge ${st.cls}`}>{st.label}</span>
                        {/* Hiện lý do từ chối */}
                        {hotel.ly_do_tu_choi && (
                          <div style={{
                            fontSize: 12, color: '#e05c5c',
                            marginTop: 4, maxWidth: 180,
                          }}>
                            💬 {hotel.ly_do_tu_choi}
                          </div>
                        )}
                      </div>
                    </td>
                    <td style={{ fontSize: 13, color: '#5a7a72' }}>
                      {new Date(hotel.ngay_tao).toLocaleDateString('vi-VN')}
                    </td>
                    <td>
                      <button
                        className="btn btn-outline btn-sm"
                        onClick={() => setModal(hotel)}
                      >
                        ✏️ Sửa
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* Modal */}
      {modal && (
        <HotelFormModal
          hotel={modal === 'add' ? null : modal}
          diaDiem={diaDiem || []}
          amenities={amenities || []}
          onClose={() => setModal(null)}
          onSubmit={handleSubmit}
          loading={loading}
        />
      )}
    </div>
  );
};

export default HotelsPage;