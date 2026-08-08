import { useState, useRef } from 'react';
import { X, Star, Megaphone, Plus, Trash2 } from 'lucide-react';
import api from '../../../services/api';
import { resolveUploadUrl } from '../../../utils/media';
import { formatNumber } from '../../../utils/formatCurrency';
import {
  BED_TYPE_OPTIONS,
  getBedSleepCapacity,
  bedsToRows,
  rowsToBeds,
  validateBedsByCapacity,
} from '../../../utils/bedDisplay';
import { RoomAmenityPicker } from './components/RoomAmenityGroups';
import PartnerRoomSubmitConfirmModal from './components/PartnerRoomSubmitConfirmModal';

const MAX_ROOM_IMAGES = 30;
const MAX_BED_PER_TYPE = 10;

const parsePriceInput = (value) => Number(String(value || '').replace(/\./g, '').replace(/\D/g, '') || 0);

const formatPriceInput = (value) => {
  const digits = String(value || '').replace(/\D/g, '');
  if (!digits) return '';
  return formatNumber(digits);
};

const isMainImage = (img) => img.la_anh_chinh === 1 || img.la_anh_chinh === true;

const buildRoomContextTag = (roomId, roomName) => {
  const name = (roomName || '').trim();
  if (roomId) return `[loại phòng:${roomId}:${name}]`;
  return `[loại phòng:moi:${name}]`;
};

const defaultBeds = (room) => {
  if (!room) {
    return { so_giuong_don: 0, so_giuong_doi: 1, so_giuong_lon: 0 };
  }
  if (
    room.so_giuong_don != null
    || room.so_giuong_doi != null
    || room.so_giuong_lon != null
  ) {
    return {
      so_giuong_don: Number(room.so_giuong_don) || 0,
      so_giuong_doi: Number(room.so_giuong_doi) || 0,
      so_giuong_lon: Number(room.so_giuong_lon) || 0,
    };
  }
  return {
    so_giuong_don: 0,
    so_giuong_doi: Number(room.so_giuong) || 1,
    so_giuong_lon: 0,
  };
};

