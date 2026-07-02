import { useState } from 'react';
import api from '../../../services/api';
import AmenityRequestStatus from '../../../components/partner/AmenityRequestStatus';
import { resolveUploadUrl } from '../../../utils/media';
import { HotelAmenityPicker } from './components/HotelAmenityGroups';
import {
  REQUIRED_DOC_LABELS,
  parseGiayToBatBuoc,
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
  hoan_khi_benh: false,
  hoan_cong_viec_dot_xuat: false,
  yeu_cau_minh_chung_huy: true,
  mo_ta_chinh_sach_huy: '',
};

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

const HotelFormContent = ({
  hotel, diaDiem, amenities, defaultCancelPolicies,
  onClose, onSubmit, loading,
}) => {
  const isEdit = !!hotel;
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
      hoan_khi_benh: !!hotel.hoan_khi_benh,
      hoan_cong_viec_dot_xuat: !!hotel.hoan_cong_viec_dot_xuat,
      yeu_cau_minh_chung_huy: hotel.yeu_cau_minh_chung_huy !== false,
      mo_ta_chinh_sach_huy: hotel.mo_ta_chinh_sach_huy || '',
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

  const [cancelPolicies, setCancelPolicies] = useState(
    isEdit && hotel.chinh_sach_huy?.length > 0
      ? mapPolicies(hotel.chinh_sach_huy)
      : mapPolicies(defaultCancelPolicies)
  );

  const [showPropose, setShowPropose] = useState(false);
  const [proposeForm, setProposeForm] = useState({ ten_de_xuat: '', mo_ta: ''});
  const [requestRefresh, setRequestRefresh] = useState(0);

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

  const handlePropose = async () => {
    if (!proposeForm.ten_de_xuat.trim()) return alert('Nhập tên tiện nghi đề xuất');
    const hotelName = form.ten?.trim();
    if (!hotelName) return alert('Vui lòng nhập tên khách sạn trước khi gửi đề xuất');
    try {
      const contextTag = hotel?.ma_khach_san
        ? `[khách sạn:${hotel.ma_khach_san}:${hotelName}]`
        : `[khách sạn:moi:${hotelName}]`;
      await api.post('/amenities/requests', {
        ten_de_xuat: proposeForm.ten_de_xuat.trim(),
        loai_de_xuat: 'khach_san',
        mo_ta: `${contextTag} ${proposeForm.mo_ta || 'Đối tác yêu cầu tiện nghi cho khách sạn này'}`,
      });
      alert('Đã gửi đề xuất! Bạn sẽ nhận thông báo khi admin duyệt hoặc từ chối.');
      setProposeForm({ ten_de_xuat: '', mo_ta: ''});
      setShowPropose(false);
      setRequestRefresh((k) => k + 1);
    } catch {
      alert('Gửi đề xuất thất bại');
    }
  };

  const handleAddPolicy = () => {
    setCancelPolicies([...cancelPolicies, { so_ngay_truoc: 1, phan_tram_hoan: 0 }]);
  };

  const handleRemovePolicy = (index) => {
    setCancelPolicies(cancelPolicies.filter((_, i) => i !== index));
  };

  const handlePolicyChange = (index, field, value) => {
    const updated = [...cancelPolicies];
    updated[index][field] = Number(value);
    setCancelPolicies(updated);
  };

  const handleResetPolicies = () => {
    setCancelPolicies(mapPolicies(defaultCancelPolicies));
  };

  const handleImageChange = (e) => {
    const files = Array.from(e.target.files);
    if (files.length === 0) return;

    const newImages = files.map((file, idx) => ({
      ma_hinh_anh: `new-${Date.now()}-${idx}`,
      url: URL.createObjectURL(file),
      file,
      la_anh_chinh: hotelImages.length === 0 && idx === 0 ? 1 : 0,
    }));

    setHotelImages((prev) => [...prev, ...newImages]);
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
    if (!form.ten.trim()) { setActiveTab('info'); return alert('Vui lòng nhập tên khách sạn'); }
    if (!form.dia_chi.trim()) { setActiveTab('info'); return alert('Vui lòng nhập địa chỉ cụ thể'); }
    if (!form.ma_dia_diem) { setActiveTab('info'); return alert('Vui lòng chọn địa điểm khu vực'); }
    if (hotelImages.length === 0) { setActiveTab('images'); return alert('Vui lòng tải lên ít nhất 1 hình ảnh đại diện'); }

    onSubmit({
      ...form,
      hinh_anh: hotelImages,
      chinh_sach_huy: cancelPolicies,
      removedImageIds,
    });
  };

  const tabs = [
    { key: 'info', label: 'Thông tin & Tiện nghi'},
    { key:'images', label: `Hình ảnh${hotelImages.length ? ` (${hotelImages.length})` : '*'}` },
    { key: 'policies', label: 'Chính sách & Nội quy'},
  ];

  return (
    <div>
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

        <form onSubmit={handleFormSubmit}>
          {activeTab === 'info'&& (
            <>

              <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr', gap: 12, marginBottom: 12 }}>
                <div>
                  <label style={{ display: 'block', fontSize: 13, fontWeight: 500, marginBottom: 6, color: '#1a2e28'}}>
                    Tên khách sạn <span style={{ color:'#e05c5c'}}>*</span>
                  </label>
                  <input className="search-input"style={{ width:'100%', boxSizing: 'border-box'}} value={form.ten} onChange={(e) => setForm({ ...form, ten: e.target.value })} placeholder="VD: Khách sạn Mặt Trời"/>
                </div>
                <div>
                  <label style={{ display:'block', fontSize: 13, fontWeight: 500, marginBottom: 6, color: '#1a2e28'}}>
                    Địa điểm <span style={{ color:'#e05c5c'}}>*</span>
                  </label>
                  <select className="search-input"style={{ width:'100%', boxSizing: 'border-box'}} value={form.ma_dia_diem} onChange={(e) => setForm({ ...form, ma_dia_diem: e.target.value })}>
                    <option value="">-- Chọn --</option>
                    {diaDiem.map((d) => (
                      <option key={d.ma_dia_diem} value={d.ma_dia_diem}>{d.ten_dia_diem}</option>
                    ))}
                  </select>
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
                <input className="search-input"style={{ width:'100%', boxSizing: 'border-box'}} value={form.dia_chi} onChange={(e) => setForm({ ...form, dia_chi: e.target.value })} placeholder="Số nhà, đường, phường/xã..."/>
              </div>

              <div style={{ marginBottom: 16 }}>
                <label style={{ display:'block', fontSize: 13, fontWeight: 500, marginBottom: 6, color: '#1a2e28'}}>Mô tả</label>
                <textarea className="search-input"rows={3} style={{ resize:'vertical', width: '100%', boxSizing: 'border-box'}} value={form.mo_ta} onChange={(e) => setForm({ ...form, mo_ta: e.target.value })} placeholder="Giới thiệu về khách sạn..."/>
              </div>

              <AmenityRequestStatus
                loaiFilter="khach_san"
                refreshKey={requestRefresh}
                contextId={hotel?.ma_khach_san || null}
                contextName={form.ten?.trim() || ''}
              />

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
                  border: '2px dashed #3C7363', padding: '28px',
                  textAlign: 'center', borderRadius: 8, background: '#f8fdfb',
                  marginBottom: 16, cursor: 'pointer',
                }}
              >
                <div style={{ color: '#3C7363', fontWeight: 600, marginBottom: 4 }}>+ Tải ảnh khách sạn</div>
                <div style={{ color: '#888', fontSize: 12 }}>Chọn nhiều file JPG, PNG (tối đa 10 ảnh)</div>
                <input type="file"multiple accept="image/*"onChange={handleImageChange} style={{ position: 'absolute', inset: 0, opacity: 0, cursor: 'pointer'}} />
              </label>

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
                  <label style={{ display: 'block', fontSize: 13, fontWeight: 500, marginBottom: 6, color: '#1a2e28'}}>Giờ nhận phòng</label>
                  <input type="time"className="search-input"style={{ width:'100%', boxSizing: 'border-box'}} value={form.gio_nhan_phong} onChange={(e) => setForm({ ...form, gio_nhan_phong: e.target.value })} />
                </div>
                <div>
                  <label style={{ display:'block', fontSize: 13, fontWeight: 500, marginBottom: 6, color: '#1a2e28'}}>Giờ trả phòng</label>
                  <input type="time"className="search-input"style={{ width:'100%', boxSizing: 'border-box'}} value={form.gio_tra_phong} onChange={(e) => setForm({ ...form, gio_tra_phong: e.target.value })} />
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

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12 }}>
                  <div>
                    <label style={{ display: 'block', fontSize: 13, fontWeight: 500, marginBottom: 6, color: '#1a2e28' }}>
                      Phụ thu thú cưng (VNĐ/đêm)
                    </label>
                    <input
                      type="number"
                      min="0"
                      className="search-input"
                      style={{ width: '100%', boxSizing: 'border-box' }}
                      value={form.phu_thu_thu_cung}
                      onChange={(e) => setForm({ ...form, phu_thu_thu_cung: e.target.value })}
                      placeholder="VD: 200000"
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
                      placeholder="VD: 6"
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: 13, fontWeight: 500, marginBottom: 6, color: '#1a2e28' }}>
                      Phụ thu trẻ em (VNĐ/đêm)
                    </label>
                    <input
                      type="number"
                      min="0"
                      className="search-input"
                      style={{ width: '100%', boxSizing: 'border-box' }}
                      value={form.phu_thu_tre_em}
                      onChange={(e) => setForm({ ...form, phu_thu_tre_em: e.target.value })}
                      placeholder="VD: 150000"
                    />
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                <h4 style={{ margin: 0, fontSize: 14, color: '#1a2e28'}}>Quy định hoàn tiền khi hủy phòng</h4>
                <div style={{ display:'flex', gap: 8 }}>
                  <button type="button"className="btn btn-ghost btn-sm"onClick={handleResetPolicies}>
                    Khôi phục mặc định
                  </button>
                  <button type="button"className="btn btn-outline btn-sm"onClick={handleAddPolicy}>
                    + Thêm mốc
                  </button>
                </div>
              </div>

              <table className="data-table">
                <thead>
                  <tr>
                    <th>Hủy trước (ngày)</th>
                    <th>Hoàn tiền (%)</th>
                    <th style={{ width: 80, textAlign: 'center'}}>Xóa</th>
                  </tr>
                </thead>
                <tbody>
                  {cancelPolicies.length === 0 ? (
                    <tr>
                      <td colSpan="3"style={{ textAlign:'center', color: '#888', fontStyle: 'italic'}}>
                        Không có chính sách — khách hủy sẽ mất 100% cọc
                      </td>
                    </tr>
                  ) : cancelPolicies.map((p, idx) => (
                    <tr key={idx}>
                      <td>
                        <input
                          type="number"min="0"className="search-input"style={{ width: 80, display:'inline-block', marginRight: 6 }}
                          value={p.so_ngay_truoc}
                          onChange={(e) => handlePolicyChange(idx, 'so_ngay_truoc', e.target.value)}
                        />
                        ngày
                      </td>
                      <td>
                        <input
                          type="number"min="0"max="100"className="search-input"style={{ width: 80, display: 'inline-block', marginRight: 6 }}
                          value={p.phan_tram_hoan}
                          onChange={(e) => handlePolicyChange(idx, 'phan_tram_hoan', e.target.value)}
                        />
                        %
                      </td>
                      <td style={{ textAlign: 'center'}}>
                        <button type="button"className="btn btn-danger btn-sm"onClick={() => handleRemovePolicy(idx)}>
                          Xóa
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              <div style={{
                marginTop: 16, padding: 14, background: '#f8fdfb',
                borderRadius: 8, border: '1px solid #d4ede6',
              }}>
                <h4 style={{ margin: '0 0 10px', fontSize: 14, color: '#1a2e28' }}>
                  Mô tả chính sách hủy đặc biệt
                </h4>
                <p style={{ margin: '0 0 12px', fontSize: 12, color: '#666', lineHeight: 1.5 }}>
                  Áp dụng khi khách hủy ngoài các mốc hoàn tiền ở trên. Khách cần gửi minh chứng để được xem xét hoàn tiền.
                </p>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px 24px', marginBottom: 12 }}>
                  <label style={{ display: 'flex', alignItems: 'flex-start', gap: 8, fontSize: 13, cursor: 'pointer' }}>
                    <input
                      type="checkbox"
                      style={{ marginTop: 3 }}
                      checked={form.hoan_khi_benh}
                      onChange={(e) => setRuleFlag('hoan_khi_benh', e.target.checked)}
                    />
                    <span>
                      <strong>Bị bệnh</strong>
                      <span style={{ display: 'block', fontSize: 12, color: '#666' }}>
                        Chấp nhận hoàn tiền khi khách bị bệnh (giấy xác nhận y tế)
                      </span>
                    </span>
                  </label>
                  <label style={{ display: 'flex', alignItems: 'flex-start', gap: 8, fontSize: 13, cursor: 'pointer' }}>
                    <input
                      type="checkbox"
                      style={{ marginTop: 3 }}
                      checked={form.hoan_cong_viec_dot_xuat}
                      onChange={(e) => setRuleFlag('hoan_cong_viec_dot_xuat', e.target.checked)}
                    />
                    <span>
                      <strong>Công việc đột xuất</strong>
                      <span style={{ display: 'block', fontSize: 12, color: '#666' }}>
                        Chấp nhận hoàn tiền khi có việc công tác / công việc khẩn cấp
                      </span>
                    </span>
                  </label>
                </div>

                <label style={{ display: 'flex', alignItems: 'flex-start', gap: 8, fontSize: 13, cursor: 'pointer', marginBottom: 12 }}>
                  <input
                    type="checkbox"
                    style={{ marginTop: 3 }}
                    checked={form.yeu_cau_minh_chung_huy}
                    onChange={(e) => setRuleFlag('yeu_cau_minh_chung_huy', e.target.checked)}
                  />
                  <span>
                    <strong>Yêu cầu hình ảnh minh chứng</strong>
                    <span style={{ display: 'block', fontSize: 12, color: '#666' }}>
                      Khách phải đính kèm ảnh minh chứng (đơn thuốc, giấy bác sĩ, thư công ty...) khi yêu cầu hoàn tiền
                    </span>
                  </span>
                </label>

                <div>
                  <label style={{ display: 'block', fontSize: 13, fontWeight: 500, marginBottom: 6, color: '#1a2e28' }}>
                    Ghi chú bổ sung
                  </label>
                  <textarea
                    className="search-input"
                    rows={3}
                    style={{ resize: 'vertical', width: '100%', boxSizing: 'border-box' }}
                    value={form.mo_ta_chinh_sach_huy}
                    onChange={(e) => setForm({ ...form, mo_ta_chinh_sach_huy: e.target.value })}
                    placeholder="VD: Khách gửi minh chứng trong vòng 24h sau khi hủy. Khách sạn xem xét và phản hồi trong 3 ngày làm việc."
                  />
                </div>
              </div>
            </div>
          )}

          <div style={{
            display:'flex', gap: 10, justifyContent: 'flex-end',
            borderTop: '1px solid #eee', paddingTop: 20, marginTop: 20,
          }}>
            <button type="button"className="btn btn-ghost"onClick={onClose}>Hủy bỏ</button>
            <button type="submit"className="btn btn-primary" disabled={loading}>
              {loading ? 'Đang xử lý...': isEdit ?'Lưu thay đổi':'Gửi duyệt'}
            </button>
          </div>
        </form>
    </div>
  );
};

export default HotelFormContent;
