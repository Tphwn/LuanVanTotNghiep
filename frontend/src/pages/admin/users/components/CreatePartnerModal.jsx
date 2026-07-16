import { useState } from 'react';
import adminUserService from '../../../../services/adminUserService';

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

const labelStyle = { display: 'block', fontSize: 13, fontWeight: 500, marginBottom: 6, color: '#334155' };
const errStyle = { margin: '4px 0 0', fontSize: 12, color: '#e05c5c' };

const CreatePartnerModal = ({ isOpen, onClose, onSuccess }) => {
  const [formData, setFormData] = useState(INITIAL_FORM);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [fieldErrors, setFieldErrors] = useState({});

  if (!isOpen) return null;

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
    else if (formData.mat_khau.length < 6) errors.mat_khau = 'Mật khẩu tối thiểu 6 ký tự';
    if (formData.phan_tram_hoa_hong !== '') {
      const pct = Number(formData.phan_tram_hoa_hong);
      if (Number.isNaN(pct) || pct < 0 || pct > 100) errors.phan_tram_hoa_hong = 'Hoa hồng phải từ 0 đến 100';
    }
    return errors;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    const errors = validate();
    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
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
      setFormData(INITIAL_FORM);
      onSuccess?.('Tạo tài khoản đối tác thành công');
    } catch (err) {
      const resErrors = err.response?.data?.errors;
      if (resErrors) setFieldErrors(resErrors);
      setError(err.response?.data?.message || 'Có lỗi xảy ra khi tạo tài khoản');
    } finally {
      setLoading(false);
    }
  };

  const inputProps = (name) => ({
    name,
    value: formData[name],
    onChange: handleChange,
    className: 'search-input',
    style: { width: '100%', boxSizing: 'border-box' },
  });

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-box" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3 className="modal-title">Tạo tài khoản đối tác</h3>
          <button type="button" className="modal-close" onClick={onClose}>×</button>
        </div>

        {error && (
          <div style={{
            background: '#fff0f0', border: '1px solid #ffb3b3', color: '#e05c5c',
            padding: '10px 14px', borderRadius: 8, marginBottom: 14, fontSize: 13,
          }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
            <div>
              <label style={labelStyle}>Tên công ty / đối tác <span style={{ color: '#e05c5c' }}>*</span></label>
              <input type="text" placeholder="VD: Công ty TNHH Mường Thanh" {...inputProps('ten_cong_ty')} />
              {fieldErrors.ten_cong_ty && <p style={errStyle}>{fieldErrors.ten_cong_ty}</p>}
            </div>
            <div>
              <label style={labelStyle}>Mã số thuế</label>
              <input type="text" placeholder="VD: 0312345678" {...inputProps('ma_so_thue')} />
            </div>
            <div>
              <label style={labelStyle}>Email liên hệ</label>
              <input type="email" placeholder="lienhe@congty.com" {...inputProps('email_lien_he')} />
              {fieldErrors.email_lien_he && <p style={errStyle}>{fieldErrors.email_lien_he}</p>}
            </div>
            <div>
              <label style={labelStyle}>Tỉ lệ hoa hồng (%)</label>
              <input type="number" min="0" max="100" step="0.01" placeholder="Mặc định 15%" {...inputProps('phan_tram_hoa_hong')} />
              {fieldErrors.phan_tram_hoa_hong && <p style={errStyle}>{fieldErrors.phan_tram_hoa_hong}</p>}
            </div>
            <div style={{ gridColumn: '1 / -1' }}>
              <label style={labelStyle}>Địa chỉ công ty</label>
              <input type="text" placeholder="Số nhà, đường, phường/xã, quận/huyện, tỉnh/thành..." {...inputProps('dia_chi')} />
            </div>
            <div>
              <label style={labelStyle}>Email đăng nhập <span style={{ color: '#e05c5c' }}>*</span></label>
              <input type="email" autoComplete="off" placeholder="doitac@gmail.com" {...inputProps('email')} />
              {fieldErrors.email && <p style={errStyle}>{fieldErrors.email}</p>}
            </div>
            <div>
              <label style={labelStyle}>Số điện thoại <span style={{ color: '#e05c5c' }}>*</span></label>
              <input type="tel" placeholder="0987654321" {...inputProps('so_dien_thoai')} />
              {fieldErrors.so_dien_thoai && <p style={errStyle}>{fieldErrors.so_dien_thoai}</p>}
            </div>
            <div>
              <label style={labelStyle}>Mật khẩu khởi tạo <span style={{ color: '#e05c5c' }}>*</span></label>
              <input type="password" autoComplete="new-password" placeholder="Tối thiểu 6 ký tự" {...inputProps('mat_khau')} />
              {fieldErrors.mat_khau && <p style={errStyle}>{fieldErrors.mat_khau}</p>}
            </div>
            <div>
              <label style={labelStyle}>Trạng thái</label>
              <select {...inputProps('trang_thai')}>
                <option value="hoat_dong">Đang hoạt động</option>
                <option value="bi_khoa">Bị khóa</option>
              </select>
            </div>
          </div>

          <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 20 }}>
            <button type="button" className="btn btn-ghost" onClick={onClose} disabled={loading}>Hủy</button>
            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? 'Đang xử lý...' : 'Tạo tài khoản'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreatePartnerModal;
