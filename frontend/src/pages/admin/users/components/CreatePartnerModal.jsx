import { useEffect, useRef, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Plus } from 'lucide-react';
import AdminFormModal from '../../../../components/admin/AdminFormModal';
import { createPartner, clearUserMsg } from '../../../../store/slices/adminUserSlice';
import EditField from './EditField';

const INIT_FORM = {
  email: '',
  so_dien_thoai: '',
  mat_khau: '',
  xac_nhan_mat_khau: '',
  trang_thai: 'hoat_dong',
  ten_cong_ty: '',
  dia_chi: '',
  ma_so_thue: '',
  phan_tram_hoa_hong: '',
};

const getInitials = (name) => {
  if (!name?.trim()) return '?';
  return name.trim().split(/\s+/).slice(0, 2).map((w) => w[0]).join('').toUpperCase();
};

const validateForm = (form) => {
  const errors = {};
  if (!form.email.trim()) errors.email = 'Email đăng nhập là bắt buộc';
  else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) {
    errors.email = 'Email không hợp lệ';
  }
  if (!form.so_dien_thoai.trim()) errors.so_dien_thoai = 'Số điện thoại là bắt buộc';
  if (!form.mat_khau) errors.mat_khau = 'Mật khẩu tạm là bắt buộc';
  else if (form.mat_khau.length < 6) errors.mat_khau = 'Mật khẩu tối thiểu 6 ký tự';
  if (!form.xac_nhan_mat_khau) errors.xac_nhan_mat_khau = 'Vui lòng xác nhận mật khẩu';
  else if (form.mat_khau !== form.xac_nhan_mat_khau) {
    errors.xac_nhan_mat_khau = 'Mật khẩu xác nhận không khớp';
  }
  if (!form.ten_cong_ty.trim()) errors.ten_cong_ty = 'Tên công ty / đối tác là bắt buộc';
  if (form.phan_tram_hoa_hong !== '') {
    const pct = Number(form.phan_tram_hoa_hong);
    if (Number.isNaN(pct) || pct < 0 || pct > 100) {
      errors.phan_tram_hoa_hong = 'Phần trăm hoa hồng phải từ 0 đến 100';
    }
  }
  return errors;
};

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

