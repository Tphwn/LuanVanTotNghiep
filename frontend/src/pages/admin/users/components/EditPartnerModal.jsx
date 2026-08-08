import { useEffect, useState } from 'react';
import adminUserService from '../../../../services/adminUserService';
import { sanitizePhoneInput, validatePhone } from '../../../../utils/authValidation';

const labelStyle = { display: 'block', fontSize: 13, fontWeight: 500, marginBottom: 6, color: '#334155' };
const errStyle = { margin: '4px 0 0', fontSize: 12, color: '#e05c5c' };

const getPartner = (user) => user?.doi_tac_doi_tac_ma_nguoi_dungTonguoi_dung;

const toText = (value) => {
  if (value == null || value === '') return '';
  return String(value);
};

const toCommissionText = (value) => {
  if (value == null || value === '') return '';
  const num = Number(value);
  return Number.isFinite(num) ? String(num) : '';
};

const buildForm = (user) => {
  const partner = getPartner(user) || {};
  return {
    ten_cong_ty: toText(partner.ten_cong_ty),
    ma_so_thue: toText(partner.ma_so_thue),
    dia_chi: toText(partner.dia_chi),
    phan_tram_hoa_hong: toCommissionText(partner.phan_tram_hoa_hong),
    email: toText(user?.email),
    so_dien_thoai: toText(user?.so_dien_thoai),
    trang_thai: user?.trang_thai === 'bi_khoa' ? 'bi_khoa' : 'hoat_dong',
  };
};

const EMPTY_FORM = {
  ten_cong_ty: '',
  ma_so_thue: '',
  dia_chi: '',
  phan_tram_hoa_hong: '',
  email: '',
  so_dien_thoai: '',
  trang_thai: 'hoat_dong',
};

