import { useEffect, useMemo, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import { addAmenity, updateAmenity, fetchAmenities } from '../../../store/slices/amenitySlice';
import { getAmenityLucideIcon, suggestIconSlugFromName, resolveIconSlug } from '../../../utils/amenityIcons';
import EditField from '../users/components/EditField';
import ManagementHeader from '../../../components/common/management/ManagementHeader';
import BackButton from '../../../components/common/BackButton';

const LOAI_OPTIONS = [
  { value: 'khach_san', label: 'Khách sạn', desc: 'Hiển thị cho khách sạn' },
  { value: 'phong', label: 'Loại phòng', desc: 'Hiển thị cho loại phòng' },
  { value: 'ca_hai', label: 'Cả hai', desc: 'Khách sạn & Loại phòng' },
];

const inputStyle = {
  width: '100%',
  boxSizing: 'border-box',
  border: 'none',
  background: 'transparent',
  padding: 0,
  fontSize: 14,
  fontWeight: 500,
  color: '#1a2e28',
  outline: 'none',
};

export default function AmenityFormPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const dispatch = useDispatch();
  const { list = [], loading = false } = useSelector((state) => state.amenities || {});

  const isEdit = Boolean(id);
  const defaultLoai = location.state?.loai || 'khach_san';

  const [form, setForm] = useState({ ten: '', bieu_tuong: 'wifi', loai: defaultLoai });
  const [iconManual, setIconManual] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const existing = useMemo(
    () => (isEdit ? list.find((item) => String(item.ma_tien_nghi) === String(id)) : null),
    [isEdit, id, list],
  );

  useEffect(() => {
    if (list.length === 0) dispatch(fetchAmenities());
  }, [dispatch, list.length]);

  useEffect(() => {
    if (isEdit && existing) {
      setForm({
        ten: existing.ten,
        bieu_tuong: existing.bieu_tuong || suggestIconSlugFromName(existing.ten),
        loai: existing.loai,
      });
      setIconManual(true);
    }
  }, [isEdit, existing]);

  const PreviewIcon = getAmenityLucideIcon(form.ten || form.bieu_tuong);

  const handleNameChange = (ten) => {
    const next = { ...form, ten };
    if (!iconManual && !isEdit) next.bieu_tuong = suggestIconSlugFromName(ten);
    setForm(next);
  };

  const handleSubmit = async () => {
    if (!form.ten.trim()) return alert('Vui lòng nhập tên tiện nghi');
    setSubmitting(true);
    const iconSlug = resolveIconSlug(form.bieu_tuong, form.ten);
    const payload = { ...form, ten: form.ten.trim(), bieu_tuong: iconSlug };

    try {
      if (isEdit) {
        await dispatch(updateAmenity({ id, data: payload })).unwrap();
      } else {
        await dispatch(addAmenity(payload)).unwrap();
      }
      navigate('/admin/amenities');
    } catch {
      alert('Lưu tiện nghi thất bại');
    } finally {
      setSubmitting(false);
    }
  };

  if (isEdit && loading && !existing) {
    return (
      <div style={{ textAlign: 'center', padding: 80, color: '#5a7a72' }}>
        Đang tải...
      </div>
    );
  }

  if (isEdit && !existing && list.length > 0) {
    return (
      <div className="content-card" style={{ textAlign: 'center', padding: 48 }}>
        <p style={{ color: '#e05c5c', marginBottom: 16 }}>Không tìm thấy tiện nghi</p>
        <BackButton variant="outline" onClick={() => navigate('/admin/amenities')} />
      </div>
    );
  }

  return (
    <div>
      <ManagementHeader
        title="Quản lý Tiện nghi"
        subtitle={isEdit ? 'Chỉnh sửa tiện nghi' : 'Thêm tiện nghi mới'}
        onBack={() => navigate('/admin/amenities')}
      />

      <div style={{ display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap' }}>
        <span className="mgmt-type-tag" style={{ padding: '8px 14px', fontSize: 13, background: '#f1f5f9' }}>
          {isEdit ? 'Chỉnh sửa tiện nghi' : 'Thêm tiện nghi mới'}
        </span>
      </div>

      <div className="detail-page-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        <div className="content-card">
          <h3 className="content-card-title" style={{ marginBottom: 12 }}>Thông tin tiện nghi</h3>

          <EditField label="Tên tiện nghi" required>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div
                style={{
                  width: 40,
                  height: 40,
                  borderRadius: 10,
                  background: '#f1f5f9',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#3C7363',
                  flexShrink: 0,
                }}
              >
                <PreviewIcon size={22} strokeWidth={1.5} />
              </div>
              <input
                type="text"
                style={inputStyle}
                placeholder={defaultLoai === 'phong' ? 'VD: Tủ lạnh, Ban công...' : 'VD: Hồ bơi, Bãi đỗ xe...'}
                value={form.ten}
                onChange={(e) => handleNameChange(e.target.value)}
                autoFocus
              />
            </div>
            {form.ten && (
              <p style={{ margin: '8px 0 0', fontSize: 12, color: '#64748b', display: 'flex', alignItems: 'center', gap: 6 }}>
                <PreviewIcon size={12} strokeWidth={2} />
                Icon tự nhận diện từ tên
              </p>
            )}
          </EditField>
        </div>

        <div className="content-card">
          <h3 className="content-card-title" style={{ marginBottom: 12 }}>Phạm vi áp dụng</h3>

          <EditField label="Áp dụng cho">
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 4 }}>
              {LOAI_OPTIONS.map(({ value, label, desc }) => (
                <button
                  key={value}
                  type="button"
                  className={`amenity-scope-btn${form.loai === value ? ' active' : ''}`}
                  style={{ width: '100%', textAlign: 'left' }}
                  onClick={() => setForm({ ...form, loai: value })}
                >
                  <span className="amenity-scope-label">{label}</span>
                  <span className="amenity-scope-desc">{desc}</span>
                </button>
              ))}
            </div>
          </EditField>
        </div>
      </div>

      <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 16 }}>
        <button type="button" className="btn btn-ghost" onClick={() => navigate('/admin/amenities')} disabled={submitting}>
          Hủy
        </button>
        <button type="button" className="btn btn-primary" onClick={handleSubmit} disabled={submitting}>
          {submitting ? 'Đang lưu...' : isEdit ? 'Cập nhật' : 'Thêm mới'}
        </button>
      </div>

      <style>{`
        @media (max-width: 900px) {
          .detail-page-grid { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </div>
  );
}
