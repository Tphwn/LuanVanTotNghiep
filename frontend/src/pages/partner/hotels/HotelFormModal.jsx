import { useState } from 'react';
import api from '../../../services/api';
import { resolveUploadUrl } from '../../../utils/media';
import { HotelAmenityPicker } from './components/HotelAmenityGroups';
import PartnerHotelSubmitConfirmModal from './components/PartnerHotelSubmitConfirmModal';
import {
  REQUIRED_DOC_LABELS,
  parseGiayToBatBuoc,
  parseNoiQuyKhac,
  toMoneyString,
} from './hotelPolicyUtils';

const INIT_FORM = {
  ten: '', dia_chi: '', mo_ta: '',
  so_sao: 3, gio_nhan_phong: '14:00',
  gio_tra_phong: '12:00', ma_dia_diem: '',
  tien_nghi_ids: [],
  giay_to_bat_buoc: [],
  cho_phep_hut_thuoc: false,
  cho_phep_to_chuc_tiec: false,
  cho_phep_thu_cung: false,
  phu_thu_thu_cung: '',
  tuoi_toi_da_mien_phi: 6,
  phu_thu_tre_em: '',
  phan_tram_vat: 10,
  noi_quy_khac: [],
};

const MAX_HOTEL_IMAGES = 30;

const REQUIRED_DOC_OPTIONS = Object.entries(REQUIRED_DOC_LABELS).map(([id, label]) => ({ id, label }));

const formatTimeValue = (value) => {
  if (!value) return '14:00';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return '14:00';
  return d.toISOString().slice(11, 16);
};

const mapPolicies = (policies) =>
  (policies || []).map((p) => ({
    so_ngay_truoc: Number(p.so_ngay_truoc),
    phan_tram_hoan: Number(p.phan_tram_hoan),
  }));

const onlyDigits = (value) => String(value ?? '').replace(/[^\d]/g, '');

const formatThousands = (value) => {
  const digits = onlyDigits(value);
  return digits ? Number(digits).toLocaleString('vi-VN') : '';
};

const blurOnWheel = (e) => e.currentTarget.blur();

