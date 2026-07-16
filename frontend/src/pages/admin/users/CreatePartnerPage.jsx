import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Building2, KeyRound } from 'lucide-react';
import BackButton from '../../../components/common/BackButton';
import ManagementHeader from '../../../components/common/management/ManagementHeader';
import adminUserService from '../../../services/adminUserService';

const INITIAL_FORM = {
  ten_cong_ty: '',
  ma_so_thue: '',
  email_lien_he: '',
  dia_chi: '',
  phan_tram_hoa_hong: '',
  email: '',
  so_dien_thoai: '',
  mat_khau: '',
  trang_thai: 'hoat_dong',
};

const Field = ({ label, required, error, hint, children }) => (
  <div className="create-partner-field">
    <label className="create-partner-label">
      {label}
      {required && <span className="create-partner-required">*</span>}
    </label>
    {children}
    {hint && !error && <p className="create-partner-hint">{hint}</p>}
    {error && <p className="create-partner-error">{error}</p>}
  </div>
);

const CreatePartnerPage = () => {
  const navigate = useNavigate();

  const [formData, setFormData] = useState(INITIAL_FORM);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [fieldErrors, setFieldErrors] = useState({});

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    setFieldErrors((prev) => ({ ...prev, [name]: undefined }));
  };

  const validate = () => {
    const errors = {};
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!formData.ten_cong_ty.trim()) errors.ten_cong_ty = 'Tên công ty / đối tác là bắt buộc';
    if (!formData.email.trim()) errors.email = 'Email đăng nhập là bắt buộc';
    else if (!emailRegex.test(formData.email.trim())) errors.email = 'Email đăng nhập không hợp lệ';
    if (formData.email_lien_he.trim() && !emailRegex.test(formData.email_lien_he.trim())) {
      errors.email_lien_he = 'Email liên hệ không hợp lệ';
    }
    if (!formData.so_dien_thoai.trim()) errors.so_dien_thoai = 'Số điện thoại là bắt buộc';
    if (!formData.mat_khau) errors.mat_khau = 'Mật khẩu khởi tạo là bắt buộc';
    else if (formData.mat_khau.length < 6) errors.mat_khau = '';
    if (formData.phan_tram_hoa_hong !== '') {
      const pct = Number(formData.phan_tram_hoa_hong);
      if (Number.isNaN(pct) || pct < 0 || pct > 100) {
        errors.phan_tram_hoa_hong = 'Hoa hồng phải từ 0 đến 100';
      }
    }
    return errors;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    const errors = validate();
    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      setError('Vui lòng kiểm tra lại các trường được đánh dấu.');
      return;
    }

    setLoading(true);
    try {
      await adminUserService.createPartner({
        ten_cong_ty: formData.ten_cong_ty.trim(),
        ma_so_thue: formData.ma_so_thue.trim() || null,
        email_lien_he: formData.email_lien_he.trim() || null,
        dia_chi: formData.dia_chi.trim() || null,
        phan_tram_hoa_hong: formData.phan_tram_hoa_hong === '' ? 15 : Number(formData.phan_tram_hoa_hong),
        email: formData.email.trim(),
        so_dien_thoai: formData.so_dien_thoai.trim(),
        mat_khau: formData.mat_khau,
        trang_thai: formData.trang_thai,
      });
      navigate('/admin/users', {
        state: { toast: 'Tạo tài khoản đối tác thành công' },
      });
    } catch (err) {
      const resErrors = err.response?.data?.errors;
      if (resErrors) setFieldErrors(resErrors);
      setError(err.response?.data?.message || 'Có lỗi xảy ra khi tạo tài khoản');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mgmt-page create-partner-page">
      <BackButton to="/admin/users" label="Quay lại danh sách" />

      <ManagementHeader
        title="Tạo Tài Khoản Đối Tác"
        subtitle="Hệ thống sẽ cấp quyền quản lý khách sạn & phòng cho tài khoản này."
      />

      {error && <div className="create-partner-alert">{error}</div>}

      <form onSubmit={handleSubmit} className="create-partner-form">
        <section className="content-card create-partner-card">
          <div className="create-partner-card-head">
            <span className="create-partner-card-icon">
              <Building2 size={18} strokeWidth={2} />
            </span>
            <div>
              <h3 className="create-partner-card-title">Thông tin cơ sở kinh doanh</h3>
              <p className="create-partner-card-desc">Thông tin hồ sơ đối tác hiển thị trong hệ thống.</p>
            </div>
          </div>

          <div className="create-partner-grid">
            <Field label="Tên công ty / đối tác" required error={fieldErrors.ten_cong_ty}>
              <input
                type="text"
                name="ten_cong_ty"
                className="search-input create-partner-input"
                value={formData.ten_cong_ty}
                onChange={handleChange}
                placeholder="VD: Công ty TNHH Mường Thanh"
              />
            </Field>

            <Field label="Mã số thuế" error={fieldErrors.ma_so_thue}>
              <input
                type="text"
                name="ma_so_thue"
                className="search-input create-partner-input"
                value={formData.ma_so_thue}
                onChange={handleChange}
                placeholder="VD: 0312345678"
              />
            </Field>

            <Field label="Email liên hệ" error={fieldErrors.email_lien_he} hint="Email hiển thị để khách/hệ thống liên hệ (khác email đăng nhập).">
              <input
                type="email"
                name="email_lien_he"
                className="search-input create-partner-input"
                value={formData.email_lien_he}
                onChange={handleChange}
                placeholder="lienhe@congty.com"
              />
            </Field>

            <Field label="Tỉ lệ hoa hồng (%)" error={fieldErrors.phan_tram_hoa_hong} hint="Để trống sẽ dùng mức mặc định hệ thống 15%.">
              <input
                type="number"
                name="phan_tram_hoa_hong"
                min="0"
                max="100"
                step="0.01"
                className="search-input create-partner-input"
                value={formData.phan_tram_hoa_hong}
                onChange={handleChange}
                placeholder="Mặc định 15%"
              />
            </Field>

            <Field label="Địa chỉ công ty" error={fieldErrors.dia_chi}>
              <textarea
                name="dia_chi"
                rows={2}
                className="search-input create-partner-input create-partner-textarea"
                value={formData.dia_chi}
                onChange={handleChange}
                placeholder="Số nhà, đường, phường/xã, quận/huyện, tỉnh/thành..."
              />
            </Field>
          </div>
        </section>

        <section className="content-card create-partner-card">
          <div className="create-partner-card-head">
            <span className="create-partner-card-icon">
              <KeyRound size={18} strokeWidth={2} />
            </span>
            <div>
              <h3 className="create-partner-card-title">Thông tin tài khoản đăng nhập</h3>
              <p className="create-partner-card-desc">Tài khoản để đối tác đăng nhập vào hệ thống.</p>
            </div>
          </div>

          <div className="create-partner-grid">
            <Field label="Email đăng nhập" required error={fieldErrors.email}>
              <input
                type="email"
                name="email"
                autoComplete="off"
                className="search-input create-partner-input"
                value={formData.email}
                onChange={handleChange}
                placeholder="doitac@gmail.com"
              />
            </Field>

            <Field label="Số điện thoại" required error={fieldErrors.so_dien_thoai}>
              <input
                type="tel"
                name="so_dien_thoai"
                className="search-input create-partner-input"
                value={formData.so_dien_thoai}
                onChange={handleChange}
                placeholder="0987654321"
              />
            </Field>

            <Field label="Mật khẩu khởi tạo" required error={fieldErrors.mat_khau} hint="">
              <input
                type="password"
                name="mat_khau"
                autoComplete="new-password"
                className="search-input create-partner-input"
                value={formData.mat_khau}
                onChange={handleChange}
                placeholder="••••••••"
              />
            </Field>

            <Field label="Trạng thái tài khoản" error={fieldErrors.trang_thai}>
              <select
                name="trang_thai"
                className="search-input create-partner-input"
                value={formData.trang_thai}
                onChange={handleChange}
              >
                <option value="hoat_dong">Đang hoạt động</option>
                <option value="bi_khoa">Bị khóa</option>
              </select>
            </Field>
          </div>
        </section>

        <div className="create-partner-actions">
          <button
            type="button"
            className="btn btn-ghost"
            onClick={() => navigate('/admin/users')}
            disabled={loading}
          >
            Hủy
          </button>
          <button type="submit" className="btn btn-primary" disabled={loading}>
            {loading ? 'Đang xử lý...' : 'Xác nhận tạo tài khoản'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default CreatePartnerPage;
