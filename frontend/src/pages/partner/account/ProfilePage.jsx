import { useEffect, useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';
import api from '../../../services/api';
import ManagementHeader from '../../../components/common/management/ManagementHeader';
import Toast from '../../../components/common/Toast';
import useToast from '../../../hooks/useToast';
import {
  AUTH_MSG,
  validatePhone,
  validatePassword,
  validatePasswordConfirm,
  validateNewPasswordNotSame,
} from '../../../utils/authValidation';

const formatDate = (d) => (d ? new Date(d).toLocaleString('vi-VN') : '—');

const ROLE_LABEL = {
  doi_tac: 'Đối tác',
  khach_hang: 'Khách hàng',
  admin: 'Admin',
};

const STATUS_LABEL = {
  hoat_dong: 'Đang hoạt động',
  bi_khoa: 'Bị khóa',
};

const getNameInitial = (name) => {
  if (!name) return 'Đ';
  const parts = name.trim().split(/\s+/).filter(Boolean);
  const word = parts[parts.length - 1] || parts[0];
  return word[0]?.toUpperCase() || '?';
};

const ProfilePage = () => {
  const [activeTab, setActiveTab] = useState('info');
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [savingInfo, setSavingInfo] = useState(false);
  const [savingPwd, setSavingPwd] = useState(false);
  const { toast, showToast } = useToast();

  const [infoForm, setInfoForm] = useState({
    ten_hien_thi: '',
    so_dien_thoai: '',
  });
  const [infoFieldErrors, setInfoFieldErrors] = useState({});

  const [pwdForm, setPwdForm] = useState({
    mat_khau_cu: '',
    mat_khau_moi: '',
    xac_nhan_mat_khau: '',
  });
  const [pwdFieldErrors, setPwdFieldErrors] = useState({});

  const [showPwd, setShowPwd] = useState({
    mat_khau_cu: false,
    mat_khau_moi: false,
    xac_nhan_mat_khau: false,
  });

  const loadProfile = async () => {
    setLoading(true);
    try {
      const res = await api.get('/partner/account/profile');
      const data = res.data.data;
      setProfile(data);
      setInfoForm({
        ten_hien_thi: data.ten_hien_thi || '',
        so_dien_thoai: data.so_dien_thoai || '',
      });
    } catch (err) {
      showToast(err.response?.data?.message || 'Không tải được thông tin tài khoản', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProfile();
  }, []);

  const validateInfoForm = () => {
    const errors = {};
    const ten = infoForm.ten_hien_thi.trim();
    const phone = infoForm.so_dien_thoai.trim();

    if (!ten) {
      errors.ten_hien_thi = 'Tên hiển thị không được để trống.';
    }

    const phoneErr = validatePhone(phone);
    if (phoneErr) errors.so_dien_thoai = phoneErr;

    return errors;
  };

  const handleSaveInfo = async (e) => {
    e.preventDefault();
    const errors = validateInfoForm();
    if (Object.keys(errors).length > 0) {
      setInfoFieldErrors(errors);
      showToast('Cập nhật không thành công. Vui lòng kiểm tra lại thông tin.', 'error');
      return;
    }

    setInfoFieldErrors({});
    setSavingInfo(true);
    try {
      const ten = infoForm.ten_hien_thi.trim();
      const phone = infoForm.so_dien_thoai.trim();
      const res = await api.put('/partner/account/profile', {
        ten_hien_thi: ten,
        so_dien_thoai: phone,
      });
      setProfile(res.data.data);
      setInfoForm({
        ten_hien_thi: res.data.data.ten_hien_thi || ten,
        so_dien_thoai: res.data.data.so_dien_thoai || phone,
      });
      showToast('Lưu thành công');
    } catch (err) {
      const msg = err.response?.data?.message || '';
      if (msg.includes('điện thoại') || msg.includes('Số điện thoại')) {
        setInfoFieldErrors({ so_dien_thoai: msg });
      } else if (msg.includes('Tên') || msg.includes('hiển thị')) {
        setInfoFieldErrors({ ten_hien_thi: msg });
      }
      showToast('Cập nhật không thành công. Vui lòng kiểm tra lại thông tin.', 'error');
    } finally {
      setSavingInfo(false);
    }
  };

  const validatePwdForm = () => {
    const errors = {};
    const { mat_khau_cu, mat_khau_moi, xac_nhan_mat_khau } = pwdForm;

    if (!String(mat_khau_cu || '')) {
      errors.mat_khau_cu = AUTH_MSG.PASSWORD_CURRENT_REQUIRED;
    }

    const newPwdErr = validatePassword(mat_khau_moi);
    if (newPwdErr) {
      errors.mat_khau_moi = newPwdErr;
    } else {
      const sameErr = validateNewPasswordNotSame(mat_khau_cu, mat_khau_moi);
      if (sameErr) errors.mat_khau_moi = sameErr;
    }

    const confirmErr = validatePasswordConfirm(mat_khau_moi, xac_nhan_mat_khau);
    if (confirmErr) errors.xac_nhan_mat_khau = confirmErr;

    return errors;
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    const errors = validatePwdForm();
    if (Object.keys(errors).length > 0) {
      setPwdFieldErrors(errors);
      showToast('Đổi mật khẩu không thành công. Vui lòng kiểm tra lại.', 'error');
      return;
    }

    setPwdFieldErrors({});
    setSavingPwd(true);
    try {
      await api.put('/partner/account/password', {
        mat_khau_cu: pwdForm.mat_khau_cu,
        mat_khau_moi: pwdForm.mat_khau_moi,
        xac_nhan_mat_khau: pwdForm.xac_nhan_mat_khau,
      });
      setPwdForm({ mat_khau_cu: '', mat_khau_moi: '', xac_nhan_mat_khau: '' });
      showToast('Đổi mật khẩu thành công');
    } catch (err) {
      const msg = err.response?.data?.message || '';
      if (msg.includes('hiện tại') || msg.includes('chính xác')) {
        setPwdFieldErrors({ mat_khau_cu: AUTH_MSG.PASSWORD_CURRENT_WRONG });
      } else if (msg.includes('khớp')) {
        setPwdFieldErrors({ xac_nhan_mat_khau: AUTH_MSG.PASSWORD_CONFIRM_MISMATCH });
      } else if (msg.includes('Mật khẩu') || msg.includes('ký tự') || msg.includes('chữ')) {
        setPwdFieldErrors({ mat_khau_moi: msg });
      }
      showToast('Đổi mật khẩu không thành công. Vui lòng kiểm tra lại.', 'error');
    } finally {
      setSavingPwd(false);
    }
  };

  const toggleShowPwd = (field) => {
    setShowPwd((prev) => ({ ...prev, [field]: !prev[field] }));
  };

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: 60, color: '#5a7a72' }}>
        Đang tải thông tin...
      </div>
    );
  }

  const roleLabel = ROLE_LABEL[profile?.vai_tro] || 'Đối tác';
  const statusKey = profile?.trang_thai_tai_khoan;
  const statusLabel = STATUS_LABEL[statusKey] || statusKey || '—';
  const statusBadgeClass =
    statusKey === 'bi_khoa'
      ? 'partner-account-status-badge is-locked'
      : 'partner-account-status-badge is-active';

  return (
    <div className="mgmt-page partner-account-page">
      <ManagementHeader
        title="Quản lý tài khoản"
        subtitle="Quản lý thông tin cá nhân và bảo mật tài khoản của bạn."
      />

      <Toast toast={toast} />

      <div className="partner-account-shell">
        <div className="partner-account-summary content-card">
          <div className="partner-account-avatar">
            {getNameInitial(profile?.ten_hien_thi)}
          </div>
          <div className="partner-account-summary-meta">
            <h2>{profile?.ten_hien_thi || 'Đối tác'}</h2>
            <p className="partner-account-email">{profile?.email_dang_ky}</p>
            <div className="partner-account-role-status">
              <span className="partner-account-role-chip">{roleLabel}</span>
              <span className={statusBadgeClass}>{statusLabel}</span>
            </div>
            <p className="partner-account-last-login">
              Đăng nhập lần cuối:
              {' '}
              {formatDate(profile?.dang_nhap_cuoi)}
            </p>
          </div>
        </div>

        <div className="partner-account-tabs">
          <button
            type="button"
            className={`partner-account-tab${activeTab === 'info' ? ' is-active' : ''}`}
            onClick={() => {
              setActiveTab('info');
              setPwdFieldErrors({});
            }}
          >
            Hồ sơ cá nhân
          </button>
          <button
            type="button"
            className={`partner-account-tab${activeTab === 'security' ? ' is-active' : ''}`}
            onClick={() => {
              setActiveTab('security');
              setInfoFieldErrors({});
            }}
          >
            Bảo mật tài khoản
          </button>
        </div>

        <div className="content-card partner-account-panel">
          {activeTab === 'info' ? (
            <form onSubmit={handleSaveInfo} className="partner-account-form" noValidate>
              <div className="partner-account-field">
                <label htmlFor="ten_hien_thi">Tên hiển thị</label>
                <input
                  id="ten_hien_thi"
                  className={`search-input${infoFieldErrors.ten_hien_thi ? ' input-invalid' : ''}`}
                  value={infoForm.ten_hien_thi}
                  onChange={(e) => {
                    setInfoForm({ ...infoForm, ten_hien_thi: e.target.value });
                    setInfoFieldErrors((prev) => ({ ...prev, ten_hien_thi: undefined }));
                  }}
                  placeholder="Nhập tên hiển thị"
                />
                {infoFieldErrors.ten_hien_thi && (
                  <p className="form-field-error">{infoFieldErrors.ten_hien_thi}</p>
                )}
              </div>

              <div className="partner-account-field-row">
                <div className="partner-account-field">
                  <label htmlFor="email_dang_ky">Email liên hệ</label>
                  <input
                    id="email_dang_ky"
                    type="email"
                    className="search-input is-readonly"
                    value={profile?.email_dang_ky || ''}
                    readOnly
                    disabled
                  />
                  <span className="partner-account-hint">Không thể thay đổi</span>
                </div>

                <div className="partner-account-field">
                  <label htmlFor="so_dien_thoai">Số điện thoại</label>
                  <input
                    id="so_dien_thoai"
                    type="tel"
                    className={`search-input${infoFieldErrors.so_dien_thoai ? ' input-invalid' : ''}`}
                    value={infoForm.so_dien_thoai}
                    onChange={(e) => {
                      setInfoForm({ ...infoForm, so_dien_thoai: e.target.value });
                      setInfoFieldErrors((prev) => ({ ...prev, so_dien_thoai: undefined }));
                    }}
                    placeholder="09xxxxxxxx"
                  />
                  {infoFieldErrors.so_dien_thoai && (
                    <p className="form-field-error">{infoFieldErrors.so_dien_thoai}</p>
                  )}
                </div>
              </div>

              <div className="partner-account-form-actions">
                <button type="submit" className="btn btn-primary" disabled={savingInfo}>
                  {savingInfo ? 'Đang lưu...' : 'Lưu thay đổi'}
                </button>
              </div>
            </form>
          ) : (
            <form onSubmit={handleChangePassword} className="partner-account-form" noValidate>
              {[
                {
                  key: 'mat_khau_cu',
                  label: 'Mật khẩu hiện tại',
                  placeholder: 'Nhập mật khẩu hiện tại',
                  autoComplete: 'current-password',
                },
                {
                  key: 'mat_khau_moi',
                  label: 'Mật khẩu mới',
                  placeholder: 'Ít nhất 6 ký tự, gồm chữ cái và số',
                  autoComplete: 'new-password',
                },
                {
                  key: 'xac_nhan_mat_khau',
                  label: 'Xác nhận mật khẩu mới',
                  placeholder: 'Nhập lại mật khẩu mới',
                  autoComplete: 'new-password',
                },
              ].map((field) => (
                <div key={field.key} className="partner-account-field">
                  <label htmlFor={field.key}>{field.label}</label>
                  <div className="partner-account-pwd-wrap">
                    <input
                      id={field.key}
                      type={showPwd[field.key] ? 'text' : 'password'}
                      autoComplete={field.autoComplete}
                      className={`search-input${pwdFieldErrors[field.key] ? ' input-invalid' : ''}`}
                      value={pwdForm[field.key]}
                      onChange={(e) => {
                        setPwdForm({ ...pwdForm, [field.key]: e.target.value });
                        setPwdFieldErrors((prev) => ({ ...prev, [field.key]: undefined }));
                      }}
                      placeholder={field.placeholder}
                    />
                    <button
                      type="button"
                      className="partner-account-pwd-toggle"
                      onClick={() => toggleShowPwd(field.key)}
                      aria-label={showPwd[field.key] ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
                    >
                      {showPwd[field.key] ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                  {pwdFieldErrors[field.key] && (
                    <p className="form-field-error">{pwdFieldErrors[field.key]}</p>
                  )}
                </div>
              ))}

              <div className="partner-account-form-actions">
                <button type="submit" className="btn btn-primary" disabled={savingPwd}>
                  {savingPwd ? 'Đang xử lý...' : 'Đổi mật khẩu'}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;