const HotelFormContent = ({
  hotel, diaDiem, amenities, defaultCancelPolicies,
  onClose, onSubmit, loading,
}) => {
  const isEdit = !!hotel;
  const needsApproval = !isEdit
    || ['cho_duyet', 'tu_choi', 'yeu_cau_sua'].includes(hotel?.trang_thai);
  const submitLabel = needsApproval ? 'Gửi duyệt' : 'Lưu thay đổi';
  const [activeTab, setActiveTab] = useState('info');
  const [removedImageIds, setRemovedImageIds] = useState([]);

  const [form, setForm] = useState(
    isEdit ? {
      ten: hotel.ten,
      dia_chi: hotel.dia_chi,
      mo_ta: hotel.mo_ta || '',
      so_sao: hotel.so_sao || 3,
      gio_nhan_phong: formatTimeValue(hotel.gio_nhan_phong),
      gio_tra_phong: formatTimeValue(hotel.gio_tra_phong),
      ma_dia_diem: hotel.ma_dia_diem || '',
      tien_nghi_ids: hotel.khach_san_tien_nghi?.map((x) => x.ma_tien_nghi) || [],
      giay_to_bat_buoc: parseGiayToBatBuoc(hotel.giay_to_bat_buoc),
      cho_phep_hut_thuoc: !!hotel.cho_phep_hut_thuoc,
      cho_phep_to_chuc_tiec: !!hotel.cho_phep_to_chuc_tiec,
      cho_phep_thu_cung: !!hotel.cho_phep_thu_cung,
      phu_thu_thu_cung: toMoneyString(hotel.phu_thu_thu_cung),
      tuoi_toi_da_mien_phi: hotel.tuoi_toi_da_mien_phi ?? 6,
      phu_thu_tre_em: toMoneyString(hotel.phu_thu_tre_em),
      phan_tram_vat: hotel.phan_tram_vat ?? 10,
      noi_quy_khac: parseNoiQuyKhac(hotel.noi_quy_khac),
    } : { ...INIT_FORM }
  );

  const [hotelImages, setHotelImages] = useState(
    isEdit
      ? (hotel.hinh_anh || []).map((img) => ({
        ...img,
        la_anh_chinh: img.la_anh_chinh ? 1 : 0,
      }))
      : []
  );

  // Quy định hoàn tiền là mặc định chung cho tất cả khách sạn — chỉ đọc
  const cancelPolicies = mapPolicies(defaultCancelPolicies);

  const [showPropose, setShowPropose] = useState(false);
  const [proposeForm, setProposeForm] = useState({ ten_de_xuat: '', mo_ta: ''});
  const [fieldErrors, setFieldErrors] = useState({});
  const [formAlert, setFormAlert] = useState('');
  const [toast, setToast] = useState(null);
  const [showSubmitConfirm, setShowSubmitConfirm] = useState(false);
  const [pendingPayload, setPendingPayload] = useState(null);
  const [confirmLoading, setConfirmLoading] = useState(false);

  const showToast = (msg, type = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3500);
  };

  const updateField = (name, value) => {
    setForm((prev) => ({ ...prev, [name]: value }));
    setFieldErrors((prev) => ({ ...prev, [name]: undefined }));
    if (formAlert) setFormAlert('');
  };

  const inputStyle = (field) => ({
    width: '100%',
    boxSizing: 'border-box',
    border: fieldErrors[field] ? '1px solid #ffb3b3' : undefined,
  });

  const errSt = { margin: '4px 0 0', fontSize: 12, color: '#e05c5c' };

  const validateForm = () => {
    const errors = {};
    if (!form.ten?.trim()) errors.ten = 'Vui lòng nhập tên khách sạn';
    if (!form.dia_chi?.trim()) errors.dia_chi = 'Vui lòng nhập địa chỉ cụ thể';
    if (!form.ma_dia_diem) errors.ma_dia_diem = 'Vui lòng chọn địa điểm khu vực';
    if (hotelImages.length === 0) errors.images = 'Vui lòng tải lên ít nhất 1 hình ảnh đại diện';
    if (hotelImages.length > MAX_HOTEL_IMAGES) {
      errors.images = `Tối đa ${MAX_HOTEL_IMAGES} ảnh mỗi khách sạn`;
    }
    return errors;
  };

  const applyValidationErrors = (errors) => {
    setFieldErrors(errors);
    const firstKey = Object.keys(errors)[0];
    if (['ten', 'dia_chi', 'ma_dia_diem'].includes(firstKey)) setActiveTab('info');
    else if (firstKey === 'images') setActiveTab('images');
    setFormAlert(
      needsApproval
        ? 'Gửi duyệt không thành công. Vui lòng điền đầy đủ thông tin bắt buộc.'
        : 'Cập nhật không thành công. Vui lòng kiểm tra và điền đầy đủ thông tin bắt buộc.',
    );
  };

  const toggleAmenity = (id) => {
    setForm((prev) => ({
      ...prev,
      tien_nghi_ids: prev.tien_nghi_ids.includes(id)
        ? prev.tien_nghi_ids.filter((x) => x !== id)
        : [...prev.tien_nghi_ids, id],
    }));
  };

  const toggleRequiredDoc = (docId) => {
    setForm((prev) => ({
      ...prev,
      giay_to_bat_buoc: prev.giay_to_bat_buoc.includes(docId)
        ? prev.giay_to_bat_buoc.filter((x) => x !== docId)
        : [...prev.giay_to_bat_buoc, docId],
    }));
  };

  const setRuleFlag = (key, checked) => {
    setForm((prev) => ({ ...prev, [key]: checked }));
  };

  const handleAddNoiQuy = () => {
    setForm((prev) => ({ ...prev, noi_quy_khac: [...prev.noi_quy_khac, ''] }));
  };

  const handleNoiQuyChange = (index, value) => {
    setForm((prev) => ({
      ...prev,
      noi_quy_khac: prev.noi_quy_khac.map((item, i) => (i === index ? value : item)),
    }));
  };

  const handleRemoveNoiQuy = (index) => {
    setForm((prev) => ({
      ...prev,
      noi_quy_khac: prev.noi_quy_khac.filter((_, i) => i !== index),
    }));
  };

  const handlePropose = async () => {
    if (!proposeForm.ten_de_xuat.trim()) return showToast('Nhập tên tiện nghi đề xuất', 'error');
    const hotelName = form.ten?.trim();
    if (!hotelName) return showToast('Vui lòng nhập tên khách sạn trước khi gửi đề xuất', 'error');
    try {
      const contextTag = hotel?.ma_khach_san
        ? `[khách sạn:${hotel.ma_khach_san}:${hotelName}]`
        : `[khách sạn:moi:${hotelName}]`;
      await api.post('/amenities/requests', {
        ten_de_xuat: proposeForm.ten_de_xuat.trim(),
        loai_de_xuat: 'khach_san',
        mo_ta: `${contextTag} ${proposeForm.mo_ta || 'Đối tác yêu cầu tiện nghi cho khách sạn này'}`,
      });
      showToast('Đã gửi đề xuất!');
      setProposeForm({ ten_de_xuat: '', mo_ta: ''});
      setShowPropose(false);
    } catch {
      showToast('Gửi đề xuất thất bại', 'error');
    }
  };

  const handleImageChange = (e) => {
    const files = Array.from(e.target.files);
    if (files.length === 0) return;

    const remaining = Math.max(0, MAX_HOTEL_IMAGES - hotelImages.length);
    if (remaining === 0) {
      showToast(`Tối đa ${MAX_HOTEL_IMAGES} ảnh mỗi khách sạn`, 'error');
      e.target.value = '';
      return;
    }

    const accepted = files.slice(0, remaining);
    if (files.length > remaining) {
      showToast(`Chỉ thêm được ${remaining} ảnh nữa (tối đa ${MAX_HOTEL_IMAGES} ảnh)`, 'error');
    }

    const newImages = accepted.map((file, idx) => ({
      ma_hinh_anh: `new-${Date.now()}-${idx}`,
      url: URL.createObjectURL(file),
      file,
      la_anh_chinh: hotelImages.length === 0 && idx === 0 ? 1 : 0,
    }));

    setHotelImages((prev) => [...prev, ...newImages]);
    setFieldErrors((prev) => ({ ...prev, images: undefined }));
    if (formAlert) setFormAlert('');
    e.target.value = '';
  };

  const handleRemoveImage = (id) => {
    const img = hotelImages.find((i) => i.ma_hinh_anh === id);
    if (img && !img.file && typeof img.ma_hinh_anh === 'number') {
      setRemovedImageIds((prev) => [...prev, img.ma_hinh_anh]);
    }
    setHotelImages((prev) => prev.filter((i) => i.ma_hinh_anh !== id));
  };

  const handleSetMainImage = (id) => {
    setHotelImages((prev) => prev.map((img) => ({
      ...img,
      la_anh_chinh: img.ma_hinh_anh === id ? 1 : 0,
    })));
  };

  const handleFormSubmit = (e) => {
    e.preventDefault();
    const errors = validateForm();
    if (Object.keys(errors).length > 0) {
      applyValidationErrors(errors);
      return;
    }
    setFieldErrors({});
    setFormAlert('');
    setPendingPayload({
      ...form,
      noi_quy_khac: form.noi_quy_khac.map((s) => s.trim()).filter(Boolean),
      hinh_anh: hotelImages,
      chinh_sach_huy: cancelPolicies,
      removedImageIds,
    });
    setShowSubmitConfirm(true);
  };

  const handleConfirmSubmit = async () => {
    if (!pendingPayload) return;
    setConfirmLoading(true);
    try {
      await onSubmit(pendingPayload);
      setShowSubmitConfirm(false);
      setPendingPayload(null);
    } catch (err) {
      showToast(err?.message || 'Thao tác thất bại', 'error');
    } finally {
      setConfirmLoading(false);
    }
  };

  const handleTimeInputChange = (field, newValue) => {
    if (!newValue) return;
    updateField(field, newValue);
  };

  const tabs = [
    { key: 'info', label: 'Thông tin & Tiện nghi'},
    { key:'images', label: `Hình ảnh${hotelImages.length ? ` (${hotelImages.length})` : '*'}` },
    { key: 'policies', label: 'Chính sách & Nội quy'},
  ];

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

        {showSubmitConfirm && (
          <PartnerHotelSubmitConfirmModal
            needsApproval={needsApproval}
            hotelName={form.ten?.trim()}
            loading={confirmLoading || loading}
            onClose={() => !confirmLoading && !loading && setShowSubmitConfirm(false)}
            onConfirm={handleConfirmSubmit}
          />
        )}

        <div style={{
          display: 'flex', gap: 8, marginBottom: 20,
          borderBottom: '2px solid #e8f5f1', paddingBottom: 10, flexWrap: 'wrap',
        }}>
          {tabs.map((tab) => (
            <button
              key={tab.key}
              type="button"className={`btn btn-sm ${activeTab === tab.key ? 'btn-primary':'btn-ghost'}`}
              onClick={() => setActiveTab(tab.key)}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <form onSubmit={handleFormSubmit} noValidate>
          {activeTab === 'info'&& (
            <>

              <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr', gap: 12, marginBottom: 12 }}>
                <div>
                  <label style={{ display: 'block', fontSize: 13, fontWeight: 500, marginBottom: 6, color: '#1a2e28'}}>
                    Tên khách sạn <span style={{ color:'#e05c5c'}}>*</span>
                  </label>
                  <input className="search-input" style={inputStyle('ten')} value={form.ten} onChange={(e) => updateField('ten', e.target.value)} placeholder="VD: Khách sạn Mặt Trời"/>
                  {fieldErrors.ten && <p style={errSt}>{fieldErrors.ten}</p>}
                </div>
                <div>
                  <label style={{ display:'block', fontSize: 13, fontWeight: 500, marginBottom: 6, color: '#1a2e28'}}>
                    Địa điểm <span style={{ color:'#e05c5c'}}>*</span>
                  </label>
                  <select className="search-input" style={inputStyle('ma_dia_diem')} value={form.ma_dia_diem} onChange={(e) => updateField('ma_dia_diem', e.target.value)}>
                    <option value="">-- Chọn --</option>
                    {diaDiem.map((d) => (
                      <option key={d.ma_dia_diem} value={d.ma_dia_diem}>{d.ten_dia_diem}</option>
                    ))}
                  </select>
                  {fieldErrors.ma_dia_diem && <p style={errSt}>{fieldErrors.ma_dia_diem}</p>}
                </div>
                <div>
                  <label style={{ display:'block', fontSize: 13, fontWeight: 500, marginBottom: 6, color: '#1a2e28'}}>Số sao</label>
                  <select className="search-input"style={{ width:'100%', boxSizing: 'border-box'}} value={form.so_sao} onChange={(e) => setForm({ ...form, so_sao: Number(e.target.value) })}>
                    {[1, 2, 3, 4, 5].map((n) => <option key={n} value={n}>{n} sao</option>)}
                  </select>
                </div>
              </div>

              <div style={{ marginBottom: 12 }}>
                <label style={{ display:'block', fontSize: 13, fontWeight: 500, marginBottom: 6, color: '#1a2e28'}}>
                  Địa chỉ cụ thể <span style={{ color:'#e05c5c'}}>*</span>
                </label>
                <input className="search-input" style={inputStyle('dia_chi')} value={form.dia_chi} onChange={(e) => updateField('dia_chi', e.target.value)} placeholder="Số nhà, đường, phường/xã..."/>
                {fieldErrors.dia_chi && <p style={errSt}>{fieldErrors.dia_chi}</p>}
              </div>

              <div style={{ marginBottom: 16 }}>
                <label style={{ display:'block', fontSize: 13, fontWeight: 500, marginBottom: 6, color: '#1a2e28'}}>Mô tả</label>
                <textarea className="search-input"rows={3} style={{ resize:'vertical', width: '100%', boxSizing: 'border-box'}} value={form.mo_ta} onChange={(e) => setForm({ ...form, mo_ta: e.target.value })} placeholder="Giới thiệu về khách sạn..."/>
              </div>

              <div>
                <label style={{ display:'block', fontSize: 13, fontWeight: 500, marginBottom: 6, color: '#1a2e28'}}>Tiện nghi khách sạn</label>
                <HotelAmenityPicker
                  amenities={amenities}
                  selectedIds={form.tien_nghi_ids}
                  onToggle={toggleAmenity}
                />
                <button type="button"className="btn btn-ghost btn-sm"style={{ marginTop: 8 }} onClick={() => setShowPropose(!showPropose)}>
                  {showPropose ? 'Ẩn phần đề xuất':'Đề xuất tiện nghi mới'}
                </button>
                {showPropose && (
                  <div style={{
                    marginTop: 8, padding: 12, background: '#fff8e6',
                    borderRadius: 8, border: '1px solid #fac775', display: 'flex', gap: 8,
                  }}>
                    <input className="search-input"style={{ flex: 2 }} placeholder="Tên tiện nghi *"value={proposeForm.ten_de_xuat} onChange={(e) => setProposeForm({ ...proposeForm, ten_de_xuat: e.target.value })} />
                    <button type="button"className="btn btn-primary btn-sm"onClick={handlePropose}>Gửi đề xuất</button>
                  </div>
                )}
              </div>
            </>
          )}

          {activeTab === 'images'&& (
            <div style={{ minHeight: 280 }}>
              <label
                style={{
                  display:'block', position: 'relative',
                  border: fieldErrors.images ? '2px dashed #ffb3b3' : '2px dashed #3C7363',
                  padding: '28px',
                  textAlign: 'center', borderRadius: 8,
                  background: fieldErrors.images ? '#fff8f8' : '#f8fdfb',
                  marginBottom: 16,
                  cursor: hotelImages.length >= MAX_HOTEL_IMAGES ? 'not-allowed' : 'pointer',
                  opacity: hotelImages.length >= MAX_HOTEL_IMAGES ? 0.6 : 1,
                }}
              >
                <div style={{ color: '#3C7363', fontWeight: 600, marginBottom: 4 }}>
                  + Tải ảnh khách sạn ({hotelImages.length}/{MAX_HOTEL_IMAGES})
                </div>
                <div style={{ color: '#888', fontSize: 12 }}>
                  Chọn nhiều file JPG, PNG (tối đa {MAX_HOTEL_IMAGES} ảnh)
                </div>
                <input
                  type="file"
                  multiple
                  accept="image/*"
                  onChange={handleImageChange}
                  disabled={hotelImages.length >= MAX_HOTEL_IMAGES}
                  style={{ position: 'absolute', inset: 0, opacity: 0, cursor: hotelImages.length >= MAX_HOTEL_IMAGES ? 'not-allowed' : 'pointer' }}
                />
              </label>

              {fieldErrors.images && (
                <p style={{ ...errSt, marginTop: -8, marginBottom: 12 }}>{fieldErrors.images}</p>
              )}

              {hotelImages.length === 0 ? (
                <div style={{
                  padding: 16, background:'#fff0f0', border: '1px solid #ffb3b3',
                  borderRadius: 8, textAlign: 'center', color: '#c0392b', fontSize: 13,
                }}>
                  Khách sạn cần có ít nhất 1 ảnh đại diện để được hiển thị.
                </div>
              ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12 }}>
                  {hotelImages.map((img) => (
                    <div
                      key={img.ma_hinh_anh}
                      style={{
                        position: 'relative', height: 110, borderRadius: 8, overflow: 'hidden',
                        border: img.la_anh_chinh ? '3px solid #f1c40f':'1px solid #ddd',
                      }}
                    >
                      <img
                        src={resolveUploadUrl(img.url)}
                        alt="Hotel"style={{ width: '100%', height: '100%', objectFit: 'cover'}}
                      />
                      {img.la_anh_chinh ? (
                        <span style={{
                          position:'absolute', top: 4, left: 4, background: '#f1c40f',
                          color: '#fff', fontSize: 10, padding: '2px 6px', borderRadius: 4, fontWeight: 600,
                        }}>
                          Ảnh chính
                        </span>
                      ) : (
                        <button
                          type="button"className="btn btn-sm"style={{
                            position: 'absolute', top: 4, left: 4,
                            background: 'rgba(0,0,0,0.65)', color: '#fff', padding: '2px 6px', fontSize: 10,
                          }}
                          onClick={() => handleSetMainImage(img.ma_hinh_anh)}
                        >
                          Đặt chính
                        </button>
                      )}
                      <button
                        type="button"onClick={() => handleRemoveImage(img.ma_hinh_anh)}
                        style={{
                          position: 'absolute', top: 4, right: 4, background: '#e05c5c',
                          color: '#fff', border: 'none', borderRadius: '50%',
                          width: 22, height: 22, cursor: 'pointer', fontWeight: 700, fontSize: 12,
                        }}
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === 'policies'&& (
            <div style={{ minHeight: 280 }}>
              <div style={{
                display:'grid', gridTemplateColumns: '1fr 1fr', gap: 16,
                padding: 14, background: '#f8fdfb', borderRadius: 8,
                border: '1px solid #d4ede6', marginBottom: 16,
              }}>
                <div>
                  <label style={{ display: 'block', fontSize: 13, fontWeight: 500, marginBottom: 6, color: '#1a2e28'}}>Giờ nhận phòng (check-in)</label>
                  <input type="time" className="search-input" style={{ width:'100%', boxSizing: 'border-box'}} value={form.gio_nhan_phong} onChange={(e) => handleTimeInputChange('gio_nhan_phong', e.target.value)} />
                </div>
                <div>
                  <label style={{ display:'block', fontSize: 13, fontWeight: 500, marginBottom: 6, color: '#1a2e28'}}>Giờ trả phòng (check-out)</label>
                  <input type="time" className="search-input" style={{ width:'100%', boxSizing: 'border-box'}} value={form.gio_tra_phong} onChange={(e) => handleTimeInputChange('gio_tra_phong', e.target.value)} />
                </div>
              </div>

              <div style={{
                padding: 14, background: '#fff', borderRadius: 8,
                border: '1px solid #d4ede6', marginBottom: 16,
              }}>
                <h4 style={{ margin: '0 0 12px', fontSize: 14, color: '#1a2e28' }}>Nội quy khách sạn</h4>

                <div style={{ marginBottom: 14 }}>
                  <label style={{ display: 'block', fontSize: 13, fontWeight: 500, marginBottom: 8, color: '#1a2e28' }}>
                    Giấy tờ bắt buộc khi nhận phòng
                  </label>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px 18px' }}>
                    {REQUIRED_DOC_OPTIONS.map((opt) => (
                      <label key={opt.id} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, cursor: 'pointer' }}>
                        <input
                          type="checkbox"
                          checked={form.giay_to_bat_buoc.includes(opt.id)}
                          onChange={() => toggleRequiredDoc(opt.id)}
                        />
                        {opt.label}
                      </label>
                    ))}
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px 24px', marginBottom: 14 }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, cursor: 'pointer' }}>
                    <input
                      type="checkbox"
                      checked={form.cho_phep_hut_thuoc}
                      onChange={(e) => setRuleFlag('cho_phep_hut_thuoc', e.target.checked)}
                    />
                    Cho phép hút thuốc
                  </label>
                  <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, cursor: 'pointer' }}>
                    <input
                      type="checkbox"
                      checked={form.cho_phep_to_chuc_tiec}
                      onChange={(e) => setRuleFlag('cho_phep_to_chuc_tiec', e.target.checked)}
                    />
                    Cho phép tổ chức tiệc / sự kiện
                  </label>
                  <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, cursor: 'pointer' }}>
                    <input
                      type="checkbox"
                      checked={form.cho_phep_thu_cung}
                      onChange={(e) => setRuleFlag('cho_phep_thu_cung', e.target.checked)}
                    />
                    Cho phép mang thú cưng
                  </label>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: 12 }}>
                  <div>
                    <label style={{ display: 'block', fontSize: 13, fontWeight: 500, marginBottom: 6, color: '#1a2e28' }}>
                      Phụ thu thú cưng (VNĐ/đêm)
                    </label>
                    <input
                      type="text"
                      inputMode="numeric"
                      className="search-input"
                      style={{ width: '100%', boxSizing: 'border-box' }}
                      value={formatThousands(form.phu_thu_thu_cung)}
                      onChange={(e) => setForm({ ...form, phu_thu_thu_cung: onlyDigits(e.target.value) })}
                      placeholder="VD: 200.000"
                      disabled={!form.cho_phep_thu_cung}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: 13, fontWeight: 500, marginBottom: 6, color: '#1a2e28' }}>
                      Tuổi trẻ em miễn phí (tối đa)
                    </label>
                    <input
                      type="number"
                      min="0"
                      max="17"
                      className="search-input"
                      style={{ width: '100%', boxSizing: 'border-box' }}
                      value={form.tuoi_toi_da_mien_phi}
                      onChange={(e) => setForm({ ...form, tuoi_toi_da_mien_phi: e.target.value })}
                      onWheel={blurOnWheel}
                      placeholder="VD: 6"
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: 13, fontWeight: 500, marginBottom: 6, color: '#1a2e28' }}>
                      Phụ thu trẻ em (VNĐ/đêm)
                    </label>
                    <input
                      type="text"
                      inputMode="numeric"
                      className="search-input"
                      style={{ width: '100%', boxSizing: 'border-box' }}
                      value={formatThousands(form.phu_thu_tre_em)}
                      onChange={(e) => setForm({ ...form, phu_thu_tre_em: onlyDigits(e.target.value) })}
                      placeholder="VD: 150.000"
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: 13, fontWeight: 500, marginBottom: 6, color: '#1a2e28' }}>
                      % Phí VAT
                    </label>
                    <input
                      type="number"
                      min="0"
                      max="100"
                      step="0.01"
                      className="search-input"
                      style={{ width: '100%', boxSizing: 'border-box' }}
                      value={form.phan_tram_vat}
                      onChange={(e) => setForm({ ...form, phan_tram_vat: e.target.value })}
                      onWheel={blurOnWheel}
                      placeholder="VD: 10"
                    />
                  </div>
                </div>

                <div style={{ marginTop: 16, borderTop: '1px dashed #d4ede6', paddingTop: 14 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                    <label style={{ fontSize: 13, fontWeight: 500, color: '#1a2e28' }}>
                      Nội quy riêng của khách sạn
                    </label>
                    <button type="button" className="btn btn-outline btn-sm" onClick={handleAddNoiQuy}>
                      + Thêm nội quy
                    </button>
                  </div>

                  {form.noi_quy_khac.length === 0 ? (
                    <p style={{ margin: 0, fontSize: 12, color: '#888', fontStyle: 'italic' }}>
                      Chưa có nội quy riêng. Nhấn &quot;Thêm nội quy&quot; để bổ sung quy định của khách sạn.
                    </p>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                      {form.noi_quy_khac.map((rule, idx) => (
                        <div key={idx} style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                          <input
                            className="search-input"
                            style={{ flex: 1, boxSizing: 'border-box' }}
                            value={rule}
                            onChange={(e) => handleNoiQuyChange(idx, e.target.value)}
                            placeholder="VD: Không nhận khách dưới 18 tuổi nếu không có người giám hộ"
                          />
                          <button
                            type="button"
                            className="btn btn-danger btn-sm"
                            onClick={() => handleRemoveNoiQuy(idx)}
                          >
                            Xóa
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              <div style={{ marginBottom: 12 }}>
                <h4 style={{ margin: 0, fontSize: 14, color: '#1a2e28'}}>Quy định hoàn tiền khi hủy phòng</h4>
                <p style={{ margin: '4px 0 0', fontSize: 12, color: '#666' }}>
                  Quy định này áp dụng mặc định cho tất cả khách sạn.
                </p>
              </div>

              <table className="data-table">
                <thead>
                  <tr>
                    <th>Hủy trước (ngày)</th>
                    <th>Hoàn tiền (%)</th>
                  </tr>
                </thead>
                <tbody>
                  {cancelPolicies.map((p, idx) => (
                    <tr key={idx}>
                      <td>{p.so_ngay_truoc} ngày</td>
                      <td>{Number(p.phan_tram_hoan)}%</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          <div style={{
            display:'flex', gap: 10, justifyContent: 'flex-end',
            borderTop: '1px solid #eee', paddingTop: 20, marginTop: 20,
          }}>
            <button type="button" className="btn btn-ghost" onClick={onClose}>Hủy bỏ</button>
            <button type="submit" className="btn btn-primary" disabled={loading || confirmLoading}>
              {loading || confirmLoading ? 'Đang xử lý...' : submitLabel}
            </button>
          </div>
        </form>
    </div>
  );
};

export default HotelFormContent;