const nextBedRowId = () => `bed-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;

const RoomFormContent = ({ room, hotelId, amenities, onClose, onSuccess }) => {
  const isEdit = !!room;
  const initialBeds = defaultBeds(isEdit ? room : null);
  const [form, setForm] = useState(isEdit ? {
    ten_loai: room.ten_loai,
    dien_tich: room.dien_tich || '',
    so_nguoi_lon: room.suc_chua ?? '',
    so_tre_em: '',
    so_luong_phong: room.so_luong_phong,
    gia_co_ban: room.gia_co_ban ? formatPriceInput(room.gia_co_ban) : '',
    tien_nghi_ids: room.loai_phong_tien_nghi?.map((x) => x.ma_tien_nghi) || [],
  } : {
    ten_loai: '',
    dien_tich: '',
    so_nguoi_lon: '',
    so_tre_em: '',
    so_luong_phong: '',
    gia_co_ban: '',
    tien_nghi_ids: [],
  });
  const [bedRows, setBedRows] = useState(() => bedsToRows(initialBeds, { stamp: 'init' }));

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
  const [showPropose, setShowPropose] = useState(false);
  const [proposeForm, setProposeForm] = useState({ ten_de_xuat: '' });
  const [toast, setToast] = useState(null);
  const [formAlert, setFormAlert] = useState('');
  const [fieldErrors, setFieldErrors] = useState({});
  const [showSubmitConfirm, setShowSubmitConfirm] = useState(false);
  const fileRef = useRef();

  const showToast = (msg, type = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3500);
  };

  const updateField = (name, value) => {
    setForm((prev) => ({ ...prev, [name]: value }));
    setFieldErrors((prev) => ({ ...prev, [name]: undefined, so_giuong: undefined }));
    if (formAlert) setFormAlert('');
  };

  const clearBedError = () => {
    setFieldErrors((prev) => ({ ...prev, so_giuong: undefined, so_nguoi_lon: undefined }));
    if (formAlert) setFormAlert('');
  };

  const syncAdultsToBedCap = (nextRows) => {
    const cap = getBedSleepCapacity(rowsToBeds(nextRows));
    setForm((prev) => {
      const adults = Number(prev.so_nguoi_lon);
      if (!prev.so_nguoi_lon || Number.isNaN(adults)) return prev;
      if (cap > 0 && adults > cap) {
        return { ...prev, so_nguoi_lon: cap };
      }
      return prev;
    });
  };

  const updateBedRow = (id, patch) => {
    setBedRows((prev) => {
      const next = prev.map((row) => (row.id === id ? { ...row, ...patch } : row));
      syncAdultsToBedCap(next);
      return next;
    });
    clearBedError();
  };

  const addBedRow = () => {
    const used = new Set(bedRows.map((r) => r.type));
    const nextType = BED_TYPE_OPTIONS.find((o) => !used.has(o.type))?.type;
    if (!nextType) return;
    setBedRows((prev) => {
      const next = [...prev, { id: nextBedRowId(), type: nextType, qty: 1 }];
      syncAdultsToBedCap(next);
      return next;
    });
    clearBedError();
  };

  const removeBedRow = (id) => {
    setBedRows((prev) => {
      if (prev.length <= 1) return prev;
      const next = prev.filter((row) => row.id !== id);
      syncAdultsToBedCap(next);
      return next;
    });
    clearBedError();
  };

  const applyValidationErrors = (errors) => {
    setFieldErrors(errors);
    const message = isEdit
      ? 'Cập nhật không thành công. Vui lòng kiểm tra và sửa các thông tin chưa đúng hoặc còn thiếu.'
      : 'Thêm loại phòng không thành công. Vui lòng điền đầy đủ và đúng thông tin.';
    setFormAlert(message);
  };

  const mapServerMessageToField = (message) => {
    if (!message) return {};
    if (message.includes('Tên loại')) return { ten_loai: message };
    if (message.includes('Diện tích')) return { dien_tich: message };
    if (message.includes('Sức chứa') || message.includes('người lớn') || message.includes('Số khách')) {
      return { so_nguoi_lon: message };
    }
    if (message.includes('giường') || message.includes('Giường') || message.includes('Phòng đơn') || message.includes('Phòng đôi')) {
      return { so_giuong: message };
    }
    if (message.includes('Số lượng phòng')) return { so_luong_phong: message };
    if (message.includes('Giá cơ bản')) return { gia_co_ban: message };
    if (message.includes('ảnh')) return { images: message };
    return {};
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
    if (!proposeForm.ten_de_xuat.trim()) return showToast('Nhập tên tiện nghi đề xuất', 'error');
    const roomName = form.ten_loai?.trim();
    if (!roomName) return showToast('Vui lòng nhập tên loại phòng trước khi gửi đề xuất', 'error');
    try {
      const contextTag = buildRoomContextTag(room?.ma_loai_phong, roomName);
      await api.post('/amenities/requests', {
        ten_de_xuat: proposeForm.ten_de_xuat.trim(),
        loai_de_xuat: 'phong',
        mo_ta: `${contextTag} Đối tác yêu cầu tiện nghi cho loại phòng này`,
      });
      showToast('Đã gửi đề xuất! Admin sẽ nhận thông báo để xem xét thêm vào danh mục.');
      setProposeForm({ ten_de_xuat: '' });
      setShowPropose(false);
    } catch (err) {
      showToast(err.response?.data?.message || 'Gửi đề xuất thất bại', 'error');
    }
  };

  const handleImageChange = (e) => {
    const files = Array.from(e.target.files);
    if (files.length === 0) return;

    const remaining = Math.max(0, MAX_ROOM_IMAGES - images.length);
    if (remaining === 0) {
      showToast(`Tối đa ${MAX_ROOM_IMAGES} ảnh mỗi loại phòng`, 'error');
      e.target.value = '';
      return;
    }

    const accepted = files.slice(0, remaining);
    if (accepted.length < files.length) {
      showToast(`Chỉ thêm được ${remaining} ảnh nữa (tối đa ${MAX_ROOM_IMAGES} ảnh)`, 'error');
    }

    const newImages = accepted.map((file, idx) => ({
      ma_hinh_anh: `new-${Date.now()}-${idx}`,
      url: URL.createObjectURL(file),
      file,
      la_anh_chinh: images.length === 0 && idx === 0 ? 1 : 0,
    }));
    setImages((prev) => [...prev, ...newImages]);
    setFieldErrors((prev) => ({ ...prev, images: undefined }));
    if (formAlert) setFormAlert('');
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

  const validateForm = () => {
    const errors = {};
    const beds = rowsToBeds(bedRows);
    if (!form.ten_loai?.trim()) errors.ten_loai = 'Tên loại phòng là bắt buộc';
    if (form.dien_tich === '' || form.dien_tich === null || form.dien_tich === undefined) {
      errors.dien_tich = 'Diện tích là bắt buộc';
    } else {
      const dienTich = Number(form.dien_tich);
      if (Number.isNaN(dienTich) || dienTich < 10) errors.dien_tich = 'Diện tích phải từ 10 m² trở lên';
    }
    const types = bedRows.map((r) => r.type);
    if (new Set(types).size !== types.length) {
      errors.so_giuong = 'Mỗi loại giường chỉ được chọn một lần';
    } else if (beds.so_giuong < 1) {
      errors.so_giuong = 'Vui lòng chọn ít nhất 1 giường';
    }

    if (form.so_nguoi_lon === '' || form.so_nguoi_lon === null || form.so_nguoi_lon === undefined) {
      errors.so_nguoi_lon = 'Số người lớn là bắt buộc';
    } else {
      const adults = Number(form.so_nguoi_lon);
      if (Number.isNaN(adults) || adults < 1) {
        errors.so_nguoi_lon = 'Số người lớn phải từ 1 trở lên';
      } else if (!errors.so_giuong) {
        const bedErr = validateBedsByCapacity(adults, beds);
        if (bedErr) errors.so_nguoi_lon = bedErr;
      }
    }

    if (form.so_tre_em !== '' && form.so_tre_em != null) {
      const children = Number(form.so_tre_em);
      if (Number.isNaN(children) || children < 0) {
        errors.so_tre_em = 'Số trẻ em phải từ 0 trở lên';
      }
    }
    if (form.so_luong_phong === '' || form.so_luong_phong === null || form.so_luong_phong === undefined) {
      errors.so_luong_phong = 'Số lượng phòng là bắt buộc';
    } else {
      const soPhong = Number(form.so_luong_phong);
      if (Number.isNaN(soPhong) || soPhong < 1) errors.so_luong_phong = 'Số lượng phòng phải từ 1 trở lên';
    }
    if (!form.gia_co_ban) {
      errors.gia_co_ban = 'Giá cơ bản là bắt buộc';
    } else {
      const gia = parsePriceInput(form.gia_co_ban);
      if (!gia || gia < 100000) errors.gia_co_ban = 'Giá cơ bản phải từ 100.000 VNĐ trở lên';
    }
    if (images.length === 0) errors.images = 'Vui lòng chọn ít nhất 1 ảnh phòng';
    if (images.length > MAX_ROOM_IMAGES) errors.images = `Tối đa ${MAX_ROOM_IMAGES} ảnh mỗi loại phòng`;
    return errors;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const errors = validateForm();
    if (Object.keys(errors).length > 0) {
      applyValidationErrors(errors);
      return;
    }
    setFieldErrors({});
    setFormAlert('');
    setShowSubmitConfirm(true);
  };

  const submitForm = async () => {
    const errors = validateForm();
    if (Object.keys(errors).length > 0) {
      setShowSubmitConfirm(false);
      applyValidationErrors(errors);
      return;
    }

    const giaCoBan = parsePriceInput(form.gia_co_ban);
    const beds = rowsToBeds(bedRows);
    const formData = new FormData();
    formData.append('ma_khach_san', hotelId);
    formData.append('ten_loai', form.ten_loai.trim());
    formData.append('gia_co_ban', giaCoBan);
    formData.append('dien_tich', Number(form.dien_tich));
    formData.append('suc_chua', Number(form.so_nguoi_lon));
    formData.append('so_luong_phong', Number(form.so_luong_phong));
    formData.append('so_giuong', beds.so_giuong);
    formData.append('so_giuong_don', beds.so_giuong_don);
    formData.append('so_giuong_doi', beds.so_giuong_doi);
    formData.append('so_giuong_lon', beds.so_giuong_lon);
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
        setShowSubmitConfirm(false);
        setFormAlert('');
        showToast('Cập nhật loại phòng thành công!');
        setTimeout(() => { onSuccess(); onClose(); }, 1200);
      } else {
        await api.post('/partner/rooms', formData);
        setShowSubmitConfirm(false);
        setFormAlert('');
        showToast('Tạo loại phòng thành công!');
        setTimeout(() => { onSuccess(); onClose(); }, 1200);
      }
    } catch (err) {
      const msg = err.response?.data?.message || err.message || 'Lỗi lưu dữ liệu';
      const serverFieldErrors = mapServerMessageToField(msg);
      if (Object.keys(serverFieldErrors).length > 0) {
        setFieldErrors((prev) => ({ ...prev, ...serverFieldErrors }));
      }
      setFormAlert(isEdit
        ? `Cập nhật thất bại: ${msg}`
        : `Thêm loại phòng thất bại: ${msg}`);
      setShowSubmitConfirm(false);
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
  const inputStyle = (field) => ({
    ...inputSt,
    border: fieldErrors[field] ? '1px solid #ffb3b3' : inputSt.border,
  });
  const labelSt = { display: 'block', fontSize: 13, fontWeight: 500, marginBottom: 6, color: '#1a2e28' };
  const errSt = { margin: '4px 0 0', fontSize: 12, color: '#e05c5c' };
  const beds = rowsToBeds(bedRows);
  const bedSleepCap = getBedSleepCapacity(beds);
  const canAddBedRow = bedRows.length < BED_TYPE_OPTIONS.length;
  const adultsValue = form.so_nguoi_lon === '' ? null : Number(form.so_nguoi_lon);
  const adultsOverCap = (
    bedSleepCap > 0
    && adultsValue != null
    && !Number.isNaN(adultsValue)
    && adultsValue > bedSleepCap
  );

  return (
    <div>
      {formAlert && (
        <div className="mgmt-toast error" style={{ marginBottom: 12 }}>
          {formAlert}
        </div>
      )}

      {toast && (
        <div className={`mgmt-toast ${toast.type}`} style={{ marginBottom: 12 }}>
          {toast.msg}
        </div>
      )}

      <form onSubmit={handleSubmit} noValidate>
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
            style={inputStyle('ten_loai')}
            placeholder="VD: Phòng Deluxe, Suite Ocean View..."
            value={form.ten_loai}
            onChange={(e) => updateField('ten_loai', e.target.value)}
          />
          {fieldErrors.ten_loai && <p style={errSt}>{fieldErrors.ten_loai}</p>}
        </div>

        <div style={{ marginBottom: 12 }}>
          <label style={labelSt}>
            Diện tích (m²)
            {' '}
            <span style={{ color: '#e05c5c' }}>*</span>
          </label>
          <input
            type="number"
            style={inputStyle('dien_tich')}
            placeholder="25"
            value={form.dien_tich}
            onChange={(e) => updateField('dien_tich', e.target.value)}
          />
          {fieldErrors.dien_tich && <p style={errSt}>{fieldErrors.dien_tich}</p>}
        </div>

        <div style={{ marginBottom: 12 }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 12,
            marginBottom: 8,
          }}
          >
            <label style={{ ...labelSt, marginBottom: 0 }}>
              Cấu hình giường
              {' '}
              <span style={{ color: '#e05c5c' }}>*</span>
            </label>
            <button
              type="button"
              className="btn btn-outline btn-sm"
              onClick={addBedRow}
              disabled={!canAddBedRow}
              style={{ display: 'inline-flex', alignItems: 'center', gap: 6, opacity: canAddBedRow ? 1 : 0.5 }}
            >
              <Plus size={14} />
              Thêm loại giường
            </button>
          </div>

          <div style={{
            border: fieldErrors.so_giuong ? '1px solid #ffb3b3' : '1px solid #e5e7eb',
            borderRadius: 10,
            padding: '12px 14px',
            background: '#f8faf9',
          }}
          >
            <div style={{
              display: 'grid',
              gridTemplateColumns: '1fr 88px 36px',
              gap: 10,
              marginBottom: 8,
            }}
            >
              <span style={{ fontSize: 11, color: '#94a3b8', fontWeight: 500 }}>Loại giường</span>
              <span style={{ fontSize: 11, color: '#94a3b8', fontWeight: 500 }}>Số lượng</span>
              <span />
            </div>

            {bedRows.map((row) => {
              const usedByOthers = new Set(
                bedRows.filter((r) => r.id !== row.id).map((r) => r.type),
              );
              return (
                <div
                  key={row.id}
                  style={{
                    display: 'grid',
                    gridTemplateColumns: '1fr 88px 36px',
                    gap: 10,
                    alignItems: 'center',
                    marginBottom: 8,
                  }}
                >
                  <select
                    value={row.type}
                    onChange={(e) => updateBedRow(row.id, { type: e.target.value })}
                    style={{
                      ...inputSt,
                      background: '#fff',
                      height: 40,
                    }}
                  >
                    {BED_TYPE_OPTIONS.map((opt) => (
                      <option
                        key={opt.type}
                        value={opt.type}
                        disabled={usedByOthers.has(opt.type)}
                      >
                        {opt.label}
                      </option>
                    ))}
                  </select>
                  <input
                    type="number"
                    min={1}
                    max={MAX_BED_PER_TYPE}
                    value={row.qty}
                    onChange={(e) => {
                      const raw = e.target.value;
                      if (raw === '') {
                        updateBedRow(row.id, { qty: '' });
                        return;
                      }
                      const n = Math.min(MAX_BED_PER_TYPE, Math.max(1, Number(raw) || 1));
                      updateBedRow(row.id, { qty: n });
                    }}
                    style={{
                      ...inputSt,
                      background: '#fff',
                      height: 40,
                      textAlign: 'center',
                    }}
                  />
                  <button
                    type="button"
                    aria-label="Xóa loại giường"
                    onClick={() => removeBedRow(row.id)}
                    disabled={bedRows.length <= 1}
                    style={{
                      width: 36,
                      height: 36,
                      border: 'none',
                      background: 'transparent',
                      color: bedRows.length <= 1 ? '#cbd5e1' : '#94a3b8',
                      cursor: bedRows.length <= 1 ? 'not-allowed' : 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      borderRadius: 8,
                    }}
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              );
            })}

            <p style={{ margin: '4px 0 0', fontSize: 12, color: '#3C7363' }}>
              Sức chứa giường:
              {' '}
              <strong>
                {bedSleepCap}
                {' '}
                người lớn
              </strong>
              {' '}
              (đơn=1, đôi/lớn=2)
            </p>
          </div>

          {fieldErrors.so_giuong && <p style={errSt}>{fieldErrors.so_giuong}</p>}
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 12 }}>
          <div>
            <label style={labelSt}>
              Số người lớn tối đa
              {' '}
              <span style={{ color: '#e05c5c' }}>*</span>
            </label>
            <input
              type="number"
              min={1}
              max={bedSleepCap > 0 ? bedSleepCap : undefined}
              style={{
                ...inputStyle('so_nguoi_lon'),
                border: (fieldErrors.so_nguoi_lon || adultsOverCap) ? '1px solid #ffb3b3' : inputSt.border,
              }}
              placeholder={bedSleepCap > 0 ? `Tối đa ${bedSleepCap}` : 'Chọn giường trước'}
              value={form.so_nguoi_lon}
              onChange={(e) => {
                const raw = e.target.value;
                if (raw === '') {
                  updateField('so_nguoi_lon', '');
                  return;
                }
                const n = Math.floor(Number(raw) || 0);
                if (n < 1) {
                  updateField('so_nguoi_lon', '');
                  return;
                }
                if (bedSleepCap > 0 && n > bedSleepCap) {
                  updateField('so_nguoi_lon', bedSleepCap);
                  return;
                }
                updateField('so_nguoi_lon', n);
              }}
            />
            {(fieldErrors.so_nguoi_lon || adultsOverCap) && (
              <p style={errSt}>
                {fieldErrors.so_nguoi_lon
                  || `Số lượng giường không đủ đáp ứng cho ${adultsValue} khách. Vui lòng thêm giường hoặc giảm số khách tối đa.`}
              </p>
            )}
          </div>
          <div>
            <label style={labelSt}>Số trẻ em (tham khảo)</label>
            <input
              type="number"
              min={0}
              style={inputStyle('so_tre_em')}
              placeholder="0"
              value={form.so_tre_em}
              onChange={(e) => updateField('so_tre_em', e.target.value)}
            />
            {fieldErrors.so_tre_em && <p style={errSt}>{fieldErrors.so_tre_em}</p>}
            <p style={{ margin: '6px 0 0', fontSize: 11, color: '#888', lineHeight: 1.4 }}>
              Chỉ tham khảo khi khai báo — không lưu. Tìm phòng theo người lớn; trẻ em tính phụ thu khi đặt.
            </p>
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
              style={inputStyle('so_luong_phong')}
              value={form.so_luong_phong}
              onChange={(e) => updateField('so_luong_phong', e.target.value)}
            />
            {fieldErrors.so_luong_phong && <p style={errSt}>{fieldErrors.so_luong_phong}</p>}
            <p style={{
              margin: '6px 0 0',
              fontSize: 11,
              color: '#888',
              display: 'flex',
              alignItems: 'flex-start',
              gap: 6,
              lineHeight: 1.4,
            }}
            >
              <Megaphone size={14} style={{ flexShrink: 0, marginTop: 1, color: '#3C7363' }} aria-hidden />
              <span>Tất cả phòng sẽ được mở bán ngay khi tạo loại phòng</span>
            </p>
          </div>
          <div>
            <label style={labelSt}>
              Giá cơ bản (VNĐ/đêm)
              {' '}
              <span style={{ color: '#e05c5c' }}>*</span>
            </label>
            <input
              type="text"
              inputMode="numeric"
              style={inputStyle('gia_co_ban')}
              placeholder="500.000"
              value={form.gia_co_ban}
              onChange={(e) => updateField('gia_co_ban', formatPriceInput(e.target.value))}
            />
            {fieldErrors.gia_co_ban && <p style={errSt}>{fieldErrors.gia_co_ban}</p>}
          </div>
        </div>

        <div style={{ marginBottom: 16 }}>
          <label style={labelSt}>Tiện nghi loại phòng</label>
          <RoomAmenityPicker
            amenities={amenities}
            selectedIds={form.tien_nghi_ids}
            onToggle={toggleAmenity}
          />
          <button
            type="button"
            className="btn btn-outline btn-sm"
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
            (
            {images.length}
            /
            {MAX_ROOM_IMAGES}
            )
          </span>
        </h4>
        <label style={{
          display: 'block',
          position: 'relative',
          border: fieldErrors.images ? '2px dashed #ffb3b3' : '2px dashed #8FD9C4',
          borderRadius: 10,
          padding: '20px',
          textAlign: 'center',
          cursor: images.length >= MAX_ROOM_IMAGES ? 'not-allowed' : 'pointer',
          background: fieldErrors.images ? '#fff8f8' : '#f8fdfb',
          marginBottom: 12,
          opacity: images.length >= MAX_ROOM_IMAGES ? 0.6 : 1,
        }}
        >
          <div style={{ fontSize: 13, color: '#3C7363', fontWeight: 500 }}>Kéo thả hoặc click để chọn ảnh</div>
          <div style={{ fontSize: 12, color: '#5a7a72' }}>
            Hỗ trợ JPG, PNG (Tối đa
            {' '}
            {MAX_ROOM_IMAGES}
            {' '}
            ảnh)
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
        {fieldErrors.images && <p style={{ ...errSt, marginTop: -8, marginBottom: 12 }}>{fieldErrors.images}</p>}

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

        <div className="modal-actions">
          <button
            type="button"
            className="btn btn-ghost"
            onClick={onClose}
          >
            Hủy
          </button>
          <button
            type="submit"
            className="btn btn-primary"
            disabled={saving}
          >
            {saving ? 'Đang lưu...' : isEdit ? 'Lưu thay đổi' : 'Tạo loại phòng'}
          </button>
        </div>
      </form>

      {showSubmitConfirm && (
        <PartnerRoomSubmitConfirmModal
          isEdit={isEdit}
          roomName={form.ten_loai?.trim()}
          loading={saving}
          onClose={() => !saving && setShowSubmitConfirm(false)}
          onConfirm={submitForm}
        />
      )}
    </div>
  );
};

export default RoomFormContent;
