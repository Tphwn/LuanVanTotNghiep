import { useState, useRef } from 'react';
import { X, Star } from 'lucide-react';
import api from '../../../services/api';
import AmenityRequestStatus from '../../../components/partner/AmenityRequestStatus';
import { resolveUploadUrl } from '../../../utils/media';
import { RoomAmenityPicker } from './components/RoomAmenityGroups';

const MAX_ROOM_IMAGES = 30;

const isMainImage = (img) => img.la_anh_chinh === 1 || img.la_anh_chinh === true;

const buildRoomContextTag = (roomId, roomName) => {
  const name = (roomName || '').trim();
  if (roomId) return `[loại phòng:${roomId}:${name}]`;
  return `[loại phòng:moi:${name}]`;
};

const RoomFormContent = ({ room, hotelId, amenities, onClose, onSuccess }) => {
  const isEdit = !!room;
  const [form, setForm] = useState(isEdit ? {
    ten_loai: room.ten_loai,
    dien_tich: room.dien_tich || '',
    suc_chua: room.suc_chua,
    so_luong_phong: room.so_luong_phong,
    gia_co_ban: room.gia_co_ban,
    so_giuong: room.so_giuong || 1,
    tien_nghi_ids: room.loai_phong_tien_nghi?.map((x) => x.ma_tien_nghi) || [],
  } : {
    ten_loai: '',
    dien_tich: '',
    suc_chua: 2,
    so_luong_phong: 1,
    gia_co_ban: '',
    so_giuong: 1,
    tien_nghi_ids: [],
  });

  const [images, setImages] = useState(
    isEdit
      ? (room.hinh_anh || []).map((img) => ({
        ...img,
        la_anh_chinh: img.la_anh_chinh ? 1 : 0,
      }))
      : [],
  );
  const [removedImageIds, setRemovedImageIds] = useState([]);
  const [saving, setSaving] = useState(false);
  const [requestRefresh, setRequestRefresh] = useState(0);
  const [showPropose, setShowPropose] = useState(false);
  const [proposeForm, setProposeForm] = useState({ ten_de_xuat: '' });
  const [toast, setToast] = useState(null);
  const fileRef = useRef();

  const showToast = (msg, type = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  const toggleAmenity = (id) => {
    setForm((prev) => ({
      ...prev,
      tien_nghi_ids: prev.tien_nghi_ids.includes(id)
        ? prev.tien_nghi_ids.filter((x) => x !== id)
        : [...prev.tien_nghi_ids, id],
    }));
  };

  const handlePropose = async () => {
    if (!proposeForm.ten_de_xuat.trim()) return alert('Nhập tên tiện nghi đề xuất');
    const roomName = form.ten_loai?.trim();
    if (!roomName) return alert('Vui lòng nhập tên loại phòng trước khi gửi đề xuất');
    try {
      const contextTag = buildRoomContextTag(room?.ma_loai_phong, roomName);
      await api.post('/amenities/requests', {
        ten_de_xuat: proposeForm.ten_de_xuat.trim(),
        loai_de_xuat: 'phong',
        mo_ta: `${contextTag} Đối tác yêu cầu tiện nghi cho loại phòng này`,
      });
      showToast('Đã gửi đề xuất! Bạn sẽ nhận thông báo khi admin duyệt hoặc từ chối.');
      setProposeForm({ ten_de_xuat: '' });
      setShowPropose(false);
      setRequestRefresh((k) => k + 1);
    } catch (err) {
      showToast(err.response?.data?.message || 'Gửi đề xuất thất bại', 'error');
    }
  };

  const handleImageChange = (e) => {
    const files = Array.from(e.target.files);
    if (files.length === 0) return;

    const remaining = Math.max(0, MAX_ROOM_IMAGES - images.length);
    if (remaining === 0) {
      alert(`Tối đa ${MAX_ROOM_IMAGES} ảnh mỗi loại phòng`);
      e.target.value = '';
      return;
    }

    const accepted = files.slice(0, remaining);
    if (accepted.length < files.length) {
      alert(`Chỉ thêm được ${remaining} ảnh nữa (tối đa ${MAX_ROOM_IMAGES} ảnh)`);
    }

    const newImages = accepted.map((file, idx) => ({
      ma_hinh_anh: `new-${Date.now()}-${idx}`,
      url: URL.createObjectURL(file),
      file,
      la_anh_chinh: images.length === 0 && idx === 0 ? 1 : 0,
    }));
    setImages((prev) => [...prev, ...newImages]);
    e.target.value = '';
  };

  const handleRemoveImage = (id) => {
    const img = images.find((i) => i.ma_hinh_anh === id);
    if (img && !img.file && typeof img.ma_hinh_anh === 'number') {
      setRemovedImageIds((prev) => [...prev, img.ma_hinh_anh]);
    }
    const wasMain = isMainImage(img);
    setImages((prev) => {
      const next = prev.filter((i) => i.ma_hinh_anh !== id);
      if (wasMain && next.length > 0) {
        return next.map((item, idx) => ({ ...item, la_anh_chinh: idx === 0 ? 1 : 0 }));
      }
      return next;
    });
  };

  const handleSetMain = (id) => {
    setImages((prev) => prev.map((img) => ({
      ...img,
      la_anh_chinh: img.ma_hinh_anh === id ? 1 : 0,
    })));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.ten_loai?.trim()) return alert('Nhập tên loại phòng');
    if (!form.gia_co_ban) return alert('Nhập giá cơ bản');
    if (images.length === 0) return alert('Vui lòng chọn ít nhất 1 ảnh phòng');
    if (images.length > MAX_ROOM_IMAGES) {
      return alert(`Tối đa ${MAX_ROOM_IMAGES} ảnh mỗi loại phòng`);
    }

    const formData = new FormData();
    formData.append('ma_khach_san', hotelId);
    formData.append('ten_loai', form.ten_loai);
    formData.append('gia_co_ban', Number(form.gia_co_ban));
    if (form.dien_tich) formData.append('dien_tich', Number(form.dien_tich));
    formData.append('suc_chua', Number(form.suc_chua));
    formData.append('so_luong_phong', Number(form.so_luong_phong));
    formData.append('so_giuong', Number(form.so_giuong));
    formData.append('mo_ta', '');
    formData.append('tien_nghi_ids', JSON.stringify(form.tien_nghi_ids));

    if (removedImageIds.length > 0) {
      formData.append('removedImageIds', JSON.stringify(removedImageIds));
    }

    const newFiles = images.filter((img) => img.file);
    let mainNewIndex = -1;
    newFiles.forEach((img, idx) => {
      formData.append('images', img.file);
      if (isMainImage(img)) mainNewIndex = idx;
    });

    const mainExisting = images.find((img) => !img.file && isMainImage(img));
    if (mainExisting) formData.append('mainImageId', mainExisting.ma_hinh_anh);
    if (mainNewIndex >= 0) formData.append('mainNewIndex', mainNewIndex);
    if (!isEdit && newFiles.length > 0 && mainNewIndex === -1) {
      formData.append('mainImageIndex', 0);
    }

    setSaving(true);
    try {
      if (isEdit) {
        await api.put(`/partner/rooms/${room.ma_loai_phong}`, formData);
        showToast('Cập nhật thành công!');
      } else {
        await api.post('/partner/rooms', formData);
        showToast('Tạo loại phòng thành công!');
      }
      setTimeout(() => { onSuccess(); onClose(); }, 1000);
    } catch (err) {
      const msg = err.response?.data?.message || err.message || 'Lỗi lưu dữ liệu';
      showToast(msg, 'error');
    } finally {
      setSaving(false);
    }
  };

  const inputSt = {
    width: '100%',
    padding: '9px 12px',
    border: '1px solid #d4ede6',
    borderRadius: 8,
    fontSize: 14,
    outline: 'none',
    fontFamily: 'inherit',
    boxSizing: 'border-box',
  };
  const labelSt = { display: 'block', fontSize: 13, fontWeight: 500, marginBottom: 6, color: '#1a2e28' };

  const roomContextName = form.ten_loai?.trim() || room?.ten_loai || '';

  return (
    <div>
      {toast && (
        <div style={{
          position: 'sticky',
          top: 0,
          zIndex: 10,
          padding: '10px 14px',
          borderRadius: 8,
          marginBottom: 12,
          background: toast.type === 'success' ? '#e8f5f1' : '#fff0f0',
          border: `1px solid ${toast.type === 'success' ? '#8FD9C4' : '#ffb3b3'}`,
          color: toast.type === 'success' ? '#3C7363' : '#e05c5c',
          fontSize: 13,
          fontWeight: 500,
        }}
        >
          {toast.msg}
        </div>
      )}

      <form onSubmit={handleSubmit}>
        <h4 style={{ fontSize: 13, fontWeight: 600, color: '#3C7363', marginBottom: 12, textTransform: 'uppercase' }}>
          Thông tin cơ bản
        </h4>

        <div style={{ marginBottom: 12 }}>
          <label style={labelSt}>
            Tên loại phòng
            {' '}
            <span style={{ color: '#e05c5c' }}>*</span>
          </label>
          <input
            style={inputSt}
            placeholder="VD: Phòng Deluxe, Suite Ocean View..."
            value={form.ten_loai}
            onChange={(e) => setForm({ ...form, ten_loai: e.target.value })}
          />
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12, marginBottom: 12 }}>
          <div>
            <label style={labelSt}>Diện tích (m²)</label>
            <input
              type="number"
              style={inputSt}
              placeholder="25"
              value={form.dien_tich}
              onChange={(e) => setForm({ ...form, dien_tich: e.target.value })}
            />
          </div>
          <div>
            <label style={labelSt}>
              Sức chứa (khách)
              {' '}
              <span style={{ color: '#e05c5c' }}>*</span>
            </label>
            <input
              type="number"
              min={1}
              style={inputSt}
              value={form.suc_chua}
              onChange={(e) => setForm({ ...form, suc_chua: e.target.value })}
            />
          </div>
          <div>
            <label style={labelSt}>Số giường</label>
            <select
              style={inputSt}
              value={form.so_giuong}
              onChange={(e) => setForm({ ...form, so_giuong: e.target.value })}
            >
              {[1, 2, 3, 4].map((n) => <option key={n} value={n}>{n} giường</option>)}
            </select>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 12 }}>
          <div>
            <label style={labelSt}>
              Số lượng phòng
              {' '}
              <span style={{ color: '#e05c5c' }}>*</span>
            </label>
            <input
              type="number"
              min={1}
              style={inputSt}
              value={form.so_luong_phong}
              onChange={(e) => setForm({ ...form, so_luong_phong: e.target.value })}
            />
            <p style={{ margin: '4px 0 0', fontSize: 11, color: '#888' }}>
              Tất cả phòng sẽ được mở bán ngay khi tạo loại phòng
            </p>
          </div>
          <div>
            <label style={labelSt}>
              Giá cơ bản (VNĐ/đêm)
              {' '}
              <span style={{ color: '#e05c5c' }}>*</span>
            </label>
            <input
              type="number"
              min={0}
              style={inputSt}
              placeholder="500000"
              value={form.gia_co_ban}
              onChange={(e) => setForm({ ...form, gia_co_ban: e.target.value })}
            />
          </div>
        </div>

        <AmenityRequestStatus
          loaiFilter="phong"
          refreshKey={requestRefresh}
          contextId={room?.ma_loai_phong || null}
          contextName={roomContextName}
        />

        <div style={{ marginBottom: 16 }}>
          <label style={labelSt}>Tiện nghi loại phòng</label>
          <RoomAmenityPicker
            amenities={amenities}
            selectedIds={form.tien_nghi_ids}
            onToggle={toggleAmenity}
          />
          <button
            type="button"
            className="btn btn-ghost btn-sm"
            style={{ marginTop: 8 }}
            onClick={() => setShowPropose(!showPropose)}
          >
            {showPropose ? 'Ẩn phần đề xuất' : 'Đề xuất tiện nghi mới'}
          </button>
          {showPropose && (
            <div style={{
              marginTop: 8,
              padding: 12,
              background: '#fff8e6',
              borderRadius: 8,
              border: '1px solid #fac775',
              display: 'flex',
              gap: 8,
            }}
            >
              <input
                className="search-input"
                style={{ flex: 2 }}
                placeholder="Tên tiện nghi *"
                value={proposeForm.ten_de_xuat}
                onChange={(e) => setProposeForm({ ten_de_xuat: e.target.value })}
              />
              <button type="button" className="btn btn-primary btn-sm" onClick={handlePropose}>
                Gửi đề xuất
              </button>
            </div>
          )}
        </div>

        <h4 style={{ fontSize: 13, fontWeight: 600, color: '#3C7363', marginBottom: 10, textTransform: 'uppercase' }}>
          Hình ảnh loại phòng
          {' '}
          <span style={{ fontWeight: 400, color: '#888', textTransform: 'none' }}>
            ({images.length}/{MAX_ROOM_IMAGES})
          </span>
        </h4>
        <label style={{
          display: 'block',
          position: 'relative',
          border: '2px dashed #8FD9C4',
          borderRadius: 10,
          padding: '20px',
          textAlign: 'center',
          cursor: images.length >= MAX_ROOM_IMAGES ? 'not-allowed' : 'pointer',
          background: '#f8fdfb',
          marginBottom: 12,
          opacity: images.length >= MAX_ROOM_IMAGES ? 0.6 : 1,
        }}
        >
          <div style={{ fontSize: 13, color: '#3C7363', fontWeight: 500 }}>Kéo thả hoặc click để chọn ảnh</div>
          <div style={{ fontSize: 12, color: '#5a7a72' }}>
            Hỗ trợ JPG, PNG (Tối đa {MAX_ROOM_IMAGES} ảnh)
          </div>
          <input
            ref={fileRef}
            type="file"
            multiple
            accept="image/*"
            style={{ display: 'none' }}
            disabled={images.length >= MAX_ROOM_IMAGES}
            onChange={(e) => handleImageChange(e)}
          />
        </label>

        {images.length > 0 && (
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))',
            gap: 10,
            marginBottom: 16,
          }}
          >
            {images.map((img) => (
              <div
                key={img.ma_hinh_anh}
                style={{
                  border: isMainImage(img) ? '2px solid #3C7363' : '1px solid #e8f5f1',
                  borderRadius: 8,
                  overflow: 'hidden',
                  background: '#fff',
                }}
              >
                <div style={{ aspectRatio: '4/3', overflow: 'hidden', background: '#f0f7f5', position: 'relative' }}>
                  <img
                    src={img.file ? img.url : resolveUploadUrl(img.url)}
                    alt=""
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                  />
                  <button
                    type="button"
                    onClick={() => handleRemoveImage(img.ma_hinh_anh)}
                    title="Xóa ảnh"
                    style={{
                      position: 'absolute',
                      top: 6,
                      right: 6,
                      width: 26,
                      height: 26,
                      borderRadius: '50%',
                      background: 'rgba(0,0,0,0.6)',
                      border: 'none',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: '#fff',
                    }}
                  >
                    <X size={14} />
                  </button>
                </div>
                {!isMainImage(img) && (
                  <div style={{ padding: '6px', display: 'flex', justifyContent: 'center' }}>
                    <button
                      type="button"
                      onClick={() => handleSetMain(img.ma_hinh_anh)}
                      title="Đặt làm ảnh đại diện"
                      style={{
                        width: 32,
                        height: 32,
                        borderRadius: 8,
                        border: '1px solid #d4ede6',
                        background: '#f8fdfb',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: '#3C7363',
                      }}
                    >
                      <Star size={16} />
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        <div style={{
          display: 'flex',
          gap: 10,
          justifyContent: 'flex-end',
          borderTop: '1px solid #eee',
          paddingTop: 20,
        }}
        >
          <button
            type="button"
            style={{
              background: '#f5f5f5',
              border: 'none',
              padding: '10px 20px',
              borderRadius: '8px',
              cursor: 'pointer',
              fontWeight: 600,
            }}
            onClick={onClose}
          >
            Hủy
          </button>
          <button
            type="submit"
            style={{
              background: '#3C7363',
              color: '#fff',
              border: 'none',
              padding: '10px 20px',
              borderRadius: '8px',
              cursor: 'pointer',
              fontWeight: 600,
            }}
            disabled={saving}
          >
            {saving ? 'Đang lưu...' : isEdit ? 'Lưu thay đổi' : 'Tạo loại phòng'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default RoomFormContent;
