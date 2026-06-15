import { useState, useRef } from 'react';
import api from '../../../services/api';
import { getAmenityIcon } from '../../../utils/amenityIcons';
import AmenityRequestStatus from '../../../components/partner/AmenityRequestStatus';

const BASE_URL = 'http://localhost:5000';

const RoomFormModal = ({ room, hotelId, amenities, onClose, onSuccess }) => {
  const isEdit = !!room;
  const [form, setForm] = useState(isEdit ? {
    ten_loai:        room.ten_loai,
    dien_tich:       room.dien_tich || '',
    suc_chua:        room.suc_chua,
    so_luong_phong:  room.so_luong_phong,
    gia_co_ban:      room.gia_co_ban,
    so_giuong:       room.so_giuong || 1,
    mo_ta:           room.mo_ta || '',
    tien_nghi_ids:   room.loai_phong_tien_nghi?.map(x => x.ma_tien_nghi) || [],
  } : {
    ten_loai: '', dien_tich: '', suc_chua: 2,
    so_luong_phong: 1, gia_co_ban: '', so_giuong: 1,
    mo_ta: '', tien_nghi_ids: [],
  });

  const [images, setImages] = useState(isEdit ? (room.hinh_anh || []) : []);
  const [removedImageIds, setRemovedImageIds] = useState([]);
  const [saving, setSaving] = useState(false);
  const [requestRefresh, setRequestRefresh] = useState(0);
  const [toast, setToast] = useState(null);
  const fileRef = useRef();

  const showToast = (msg, type = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  const toggleAmenity = (id) => {
    setForm(prev => ({
      ...prev,
      tien_nghi_ids: prev.tien_nghi_ids.includes(id)
        ? prev.tien_nghi_ids.filter(x => x !== id) : [...prev.tien_nghi_ids, id],
    }));
  };

  const handleImageChange = (e) => {
    const files = Array.from(e.target.files);
    if (files.length === 0) return;
    const newImages = files.map((file, idx) => ({
      ma_hinh_anh: `new-${Date.now()}-${idx}`,
      url: URL.createObjectURL(file),
      file, la_anh_chinh: images.length === 0 && idx === 0 ? 1 : 0,
    }));
    setImages(prev => [...prev, ...newImages]);
    e.target.value = '';
  };

  const handleRemoveImage = (id) => {
    const img = images.find(i => i.ma_hinh_anh === id);
    if (img && !img.file && typeof img.ma_hinh_anh === 'number') {
      setRemovedImageIds(prev => [...prev, img.ma_hinh_anh]);
    }
    setImages(prev => prev.filter(i => i.ma_hinh_anh !== id));
  };

  const handleSetMain = (id) => {
    setImages(prev => prev.map(img => ({ ...img, la_anh_chinh: img.ma_hinh_anh === id ? 1 : 0 })));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.ten_loai?.trim()) return alert('Nhập tên loại phòng');
    if (!form.gia_co_ban) return alert('Nhập giá cơ bản');
    if (images.length === 0) return alert('Vui lòng chọn ít nhất 1 ảnh phòng');

    // Đóng gói FormData y hệt Khách Sạn
    const formData = new FormData();
    formData.append('ma_khach_san', hotelId);
    formData.append('ten_loai', form.ten_loai);
    formData.append('gia_co_ban', Number(form.gia_co_ban));
    if (form.dien_tich) formData.append('dien_tich', Number(form.dien_tich));
    formData.append('suc_chua', Number(form.suc_chua));
    formData.append('so_luong_phong', Number(form.so_luong_phong));
    formData.append('so_giuong', Number(form.so_giuong));
    formData.append('mo_ta', form.mo_ta || '');
    formData.append('tien_nghi_ids', JSON.stringify(form.tien_nghi_ids));

    if (removedImageIds.length > 0) {
      formData.append('removedImageIds', JSON.stringify(removedImageIds));
    }

    const newFiles = images.filter(img => img.file);
    let mainNewIndex = -1;
    newFiles.forEach((img, idx) => {
      formData.append('images', img.file);
      if (img.la_anh_chinh === 1) mainNewIndex = idx;
    });

    const mainExisting = images.find(img => !img.file && img.la_anh_chinh === 1);
    if (mainExisting) formData.append('mainImageId', mainExisting.ma_hinh_anh);
    if (mainNewIndex >= 0) formData.append('mainNewIndex', mainNewIndex);
    if (!isEdit && newFiles.length > 0 && mainNewIndex === -1) formData.append('mainImageIndex', 0);

    setSaving(true);
    try {
      if (isEdit) {
        // Gọi PUT
        await api.put(`/partner/rooms/${room.ma_loai_phong}`, formData, { headers: { 'Content-Type': 'multipart/form-data' }});
        showToast('Cập nhật thành công!');
      } else {
        // Gọi POST
        await api.post('/partner/rooms', formData, { headers: { 'Content-Type': 'multipart/form-data' }});
        showToast('Tạo loại phòng thành công!');
      }
      setTimeout(() => { onSuccess(); onClose(); }, 1000);
    } catch (err) {
      showToast(err.response?.data?.message || 'Lỗi lưu dữ liệu', 'error');
    } finally {
      setSaving(false);
    }
  };

  const inputSt = { width: '100%', padding: '9px 12px', border: '1px solid #d4ede6', borderRadius: 8, fontSize: 14, outline: 'none', fontFamily: 'inherit', boxSizing: 'border-box' };
  const labelSt = { display: 'block', fontSize: 13, fontWeight: 500, marginBottom: 6, color: '#1a2e28' };

  return (
    <div className="modal-overlay" onClick={onClose} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 1000, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
      <div className="modal-box" style={{ background: '#fff', borderRadius: '12px', width: '100%', maxWidth: 680, maxHeight: '92vh', overflowY: 'auto', padding: '24px' }} onClick={e => e.stopPropagation()}>
        {toast && (
          <div style={{ position: 'sticky', top: 0, zIndex: 10, padding: '10px 14px', borderRadius: 8, marginBottom: 12, background: toast.type === 'success' ? '#e8f5f1' : '#fff0f0', border: `1px solid ${toast.type === 'success' ? '#8FD9C4' : '#ffb3b3'}`, color: toast.type === 'success' ? '#3C7363' : '#e05c5c', fontSize: 13, fontWeight: 500 }}>
            {toast.type === 'success' ? '✅' : '❌'} {toast.msg}
          </div>
        )}

        <div className="modal-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <h3 className="modal-title" style={{ margin: 0, color: '#3C7363', fontSize: '18px' }}>
            {isEdit ? '✏️ Chỉnh sửa loại phòng' : '🛏️ Thêm loại phòng mới'}
          </h3>
          <button type="button" className="modal-close" onClick={onClose} style={{ background: 'none', border: 'none', fontSize: '24px', cursor: 'pointer', color: '#999' }}>×</button>
        </div>

        <form onSubmit={handleSubmit}>
          <h4 style={{ fontSize: 13, fontWeight: 600, color: '#3C7363', marginBottom: 12, textTransform: 'uppercase' }}>📋 Thông tin cơ bản</h4>

          <div style={{ marginBottom: 12 }}>
            <label style={labelSt}>Tên loại phòng <span style={{ color: '#e05c5c' }}>*</span></label>
            <input style={inputSt} placeholder="VD: Phòng Deluxe, Suite Ocean View..." value={form.ten_loai} onChange={e => setForm({ ...form, ten_loai: e.target.value })} />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12, marginBottom: 12 }}>
            <div>
              <label style={labelSt}>Diện tích (m²)</label>
              <input type="number" style={inputSt} placeholder="25" value={form.dien_tich} onChange={e => setForm({ ...form, dien_tich: e.target.value })} />
            </div>
            <div>
              <label style={labelSt}>Sức chứa (khách) <span style={{ color: '#e05c5c' }}>*</span></label>
              <input type="number" min={1} style={inputSt} value={form.suc_chua} onChange={e => setForm({ ...form, suc_chua: e.target.value })} />
            </div>
            <div>
              <label style={labelSt}>Số giường</label>
              <select style={inputSt} value={form.so_giuong} onChange={e => setForm({ ...form, so_giuong: e.target.value })}>
                {[1, 2, 3, 4].map(n => <option key={n} value={n}>{n} giường</option>)}
              </select>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 12 }}>
            <div>
              <label style={labelSt}>Số lượng phòng <span style={{ color: '#e05c5c' }}>*</span></label>
              <input type="number" min={1} style={inputSt} value={form.so_luong_phong} onChange={e => setForm({ ...form, so_luong_phong: e.target.value })} />
            </div>
            <div>
              <label style={labelSt}>Giá cơ bản (VNĐ/đêm) <span style={{ color: '#e05c5c' }}>*</span></label>
              <input type="number" min={0} style={inputSt} placeholder="500000" value={form.gia_co_ban} onChange={e => setForm({ ...form, gia_co_ban: e.target.value })} />
            </div>
          </div>

          <div style={{ marginBottom: 16 }}>
            <label style={labelSt}>Mô tả</label>
            <textarea rows={3} style={{ ...inputSt, resize: 'vertical' }} placeholder="Mô tả về loại phòng này..." value={form.mo_ta} onChange={e => setForm({ ...form, mo_ta: e.target.value })} />
          </div>
         <AmenityRequestStatus loaiFilter="phong" refreshKey={requestRefresh} />

         <h4 style={{ fontSize: 13, fontWeight: 600, color: '#3C7363', marginBottom: 10, display: 'flex', justifyContent: 'space-between' }}>
            🛎️ Tiện nghi loại phòng
            <button 
              type="button" 
              onClick={async () => {
                const name = prompt('Nhập tên tiện nghi bạn muốn yêu cầu:');
                if (!name?.trim()) return;
                try {
                  await api.post('/amenities/requests', {
                    ten_de_xuat: name.trim(),
                    loai_de_xuat: 'phong',
                    mo_ta: `Đối tác yêu cầu cho loại phòng ${room?.ten_loai || form.ten_loai || 'mới'}`,
                  });
                  showToast('Đã gửi yêu cầu! Bạn sẽ nhận thông báo khi admin xử lý.');
                  setRequestRefresh((k) => k + 1);
                } catch (err) {
                  showToast(err.response?.data?.message || 'Gửi yêu cầu thất bại', 'error');
                }
              }}
              style={{ fontSize: 11, cursor: 'pointer', border: 'none', background: '#e8f5f1', color: '#3C7363', borderRadius: 4, padding: '4px 8px' }}
            >
              + Yêu cầu tiện nghi mới
            </button>
          </h4>
          

          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, padding: 12, background: '#f8fdfb', borderRadius: 8, border: '1px solid #d4ede6', minHeight: 56, marginBottom: 16 }}>
            {amenities.length === 0 ? <span style={{ fontSize: 13, color: '#5a7a72' }}>Chưa có tiện nghi nào</span> : amenities.map(a => {
              const checked = form.tien_nghi_ids.includes(a.ma_tien_nghi);
              return (
                <button key={a.ma_tien_nghi} type="button" onClick={() => toggleAmenity(a.ma_tien_nghi)} style={{ padding: '5px 12px', borderRadius: 20, border: checked ? 'none' : '1px solid #d4ede6', background: checked ? '#3C7363' : '#fff', color: checked ? '#fff' : '#334155', fontSize: 13, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 5 }}>
                  {getAmenityIcon(a.bieu_tuong, a.ten)} {a.ten} {checked && <span style={{ fontSize: 11 }}>✓</span>}
                </button>
              );
            })}
          </div>

          <h4 style={{ fontSize: 13, fontWeight: 600, color: '#3C7363', marginBottom: 10, textTransform: 'uppercase' }}>🖼️ Hình ảnh loại phòng</h4>
          <label style={{ display: 'block', position: 'relative', border: '2px dashed #8FD9C4', borderRadius: 10, padding: '20px', textAlign: 'center', cursor: 'pointer', background: '#f8fdfb', marginBottom: 12 }}>
            <div style={{ fontSize: 28, marginBottom: 4 }}>📤</div>
            <div style={{ fontSize: 13, color: '#3C7363', fontWeight: 500 }}>Kéo thả hoặc click để chọn ảnh</div>
            <div style={{ fontSize: 12, color: '#5a7a72' }}>Hỗ trợ JPG, PNG (Tối đa 10 ảnh)</div>
            <input ref={fileRef} type="file" multiple accept="image/*" style={{ display: 'none' }} onChange={e => handleImageChange(e)} />
          </label>

          {images.length > 0 && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))', gap: 10, marginBottom: 16 }}>
              {images.map((img) => (
                <div key={img.ma_hinh_anh} style={{ border: img.la_anh_chinh === 1 ? '2px solid #3C7363' : '1px solid #e8f5f1', borderRadius: 8, overflow: 'hidden' }}>
                  <div style={{ aspectRatio: '4/3', overflow: 'hidden', background: '#f0f7f5' }}>
                    <img src={img.file ? img.url : `${BASE_URL}${img.url}`} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  </div>
                  <div style={{ padding: '6px 8px', background: '#fff', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    {img.la_anh_chinh !== 1 ? (
                      <button type="button" onClick={() => handleSetMain(img.ma_hinh_anh)} style={{ fontSize: 11, padding: '2px 6px', background: '#e8f5f1', color: '#3C7363', border: 'none', borderRadius: 4, cursor: 'pointer' }}>★ Đại diện</button>
                    ) : (
                      <span style={{ fontSize: 11, color: '#3C7363', fontWeight: 600 }}>★ Chính</span>
                    )}
                    <button type="button" onClick={() => handleRemoveImage(img.ma_hinh_anh)} style={{ fontSize: 13, background: 'none', border: 'none', cursor: 'pointer', color: '#e05c5c' }}>🗑️</button>
                  </div>
                </div>
              ))}
            </div>
          )}

          <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', borderTop: '1px solid #eee', paddingTop: 20 }}>
            <button type="button" style={{ background: '#f5f5f5', border: 'none', padding: '10px 20px', borderRadius: '8px', cursor: 'pointer', fontWeight: 600 }} onClick={onClose}>Hủy</button>
            <button type="submit" style={{ background: '#3C7363', color: '#fff', border: 'none', padding: '10px 20px', borderRadius: '8px', cursor: 'pointer', fontWeight: 600 }} disabled={saving}>
              {saving ? 'Đang lưu...' : isEdit ? '💾 Lưu thay đổi' : '➕ Tạo loại phòng'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default RoomFormModal;