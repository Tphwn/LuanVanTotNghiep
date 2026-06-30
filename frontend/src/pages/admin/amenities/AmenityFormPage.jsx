import { createElement, useEffect, useMemo, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate, useParams } from 'react-router-dom';
import { addAmenity, updateAmenity, fetchAmenities } from '../../../store/slices/amenitySlice';
import { getAmenityLucideIcon, suggestIconSlugFromName, resolveIconSlug } from '../../../utils/amenityIcons';
import EditField from '../users/components/EditField';
import ManagementHeader from '../../../components/common/management/ManagementHeader';
import BackButton from '../../../components/common/BackButton';
import {
  AMENITY_SCOPE,
  HOTEL_CATEGORY_GROUPS,
  ROOM_CATEGORY_GROUPS,
} from './constants';
import { findCategoryForAmenity } from './utils';

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

const inferScopeFromLoai = (loai, categoryId) => {
  if (loai === 'khach_san') return 'khach_san';
  if (loai === 'phong') return 'phong';
  const inHotel = HOTEL_CATEGORY_GROUPS.some((g) => g.id === categoryId);
  const inRoom = ROOM_CATEGORY_GROUPS.some((g) => g.id === categoryId);
  if (inHotel && !inRoom) return 'khach_san';
  if (inRoom && !inHotel) return 'phong';
  return 'khach_san';
};

const getGroupsForScope = (scope) => (
  scope === 'phong' ? ROOM_CATEGORY_GROUPS : HOTEL_CATEGORY_GROUPS
);

const AmenityIconPreview = ({ slugOrName, size = 22, strokeWidth = 1.5 }) => (
  createElement(getAmenityLucideIcon(slugOrName), { size, strokeWidth })
);

const buildEditInitialState = (existing) => {
  const allGroups = [...ROOM_CATEGORY_GROUPS, ...HOTEL_CATEGORY_GROUPS];
  const matchedCategory = findCategoryForAmenity(existing, allGroups);
  const nextScope = inferScopeFromLoai(existing.loai, matchedCategory);
  const groups = getGroupsForScope(nextScope);
  const validCategory = groups.some((g) => g.id === matchedCategory)
    ? matchedCategory
    : groups[0].id;
  const category = groups.find((g) => g.id === validCategory) || groups[0];

  return {
    scope: nextScope,
    showCategories: true,
    categoryId: validCategory,
    form: {
      ten: existing.ten,
      bieu_tuong: existing.bieu_tuong || suggestIconSlugFromName(existing.ten),
      loai: existing.loai || category.loai,
      danh_muc: existing.danh_muc || validCategory,
    },
    iconManual: true,
  };
};