const EditPartnerModal = ({ isOpen, user, onClose, onSuccess }) => {
  const [formData, setFormData] = useState(EMPTY_FORM);
  const [loading, setLoading] = useState(false);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [error, setError] = useState('');
  const [fieldErrors, setFieldErrors] = useState({});

  useEffect(() => {
    if (!isOpen || !user?.ma_nguoi_dung) return undefined;

    let cancelled = false;
    const hydrate = async () => {
      setLoadingDetail(true);
      setError('');
      setFieldErrors({});
      try {
        const res = await adminUserService.getUserById(user.ma_nguoi_dung);
        if (!cancelled) {
          setFormData(buildForm(res.data?.data || user));
        }
      } catch {
        if (!cancelled) {
          setFormData(buildForm(user));
        }
      } finally {
        if (!cancelled) setLoadingDetail(false);
      }
    };

    hydrate();
    return () => { cancelled = true; };
  }, [isOpen, user]);

  if (!isOpen || !user) return null;

  const handleChange = (e) => {
    const { name, value } = e.target;
    const nextValue = name === 'so_dien_thoai' ? sanitizePhoneInput(value) : value;
    setFormData((prev) => ({ ...prev, [name]: nextValue }));
    setFieldErrors((prev) => ({ ...prev, [name]: undefined }));
  };

  const validate = () => {
    const errors = {};
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!formData.ten_cong_ty.trim()) errors.ten_cong_ty = 'Tên công ty / đối tác là bắt buộc';
    if (!formData.email.trim()) errors.email = 'Email đăng nhập là bắt buộc';
    else if (!emailRegex.test(formData.email.trim())) errors.email = 'Email đăng nhập không hợp lệ';
    const phoneErr = validatePhone(formData.so_dien_thoai);
    if (phoneErr) errors.so_dien_thoai = phoneErr;
    if (formData.phan_tram_hoa_hong === '') {
      errors.phan_tram_hoa_hong = 'Tỉ lệ hoa hồng là bắt buộc';
    } else {
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
      return;
    }

    setLoading(true);
    try {
      const payload = {
        ten_cong_ty: formData.ten_cong_ty.trim(),
        ma_so_thue: formData.ma_so_thue.trim() || null,
        dia_chi: formData.dia_chi.trim() || null,
        phan_tram_hoa_hong: Number(formData.phan_tram_hoa_hong),
        email: formData.email.trim(),
        so_dien_thoai: formData.so_dien_thoai.trim(),
        trang_thai: formData.trang_thai,
      };

      const res = await adminUserService.updatePartner(user.ma_nguoi_dung, payload);
      onSuccess?.(res.data?.data, res.data?.message || 'Cập nhật đối tác thành công');
    } catch (err) {
      const resErrors = err.response?.data?.errors;
      if (resErrors) setFieldErrors(resErrors);
      setError(err.response?.data?.message || 'Có lỗi xảy ra khi cập nhật');
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
          <h3 className="modal-title">Sửa tài khoản đối tác</h3>
          <button type="button" className="modal-close" onClick={onClose}>×</button>
        </div>

        {error && (
          <div style={{
            background: '#fff0f0', border: '1px solid #ffb3b3', color: '#e05c5c',
            padding: '10px 14px', borderRadius: 8, marginBottom: 14, fontSize: 13,
          }}
          >
            {error}
          </div>
        )}

        {loadingDetail ? (
          <div style={{ padding: '24px 0', textAlign: 'center', color: '#5a7a72' }}>
            Đang tải thông tin đối tác...
          </div>
        ) : (
        <form onSubmit={handleSubmit}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
            <div>
              <label style={labelStyle}>
                Tên công ty / đối tác
                {' '}
                <span style={{ color: '#e05c5c' }}>*</span>
              </label>
              <input type="text" {...inputProps('ten_cong_ty')} />
              {fieldErrors.ten_cong_ty && <p style={errStyle}>{fieldErrors.ten_cong_ty}</p>}
            </div>
            <div>
              <label style={labelStyle}>Mã số thuế</label>
              <input type="text" placeholder="VD: 0312345678" {...inputProps('ma_so_thue')} />
            </div>
            <div>
              <label style={labelStyle}>
                Tỉ lệ hoa hồng (%)
                {' '}
                <span style={{ color: '#e05c5c' }}>*</span>
              </label>
              <input
                type="number"
                min="0"
                max="100"
                step="0.01"
                placeholder="VD: 15"
                {...inputProps('phan_tram_hoa_hong')}
              />
              {fieldErrors.phan_tram_hoa_hong && (
                <p style={errStyle}>{fieldErrors.phan_tram_hoa_hong}</p>
              )}
            </div>
            <div>
              <label style={labelStyle}>Trạng thái</label>
              <select {...inputProps('trang_thai')}>
                <option value="hoat_dong">Đang hoạt động</option>
                <option value="bi_khoa">Bị khóa</option>
              </select>
            </div>
            <div style={{ gridColumn: '1 / -1' }}>
              <label style={labelStyle}>Địa chỉ công ty</label>
              <input
                type="text"
                placeholder="Số nhà, đường, phường/xã, quận/huyện, tỉnh/thành..."
                {...inputProps('dia_chi')}
              />
            </div>
            <div>
              <label style={labelStyle}>
                Email đăng nhập
                {' '}
                <span style={{ color: '#e05c5c' }}>*</span>
              </label>
              <input type="email" autoComplete="off" {...inputProps('email')} />
              {fieldErrors.email && <p style={errStyle}>{fieldErrors.email}</p>}
            </div>
            <div>
              <label style={labelStyle}>
                Số điện thoại
                {' '}
                <span style={{ color: '#e05c5c' }}>*</span>
              </label>
              <input
                type="tel"
                inputMode="numeric"
                maxLength={10}
                {...inputProps('so_dien_thoai')}
              />
              {fieldErrors.so_dien_thoai && <p style={errStyle}>{fieldErrors.so_dien_thoai}</p>}
            </div>
          </div>

          <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 20 }}>
            <button type="button" className="btn btn-ghost" onClick={onClose} disabled={loading}>
              Hủy
            </button>
            <button type="submit" className="btn btn-primary" disabled={loading || loadingDetail}>
              {loading ? 'Đang lưu...' : 'Lưu thay đổi'}
            </button>
          </div>
        </form>
        )}
      </div>
    </div>
  );
};

export default EditPartnerModal;