export default function CreatePartnerModal({ open, onClose, onCreated }) {
  const dispatch = useDispatch();
  const fileInputRef = useRef(null);
  const { creating, error } = useSelector((state) => state.adminUsers);

  const [form, setForm] = useState(INIT_FORM);
  const [errors, setErrors] = useState({});
  const [avatarFile, setAvatarFile] = useState(null);
  const [avatarPreview, setAvatarPreview] = useState(null);

  useEffect(() => {
    if (!open) return undefined;

    dispatch(clearUserMsg());
    setForm(INIT_FORM);
    setErrors({});
    setAvatarFile(null);
    if (avatarPreview) URL.revokeObjectURL(avatarPreview);
    setAvatarPreview(null);

    return () => {
      if (avatarPreview) URL.revokeObjectURL(avatarPreview);
    };
  }, [open, dispatch]);

  const handleChange = (field) => (e) => {
    setForm((prev) => ({ ...prev, [field]: e.target.value }));
    if (errors[field]) setErrors((prev) => ({ ...prev, [field]: undefined }));
  };

  const handleAvatarChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      setErrors((prev) => ({ ...prev, avatar: 'Vui lòng chọn file ảnh' }));
      return;
    }
    if (avatarPreview) URL.revokeObjectURL(avatarPreview);
    setAvatarFile(file);
    setAvatarPreview(URL.createObjectURL(file));
    setErrors((prev) => ({ ...prev, avatar: undefined }));
  };

  const handleRemoveAvatar = () => {
    if (avatarPreview) URL.revokeObjectURL(avatarPreview);
    setAvatarFile(null);
    setAvatarPreview(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleSubmit = async () => {
    const nextErrors = validateForm(form);
    if (Object.keys(nextErrors).length > 0) {
      setErrors(nextErrors);
      return;
    }

    const payload = new FormData();
    payload.append('email', form.email.trim());
    payload.append('so_dien_thoai', form.so_dien_thoai.trim());
    payload.append('mat_khau', form.mat_khau);
    payload.append('trang_thai', form.trang_thai);
    payload.append('ten_cong_ty', form.ten_cong_ty.trim());
    if (form.dia_chi.trim()) payload.append('dia_chi', form.dia_chi.trim());
    if (form.ma_so_thue.trim()) payload.append('ma_so_thue', form.ma_so_thue.trim());
    if (form.phan_tram_hoa_hong !== '') {
      payload.append('phan_tram_hoa_hong', form.phan_tram_hoa_hong);
    }
    if (avatarFile) payload.append('avatar', avatarFile);

    const result = await dispatch(createPartner(payload));
    if (createPartner.fulfilled.match(result)) {
      onCreated?.();
      onClose();
    }
  };

  return (
    <AdminFormModal
      open={open}
      title="Tạo tài khoản đối tác"
      subtitle="Thêm đối tác mới vào hệ thống"
      icon={Plus}
      size="lg"
      onClose={onClose}
      onSave={handleSubmit}
      showSave
      saveLabel="Tạo tài khoản"
      loading={creating}
    >
      {error && (
        <div className="mgmt-toast error" style={{ marginBottom: 16 }}>{error}</div>
      )}

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        hidden
        onChange={handleAvatarChange}
      />

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }} className="create-partner-grid">
        <div className="content-card">
          <h3 className="content-card-title" style={{ marginBottom: 12 }}>Thông tin tài khoản đăng nhập</h3>
          <EditField label="Email đăng nhập" required error={errors.email}>
            <input type="email" style={inputStyle} value={form.email} onChange={handleChange('email')} placeholder="partner@example.com" />
          </EditField>
          <EditField label="Số điện thoại" required error={errors.so_dien_thoai}>
            <input type="tel" style={inputStyle} value={form.so_dien_thoai} onChange={handleChange('so_dien_thoai')} placeholder="0901234567" />
          </EditField>
          <EditField label="Trạng thái">
            <select className="search-input" style={{ width: '100%', marginTop: 2 }} value={form.trang_thai} onChange={handleChange('trang_thai')}>
              <option value="hoat_dong">Hoạt động</option>
              <option value="bi_khoa">Bị khóa</option>
            </select>
          </EditField>
          <EditField label="Mật khẩu tạm" required error={errors.mat_khau}>
            <input type="password" style={inputStyle} value={form.mat_khau} onChange={handleChange('mat_khau')} placeholder="Tối thiểu 6 ký tự" />
          </EditField>
          <EditField label="Xác nhận mật khẩu" required error={errors.xac_nhan_mat_khau}>
            <input type="password" style={inputStyle} value={form.xac_nhan_mat_khau} onChange={handleChange('xac_nhan_mat_khau')} placeholder="Nhập lại mật khẩu" />
          </EditField>
        </div>

        <div className="content-card">
          <h3 className="content-card-title" style={{ marginBottom: 12 }}>Thông tin đối tác</h3>
          <EditField label="Tên công ty / tên đối tác" required error={errors.ten_cong_ty}>
            <input type="text" style={inputStyle} value={form.ten_cong_ty} onChange={handleChange('ten_cong_ty')} placeholder="Công ty TNHH ABC Travel" />
          </EditField>
          <EditField label="Địa chỉ">
            <input type="text" style={inputStyle} value={form.dia_chi} onChange={handleChange('dia_chi')} placeholder="Số nhà, đường, quận/huyện, tỉnh/thành" />
          </EditField>
          <EditField label="Mã số thuế">
            <input type="text" style={inputStyle} value={form.ma_so_thue} onChange={handleChange('ma_so_thue')} placeholder="0123456789" />
          </EditField>
          <EditField label="Phần trăm hoa hồng" error={errors.phan_tram_hoa_hong}>
            <input type="number" min="0" max="100" step="0.01" style={inputStyle} value={form.phan_tram_hoa_hong} onChange={handleChange('phan_tram_hoa_hong')} placeholder="VD: 15" />
          </EditField>
          <EditField label="Ảnh đại diện" error={errors.avatar}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div className="mgmt-avatar" style={{ width: 44, height: 44, fontSize: 14, flexShrink: 0 }}>
                {avatarPreview ? (
                  <img src={avatarPreview} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                ) : (
                  getInitials(form.ten_cong_ty)
                )}
              </div>
              <div>
                <button type="button" className="btn btn-ghost btn-sm" onClick={() => fileInputRef.current?.click()}>
                  {avatarPreview ? 'Đổi ảnh' : 'Chọn ảnh đại diện'}
                </button>
                {avatarPreview && (
                  <button type="button" className="btn btn-ghost btn-sm" style={{ marginLeft: 8, color: '#e05c5c' }} onClick={handleRemoveAvatar}>
                    Xóa
                  </button>
                )}
              </div>
            </div>
          </EditField>
        </div>
      </div>
    </AdminFormModal>
  );
}