const AmenityFormFields = ({ isEdit, editInitial, amenityId, onDone }) => {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const [scope, setScope] = useState(() => editInitial?.scope ?? null);
  const [showCategories, setShowCategories] = useState(() => editInitial?.showCategories ?? false);
  const [categoryId, setCategoryId] = useState(() => editInitial?.categoryId ?? null);
  const [form, setForm] = useState(() => editInitial?.form ?? {
    ten: '',
    bieu_tuong: 'wifi',
    loai: '',
  });
  const iconManual = editInitial?.iconManual ?? false;
  const [submitting, setSubmitting] = useState(false);

  const categoryGroups = useMemo(
    () => (scope ? getGroupsForScope(scope) : []),
    [scope],
  );

  const selectedCategory = categoryId
    ? categoryGroups.find((g) => g.id === categoryId)
    : null;

  const handleScopeChange = (nextScope) => {
    setScope(nextScope);
    setShowCategories(true);
    setCategoryId(null);
    setForm((prev) => ({ ...prev, loai: '' }));
  };

  const handleCategoryChange = (nextCategoryId) => {
    const category = categoryGroups.find((g) => g.id === nextCategoryId);
    if (!category) return;
    setCategoryId(nextCategoryId);
    setForm((prev) => ({ ...prev, loai: category.loai, danh_muc: nextCategoryId }));
  };

  const handleNameChange = (ten) => {
    const next = { ...form, ten };
    if (!iconManual && !isEdit) next.bieu_tuong = suggestIconSlugFromName(ten);
    setForm(next);
  };

  const handleSubmit = async () => {
    if (!scope) return alert('Vui lòng chọn thêm cho khách sạn hoặc loại phòng');
    if (!categoryId) return alert('Vui lòng chọn danh mục chi tiết');
    if (!form.ten.trim()) return alert('Vui lòng nhập tên tiện nghi');
    if (!form.loai) return alert('Vui lòng chọn danh mục để xác định loại tiện nghi');

    setSubmitting(true);
    const iconSlug = resolveIconSlug(form.bieu_tuong, form.ten);
    const payload = {
      ...form,
      ten: form.ten.trim(),
      bieu_tuong: iconSlug,
      danh_muc: categoryId,
    };

    try {
      if (isEdit) {
        await dispatch(updateAmenity({ id: amenityId, data: payload })).unwrap();
      } else {
        await dispatch(addAmenity(payload)).unwrap();
      }
      navigate('/admin/amenities', { state: { tab: scope === 'phong' ? 'room' : 'hotel' } });
      onDone?.();
    } catch (err) {
      const msg = err?.message || err?.response?.data?.message || 'Lưu tiện nghi thất bại';
      alert(msg);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <div className="amenity-form-body detail-page-grid">
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
                <AmenityIconPreview slugOrName={form.ten || form.bieu_tuong} size={22} strokeWidth={1.5} />
              </div>
              <input
                type="text"
                style={inputStyle}
                placeholder={selectedCategory ? `VD: ${selectedCategory.label}...` : 'Nhập tên tiện nghi...'}
                value={form.ten}
                onChange={(e) => handleNameChange(e.target.value)}
                autoFocus
              />
            </div>
            {form.ten && (
              <p style={{ margin: '8px 0 0', fontSize: 12, color: '#64748b', display: 'flex', alignItems: 'center', gap: 6 }}>
                <AmenityIconPreview slugOrName={form.ten || form.bieu_tuong} size={12} strokeWidth={2} />
                Icon tự nhận diện từ tên
              </p>
            )}
          </EditField>
        </div>

        <div className="content-card">
          <h3 className="content-card-title" style={{ marginBottom: 12 }}>Phân loại tiện nghi</h3>

          <EditField label="Thêm cho">
            <div className="amenity-form-scope-row" style={{ marginTop: 4 }}>
              {Object.entries(AMENITY_SCOPE).map(([key, { label, desc }]) => (
                <button
                  key={key}
                  type="button"
                  className={`amenity-scope-btn${scope === key ? ' active' : ''}`}
                  onClick={() => handleScopeChange(key)}
                >
                  <span className="amenity-scope-label">{label}</span>
                  <span className="amenity-scope-desc">{desc}</span>
                </button>
              ))}
            </div>
          </EditField>

          {showCategories && scope ? (
            <EditField label="Danh mục chi tiết">
              <div className="amenity-category-grid">
                {categoryGroups.map(({ id: groupId, label, Icon, loai }) => (
                  <button
                    key={groupId}
                    type="button"
                    className={`amenity-scope-btn${categoryId === groupId ? ' active' : ''}`}
                    style={{ width: '100%', textAlign: 'left' }}
                    onClick={() => handleCategoryChange(groupId)}
                  >
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
                      <Icon size={15} strokeWidth={1.6} />
                      <span className="amenity-scope-label">{label}</span>
                    </span>
                    <span className="amenity-scope-desc">
                      {loai === 'phong' ? 'Loại phòng' : loai === 'khach_san' ? 'Khách sạn' : 'Khách sạn & Loại phòng'}
                    </span>
                  </button>
                ))}
              </div>
            </EditField>
          ) : null}
        </div>
      </div>

      <div className="amenity-form-actions">
        <button type="button" className="btn btn-ghost" onClick={() => navigate('/admin/amenities')} disabled={submitting}>
          Hủy
        </button>
        <button type="button" className="btn btn-primary" onClick={handleSubmit} disabled={submitting}>
          {submitting ? 'Đang lưu...' : isEdit ? 'Cập nhật' : 'Thêm mới'}
        </button>
      </div>
    </>
  );
};

export default function AmenityFormPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { list = [], loading = false } = useSelector((state) => state.amenities || {});

  const isEdit = Boolean(id);

  const existing = useMemo(
    () => (isEdit ? list.find((item) => String(item.ma_tien_nghi) === String(id)) : null),
    [isEdit, id, list],
  );

  useEffect(() => {
    if (list.length === 0) dispatch(fetchAmenities());
  }, [dispatch, list.length]);

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

  const formKey = isEdit ? `edit-${existing?.ma_tien_nghi ?? 'pending'}` : 'create';
  const editInitial = isEdit && existing ? buildEditInitialState(existing) : null;

  return (
    <div className="amenity-form-page">
      <ManagementHeader
        title="Quản lý Tiện nghi"
        subtitle={isEdit ? 'Chỉnh sửa tiện nghi' : 'Thêm tiện nghi mới'}
        onBack={() => navigate('/admin/amenities')}
      />

      <AmenityFormFields
        key={formKey}
        isEdit={isEdit}
        editInitial={editInitial}
        amenityId={id}
      />

      <style>{`
        .amenity-form-page .mgmt-header {
          margin-bottom: 8px;
        }
        .amenity-form-body {
          margin-top: 20px;
        }
        .amenity-form-body.detail-page-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 16px;
        }
        .amenity-form-actions {
          display: flex;
          gap: 10px;
          justify-content: flex-end;
          margin-top: 16px;
        }
        .amenity-category-grid {
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 8px;
          margin-top: 4px;
        }
        @media (max-width: 900px) {
          .amenity-form-body.detail-page-grid { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </div>
  );
}
