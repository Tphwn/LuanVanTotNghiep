import { useState, useRef, useEffect } from 'react';
const RoomFormModal = ({ amenities, myHotels, defaultHotelId, onClose, onSubmit, loading, initialData }) => {
  const fileInputRef = useRef(null);
  const [form, setForm] = useState({
    ma_khach_san: defaultHotelId || '',
    ten_loai: '', dien_tich: '', gia_co_ban: '', so_giuong: 1, 
    suc_chua: 2, so_luong_phong: 1, tien_nghi_ids: [], mo_ta: '', file: null
  });

  useEffect(() => {
    if (initialData) {
      setForm({
        ma_khach_san: initialData.ma_khach_san || defaultHotelId || '',
        ten_loai: initialData.ten_loai || '',
        dien_tich: initialData.dien_tich || '',
        gia_co_ban: initialData.gia_co_ban || '',
        so_giuong: initialData.so_giuong || 1,
        suc_chua: initialData.suc_chua || 2,
        so_luong_phong: initialData.so_luong_phong || 1,
        tien_nghi_ids: initialData.loai_phong_tien_nghi?.map(x => x.ma_tien_nghi) || [],
        mo_ta: initialData.mo_ta || '',
        file: null,
      });
      return;
    }

    if (defaultHotelId) {
      setForm(prev => ({ ...prev, ma_khach_san: defaultHotelId }));
      return;
    }

    if (!form.ma_khach_san && myHotels?.length === 1) {
      setForm(prev => ({ ...prev, ma_khach_san: myHotels[0].ma_khach_san }));
    }
  }, [initialData, defaultHotelId, myHotels]);

  const handleChange = (field, value) => {
    setForm(prev => ({ ...prev, [field]: value }));
  };

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setForm(prev => ({ ...prev, file: e.target.files[0] }));
    }
  };

  const toggleAmenity = (id) => {
    setForm(prev => ({
      ...prev,
      tien_nghi_ids: prev.tien_nghi_ids.includes(id)
        ? prev.tien_nghi_ids.filter(x => x !== id)
        : [...prev.tien_nghi_ids, id],
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (form.dien_tich < 0 || form.gia_co_ban < 0 || form.so_giuong < 0 || form.suc_chua < 0 || form.so_luong_phong < 0) {
      return alert('Các thông số phòng, diện tích và giá phải lớn hơn hoặc bằng 0');
    }
    if (!form.ten_loai.trim()) return alert('Nhập tên loại phòng');
    if (!form.gia_co_ban) return alert('Nhập giá cơ bản');
    
    // Gửi dữ liệu đi
    onSubmit(form);
  };

  // Styles đồng bộ với dự án
  const inputStyle = { width: '100%', padding: '9px 12px', border: '1px solid #d4ede6', borderRadius: 8, fontSize: 14, outline: 'none', boxSizing: 'border-box' };
  const labelStyle = { display: 'block', fontSize: 13, fontWeight: 500, marginBottom: 6, color: '#1a2e28' };
  const cardStyle = { background: '#fff', border: '1px solid #eef2f1', borderRadius: 12, padding: '20px', marginBottom: '20px' };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-box" style={{ maxWidth: 1000, padding: 0, overflow: 'hidden' }} onClick={e => e.stopPropagation()}>
        <div className="modal-header" style={{ padding: '20px 24px', borderBottom: '1px solid #eee' }}>
          <h3 className="modal-title" style={{ margin: 0 }}>🛏️ Thiết lập phòng mới</h3>
          <button className="modal-close" onClick={onClose}>×</button>
        </div>

        <form onSubmit={handleSubmit} style={{ padding: 24 }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: 24 }}>
            
            {/* CỘT TRÁI */}
            <div className="left-col">
              <div style={cardStyle}>
                <h4 style={{ margin: '0 0 15px 0', fontSize: 16 }}>Thông tin cơ bản</h4>
                <div>
                    <label style={labelStyle}>Chọn khách sạn *</label>
                    <select 
                style={inputStyle} 
                value={form.ma_khach_san || ''} 
                onChange={e => handleChange('ma_khach_san', e.target.value)}
            >
                <option value="">-- Chọn khách sạn --</option>
                {/* Thêm || [] để tránh lỗi crash nếu chưa tải xong dữ liệu */}
                {(myHotels || []).map(h => (
                <option key={h.ma_khach_san} value={h.ma_khach_san}>
                    {h.ten}
                </option>
                ))}
            </select>
                    </div>
                <div style={{ marginBottom: 12 }}>
                  <label style={labelStyle}>Tên hiển thị loại phòng *</label>
                  <input style={inputStyle} value={form.ten_loai} onChange={e => handleChange('ten_loai', e.target.value)} placeholder="VD: Phòng Superior" />
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 15 }}>
                  <div>
                    <label style={labelStyle}>Diện tích phòng (m²)</label>
                    <input type="number" min="0" style={inputStyle} value={form.dien_tich} onChange={e => handleChange('dien_tich', e.target.value)} />
                  </div>
                  <div>
                    <label style={labelStyle}>Giá niêm yết/đêm (đ)</label>
                    <input type="number" min="0" style={inputStyle} value={form.gia_co_ban} onChange={e => handleChange('gia_co_ban', e.target.value)} />
                  </div>
                </div>
              </div>

              <div style={cardStyle}>
                <h4 style={{ margin: '0 0 15px 0', fontSize: 16 }}>Cấu hình & Tiện nghi</h4>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 15, marginBottom: 20 }}>
                  <div><label style={labelStyle}>Số giường</label><input type="number" min="1" style={inputStyle} value={form.so_giuong} onChange={e => handleChange('so_giuong', e.target.value)} /></div>
                  <div><label style={labelStyle}>Khách tối đa</label><input type="number" min="1" style={inputStyle} value={form.suc_chua} onChange={e => handleChange('suc_chua', e.target.value)} /></div>
                  <div><label style={labelStyle}>Tổng số phòng</label><input type="number" min="1" style={inputStyle} value={form.so_luong_phong} onChange={e => handleChange('so_luong_phong', e.target.value)} /></div>
                </div>

                <label style={labelStyle}>Tiện nghi có sẵn (Tick chọn)</label>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, padding: 12, background: '#f8fdfb', borderRadius: 8, border: '1px solid #d4ede6' }}>
                  {amenities.map(a => {
                    const checked = form.tien_nghi_ids.includes(a.ma_tien_nghi);
                    return (
                      <button type="button" key={a.ma_tien_nghi} onClick={() => toggleAmenity(a.ma_tien_nghi)}
                        style={{ padding: '6px 12px', borderRadius: 20, border: checked ? 'none' : '1px solid #d4ede6', background: checked ? '#3C7363' : '#fff', color: checked ? '#fff' : '#334155', fontSize: 13, cursor: 'pointer' }}>
                        {a.bieu_tuong} {a.ten}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* CỘT PHẢI */}
            <div className="right-col">
              <div style={cardStyle}>
                <h4 style={{ margin: '0 0 15px 0', fontSize: 16 }}>Hình ảnh minh họa</h4>
                <div style={{ border: '2px dashed #d4ede6', borderRadius: 12, padding: 40, display: 'flex', flexDirection: 'column', alignItems: 'center', background: '#fafafa' }}>
                  <input type="file" ref={fileInputRef} hidden accept="image/*" onChange={handleFileChange} />
                  <span style={{ fontSize: 30, marginBottom: 10 }}>{form.file ? '✅' : '☁️'}</span>
                  <p style={{ fontSize: 12, color: '#666', textAlign: 'center', wordBreak: 'break-all' }}>
                    {form.file ? form.file.name : 'Tải lên ảnh phòng chất lượng cao'}
                  </p>
                  <button type="button" className="btn btn-outline" style={{ marginTop: 10, fontSize: 12 }} onClick={() => fileInputRef.current.click()}>
                    CHỌN FILE ẢNH
                  </button>
                </div>
              </div>
              
              <button type="submit" className="btn btn-primary" style={{ width: '100%', padding: '12px' }} disabled={loading}>
                {loading ? 'Đang lưu...' : 'HOÀN TẤT & LƯU PHÒNG'}
              </button>
              <button type="button" className="btn btn-ghost" style={{ width: '100%', marginTop: 10 }} onClick={onClose}>QUAY LẠI</button>
            </div>

          </div>
        </form>
      </div>
    </div>
  );
};

export default RoomFormModal;