import { useEffect, useState } from 'react';
import api from '../../../services/api';
import RoomFormModal from './RoomFormModal';

const BASE_URL = 'http://localhost:5000';
const fmt = (v) => new Intl.NumberFormat('vi-VN').format(v || 0);

const TRANG_THAI = {
  hoat_dong: { label: 'Đang bán', cls: 'badge-success' },
  an:        { label: 'Đã ẩn',    cls: 'badge-danger'  },
};

const InfoRow = ({ label, value }) => (
  <div style={{ display: 'flex', padding: '8px 0', borderBottom: '0.5px solid #f0f0f0', fontSize: 14 }}>
    <span style={{ width: 160, color: '#5a7a72', flexShrink: 0, fontSize: 13 }}>{label}</span>
    <span style={{ color: '#1a2e28', fontWeight: 500 }}>{value || '—'}</span>
  </div>
);

// ===== DETAIL MODAL =====
const RoomDetailModal = ({ room, onClose, onEdit, onToggle }) => {
  if (!room) return null;
  const st = TRANG_THAI[room.trang_thai] || { label: room.trang_thai, cls: 'badge-default' };
  const mainImg = room.hinh_anh?.find(i => i.la_anh_chinh === 1) || room.hinh_anh?.[0];

  return (
    <div className="modal-overlay" onClick={onClose} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 1000, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
      <div className="modal-box" style={{ background: '#fff', borderRadius: '12px', width: '100%', maxWidth: 620, padding: '24px' }} onClick={e => e.stopPropagation()}>
        <div className="modal-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <h3 className="modal-title" style={{ margin: 0, color: '#1a2e28' }}>🛏️ {room.ten_loai}</h3>
          <button className="modal-close" onClick={onClose} style={{ background: 'none', border: 'none', fontSize: '24px', cursor: 'pointer', color: '#999' }}>×</button>
        </div>

        {mainImg && (
          <div style={{ borderRadius: 10, overflow: 'hidden', marginBottom: 16, aspectRatio: '16/7' }}>
            <img src={`${BASE_URL}${mainImg.url}`} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          </div>
        )}

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <span style={{ padding: '6px 12px', borderRadius: '6px', fontSize: '12px', fontWeight: 600, background: room.trang_thai === 'hoat_dong' ? '#e8f5e9' : '#fff0f0', color: room.trang_thai === 'hoat_dong' ? '#2e7d32' : '#c62828' }}>
            {st.label}
          </span>
          <div style={{ display: 'flex', gap: 8 }}>
            <button style={{ background: '#e8f5f1', color: '#3C7363', border: 'none', padding: '6px 12px', borderRadius: '6px', cursor: 'pointer', fontWeight: 600 }} onClick={onEdit}>✏️ Chỉnh sửa</button>
            <button style={{ background: room.trang_thai === 'hoat_dong' ? '#ffebee' : '#e8f5e9', color: room.trang_thai === 'hoat_dong' ? '#c62828' : '#2e7d32', border: 'none', padding: '6px 12px', borderRadius: '6px', cursor: 'pointer', fontWeight: 600 }} onClick={onToggle}>
              {room.trang_thai === 'hoat_dong' ? '🔒 Ẩn phòng' : '🔓 Mở phòng'}
            </button>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
          <div>
            <InfoRow label="Tên loại"       value={room.ten_loai} />
            <InfoRow label="Diện tích"      value={room.dien_tich ? `${room.dien_tich} m²` : '—'} />
            <InfoRow label="Sức chứa"       value={`${room.suc_chua} khách`} />
            <InfoRow label="Số giường"      value={`${room.so_giuong} giường`} />
          </div>
          <div>
            <InfoRow label="Số lượng phòng" value={`${room.so_luong_phong} phòng`} />
            <InfoRow label="Giá cơ bản"     value={`${fmt(room.gia_co_ban)} ₫/đêm`} />
            <InfoRow label="Trạng thái"     value={st.label} />
          </div>
        </div>

        {room.mo_ta && (
          <div style={{ marginTop: 12, padding: '10px 12px', background: '#f8fdfb', borderRadius: 8, fontSize: 14, color: '#5a7a72' }}>
            {room.mo_ta}
          </div>
        )}

        {room.loai_phong_tien_nghi?.length > 0 && (
          <div style={{ marginTop: 14 }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: '#3C7363', marginBottom: 8 }}>🛎️ Tiện nghi</div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
              {room.loai_phong_tien_nghi.map(tn => (
                <span key={tn.ma_tien_nghi} style={{ padding: '4px 12px', borderRadius: 20, background: '#e8f5f1', color: '#3C7363', fontSize: 13, display: 'flex', alignItems: 'center', gap: 4 }}>
                  {tn.tien_nghi?.bieu_tuong} {tn.tien_nghi?.ten}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

// ===== MAIN PAGE =====
const RoomTypePage = () => {
  const [hotels, setHotels]          = useState([]);
  const [selectedHotel, setSelected] = useState('');
  const [rooms, setRooms]            = useState([]);
  const [amenities, setAmenities]    = useState([]);
  const [loading, setLoading]        = useState(false);
  const [modal, setModal]            = useState(null); 
  const [toast, setToast]            = useState(null);
  const [refreshKey, setRefreshKey]  = useState(0);

  const showToast = (msg, type = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3500);
  };

  useEffect(() => {
    api.get('/partner/hotels').then(res => setHotels(res.data.data || []));
    api.get('/partner/hotels/amenities').then(res => setAmenities(res.data.data || []));
  }, []);

  // GIẢI PHÁP TRIỆT ĐỂ: Gộp logic lấy danh sách vào thẳng useEffect, xóa luôn hàm loadRooms()
  useEffect(() => {
    if (!selectedHotel) return;

    let isMounted = true; // Tránh lỗi memory leak nếu người dùng chuyển trang quá nhanh

    const fetchRoomsData = async () => {
      setLoading(true);
      try {
        const res = await api.get(`/partner/rooms?hotelId=${selectedHotel}`);
        if (isMounted) setRooms(res.data.data || []);
      } catch {
        if (isMounted) setRooms([]);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchRoomsData();

    // Dọn dẹp
    return () => {
      isMounted = false;
    };
  }, [selectedHotel, refreshKey]); // Lắng nghe 2 biến này để tự động chạy lại API

  const triggerReloadRooms = () => setRefreshKey(prev => prev + 1);

  const handleToggle = async (room) => {
    const action = room.trang_thai === 'hoat_dong' ? 'ẩn' : 'mở';
    if (!window.confirm(`Xác nhận ${action} loại phòng "${room.ten_loai}"?`)) return;
    try {
      const newStatus = room.trang_thai === 'hoat_dong' ? 'an' : 'hoat_dong';
      await api.put(`/partner/rooms/${room.ma_loai_phong}`, { trang_thai: newStatus });
      showToast(`Đã ${action} loại phòng!`);
      triggerReloadRooms();
      setModal(null);
    } catch { showToast('Lỗi thao tác', 'error'); }
  };

  const currentHotel = hotels.find(h => h.ma_khach_san === Number(selectedHotel));
  const activeCount = rooms.filter(r => r.trang_thai === 'hoat_dong').length;

  return (
    <div className="main-panel" style={{ padding: '20px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <div>
          <h2 style={{ color: '#1a2e28', margin: 0, fontSize: '24px', fontWeight: 'bold' }}>Quản lý Loại phòng</h2>
          <p style={{ margin: '5px 0 0 0', color: '#666' }}>Thêm, sửa, quản lý loại phòng và tiện nghi cho từng khách sạn</p>
        </div>
        {selectedHotel && (
          <button style={{ background: '#3C7363', color: '#fff', border: 'none', padding: '10px 20px', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer' }} onClick={() => setModal('add')}>
            + Thêm loại phòng
          </button>
        )}
      </div>

      {toast && (
        <div style={{ position: 'fixed', top: 80, right: 24, zIndex: 999, padding: '12px 20px', borderRadius: 10, fontSize: 14, fontWeight: 500, background: toast.type === 'success' ? '#e8f5f1' : '#fff0f0', border: `1px solid ${toast.type === 'success' ? '#8FD9C4' : '#ffb3b3'}`, color: toast.type === 'success' ? '#3C7363' : '#e05c5c', boxShadow: '0 4px 16px rgba(0,0,0,0.1)' }}>
          {toast.type === 'success' ? '✅' : '❌'} {toast.msg}
        </div>
      )}

      <div style={{ background: '#fff', borderRadius: '12px', padding: '20px', boxShadow: '0 2px 10px rgba(0,0,0,0.05)', marginBottom: 24 }}>
        <div style={{ display: 'flex', gap: 16, alignItems: 'flex-end', flexWrap: 'wrap' }}>
          <div style={{ flex: '1 1 280px' }}>
            <label style={{ fontSize: 13, color: '#5a7a72', display: 'block', marginBottom: 8, fontWeight: 600 }}>Chọn khách sạn để quản lý loại phòng</label>
            <select 
              value={selectedHotel} 
              onChange={e => {
                const val = e.target.value;
                setSelected(val);
                if (!val) setRooms([]); 
              }} 
              style={{ width: '100%', padding: '10px 14px', border: '1px solid #ccc', borderRadius: 8, fontSize: 14, outline: 'none' }}
            >
              <option value="">-- Chọn khách sạn của bạn --</option>
              {hotels.map(h => <option key={h.ma_khach_san} value={h.ma_khach_san}>🏨 {h.ten}</option>)}
            </select>
          </div>

          {currentHotel && (
            <div style={{ display: 'flex', gap: 16 }}>
              <div style={{ background: '#f8fdfb', padding: '12px 20px', borderRadius: '8px', borderTop: '3px solid #3C7363', minWidth: 100 }}>
                <div style={{ color: '#888', fontSize: 12, fontWeight: 600 }}>TỔNG LOẠI</div>
                <div style={{ color: '#3C7363', fontSize: 22, fontWeight: 'bold' }}>{rooms.length}</div>
              </div>
              <div style={{ background: '#f8fdfb', padding: '12px 20px', borderRadius: '8px', borderTop: '3px solid #52c41a', minWidth: 100 }}>
                <div style={{ color: '#888', fontSize: 12, fontWeight: 600 }}>HOẠT ĐỘNG</div>
                <div style={{ color: '#52c41a', fontSize: 22, fontWeight: 'bold' }}>{activeCount}</div>
              </div>
              <div style={{ background: '#f8fdfb', padding: '12px 20px', borderRadius: '8px', borderTop: '3px solid #e05c5c', minWidth: 100 }}>
                <div style={{ color: '#888', fontSize: 12, fontWeight: 600 }}>ĐÃ ẨN</div>
                <div style={{ color: '#e05c5c', fontSize: 22, fontWeight: 'bold' }}>{rooms.length - activeCount}</div>
              </div>
            </div>
          )}
        </div>
      </div>

      {!selectedHotel ? (
        <div style={{ background: '#fff', borderRadius: '12px', padding: '50px', textAlign: 'center', boxShadow: '0 2px 10px rgba(0,0,0,0.05)' }}>
          <div style={{ fontSize: '40px', marginBottom: '10px' }}>🏨</div>
          <p style={{ color: '#888' }}>Vui lòng chọn khách sạn ở danh sách trên để xem các loại phòng.</p>
        </div>
      ) : loading ? (
        <div style={{ textAlign: 'center', padding: 40, color: '#5a7a72' }}>⏳ Đang tải dữ liệu...</div>
      ) : rooms.length === 0 ? (
        <div style={{ background: '#fff', borderRadius: '12px', padding: '50px', textAlign: 'center', boxShadow: '0 2px 10px rgba(0,0,0,0.05)' }}>
          <div style={{ fontSize: '40px', marginBottom: '10px' }}>🛏️</div>
          <p style={{ color: '#888' }}>Khách sạn này chưa có loại phòng nào. Hãy thêm ngay!</p>
        </div>
      ) : (
        <div style={{ background: '#fff', borderRadius: '12px', boxShadow: '0 2px 10px rgba(0,0,0,0.05)', overflow: 'hidden' }}>
          <div style={{ padding: '20px', borderBottom: '1px solid #eee' }}>
            <h3 style={{ margin: 0, color: '#1a2e28', fontSize: '16px' }}>Danh sách loại phòng ({rooms.length})</h3>
          </div>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
            <thead style={{ background: '#f8fdfb', color: '#5a7a72', fontSize: '14px' }}>
              <tr>
                <th style={{ padding: '15px 20px', borderBottom: '2px solid #e8f5f1' }}>Tên loại phòng</th>
                <th style={{ padding: '15px 20px', borderBottom: '2px solid #e8f5f1' }}>Diện tích</th>
                <th style={{ padding: '15px 20px', borderBottom: '2px solid #e8f5f1' }}>Sức chứa</th>
                <th style={{ padding: '15px 20px', borderBottom: '2px solid #e8f5f1' }}>Số lượng</th>
                <th style={{ padding: '15px 20px', borderBottom: '2px solid #e8f5f1' }}>Giá cơ bản</th>
                <th style={{ padding: '15px 20px', borderBottom: '2px solid #e8f5f1' }}>Trạng thái</th>
                <th style={{ padding: '15px 20px', borderBottom: '2px solid #e8f5f1', textAlign: 'right' }}>Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {rooms.map(room => {
                const st = TRANG_THAI[room.trang_thai] || { label: room.trang_thai, cls: 'badge-default' };
                const mainImg = room.hinh_anh?.find(i => i.la_anh_chinh === 1) || room.hinh_anh?.[0];
                return (
                  <tr key={room.ma_loai_phong} style={{ borderBottom: '1px solid #eee', opacity: room.trang_thai === 'an' ? 0.6 : 1 }}>
                    <td style={{ padding: '15px 20px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        {mainImg ? (
                          <div style={{ width: 44, height: 36, borderRadius: 6, overflow: 'hidden', flexShrink: 0 }}>
                            <img src={`${BASE_URL}${mainImg.url}`} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                          </div>
                        ) : (
                          <div style={{ width: 44, height: 36, borderRadius: 6, background: '#e8f5f1', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, fontSize: 18 }}>🛏️</div>
                        )}
                        <div>
                          <div style={{ fontWeight: 600, color: '#1a2e28' }}>{room.ten_loai}</div>
                          <div style={{ fontSize: 12, color: '#5a7a72' }}>{room.so_giuong} giường</div>
                        </div>
                      </div>
                    </td>
                    <td style={{ padding: '15px 20px', fontSize: 13 }}>{room.dien_tich ? `${room.dien_tich} m²` : '—'}</td>
                    <td style={{ padding: '15px 20px', fontSize: 13 }}>{room.suc_chua} khách</td>
                    <td style={{ padding: '15px 20px', fontSize: 13 }}>{room.so_luong_phong} phòng</td>
                    <td style={{ padding: '15px 20px', fontWeight: 'bold', color: '#e67e22' }}>{fmt(room.gia_co_ban)} ₫</td>
                    <td style={{ padding: '15px 20px' }}>
                      <span style={{ padding: '4px 8px', borderRadius: '4px', fontSize: '12px', fontWeight: 600, background: room.trang_thai === 'hoat_dong' ? '#e8f5e9' : '#fff0f0', color: room.trang_thai === 'hoat_dong' ? '#2e7d32' : '#c62828' }}>
                        {st.label}
                      </span>
                    </td>
                    <td style={{ padding: '15px 20px', textAlign: 'right' }}>
                      <div style={{ display: 'flex', gap: 6, justifyContent: 'flex-end' }}>
                        <button style={{ background: '#e8f5f1', color: '#3C7363', border: 'none', padding: '6px 12px', borderRadius: '6px', cursor: 'pointer', fontWeight: 600 }} onClick={() => setModal({ detail: room })}>👁️</button>
                        <button style={{ background: '#e8f5f1', color: '#3C7363', border: 'none', padding: '6px 12px', borderRadius: '6px', cursor: 'pointer', fontWeight: 600 }} onClick={() => setModal(room)}>✏️</button>
                        <button style={{ background: room.trang_thai === 'hoat_dong' ? '#ffebee' : '#e8f5e9', color: room.trang_thai === 'hoat_dong' ? '#c62828' : '#2e7d32', border: 'none', padding: '6px 12px', borderRadius: '6px', cursor: 'pointer', fontWeight: 600 }} onClick={() => handleToggle(room)}>
                          {room.trang_thai === 'hoat_dong' ? '🔒' : '🔓'}
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {modal === 'add' && <RoomFormModal room={null} hotelId={Number(selectedHotel)} amenities={amenities} onClose={() => setModal(null)} onSuccess={() => triggerReloadRooms()} />}
      {modal && modal !== 'add' && !modal.detail && <RoomFormModal room={modal} hotelId={Number(selectedHotel)} amenities={amenities} onClose={() => setModal(null)} onSuccess={() => triggerReloadRooms()} />}
      {modal?.detail && <RoomDetailModal room={modal.detail} onClose={() => setModal(null)} onEdit={() => setModal(modal.detail)} onToggle={() => { handleToggle(modal.detail); setModal(null); }} />}
    </div>
  );
};

export default RoomTypePage;