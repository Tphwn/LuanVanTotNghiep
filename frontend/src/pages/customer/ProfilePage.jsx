import { useEffect, useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';
import customerAccountService from '../../services/customerAccountService';
import '../../assets/styles/account.css';
import { CUSTOMER_PROFILE_UPDATED } from '../../components/customer/account/CustomerAccountSidebar';
import Toast from '../../components/common/Toast';
import useToast from '../../hooks/useToast';
import {
  AUTH_MSG,
  validatePhone,
  validatePassword,
  validatePasswordConfirm,
  validateNewPasswordNotSame,
} from '../../utils/authValidation';

function ProfilePage() {
  const [activeTab, setActiveTab] = useState('info');
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [savingInfo, setSavingInfo] = useState(false);
  const [savingPwd, setSavingPwd] = useState(false);
  const { toast, showToast } = useToast();

  const [infoForm, setInfoForm] = useState({
    ho_ten: '',
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
      const res = await customerAccountService.getProfile();
      const data = res.data.data;
      setProfile(data);
      setInfoForm({
        ho_ten: data.ho_ten || '',
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
    if (!infoForm.ho_ten.trim()) {
      errors.ho_ten = 'Họ tên không được để trống.';
    }
    const phoneErr = validatePhone(infoForm.so_dien_thoai);
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
      const res = await customerAccountService.updateProfile({
        ho_ten: infoForm.ho_ten.trim(),
        so_dien_thoai: infoForm.so_dien_thoai.trim(),
      });
      setProfile(res.data.data);
      setInfoForm({
        ho_ten: res.data.data.ho_ten || infoForm.ho_ten.trim(),
        so_dien_thoai: res.data.data.so_dien_thoai || infoForm.so_dien_thoai.trim(),
      });
      showToast('Lưu thành công');
      window.dispatchEvent(new Event(CUSTOMER_PROFILE_UPDATED));
    } catch (err) {
      const msg = err.response?.data?.message || '';
      if (msg.includes('điện thoại') || msg.includes('Số điện thoại')) {
        setInfoFieldErrors({ so_dien_thoai: msg });
      } else if (msg.includes('Họ tên') || msg.includes('tên')) {
        setInfoFieldErrors({ ho_ten: msg });
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
      await customerAccountService.changePassword({
        mat_khau_cu: pwdForm.mat_khau_cu,
        mat_khau_moi: pwdForm.mat_khau_moi,
        xac_nhan_mat_khau: pwdForm.xac_nhan_mat_khau,
      });
      setPwdForm({ mat_khau_cu: '', mat_khau_moi: '', xac_nhan_mat_khau: '' });
      showToast('Đổi mật khẩu thành công');
    } catch (err) {
      const msg = err.response?.data?.message || AUTH_MSG.PASSWORD_CURRENT_WRONG;
      if (msg.includes('hiện tại') || msg.includes('chính xác')) {
        setPwdFieldErrors({ mat_khau_cu: AUTH_MSG.PASSWORD_CURRENT_WRONG });
      } else if (msg.includes('khớp')) {
        setPwdFieldErrors({ xac_nhan_mat_khau: AUTH_MSG.PASSWORD_CONFIRM_MISMATCH });
      } else {
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
        Đang tải thông tin tài khoản...
      </div>
    );
  }

  return (
    <div className="customer-account-page">
      <div className="customer-account-container">
        <Toast toast={toast} />

        <div className="customer-account-header">
          <h1>Tài khoản của tôi</h1>
        </div>

        <div className="customer-account-tabs">
          <button
            type="button"
            className={activeTab === 'info' ? 'active' : ''}
            onClick={() => {
              setActiveTab('info');
              setPwdFieldErrors({});
            }}
          >
            Thông tin cá nhân
          </button>
          <button
            type="button"
            className={activeTab === 'settings' ? 'active' : ''}
            onClick={() => {
              setActiveTab('settings');
              setInfoFieldErrors({});
            }}
          >
            Cài đặt tài khoản
          </button>
        </div>

        {activeTab === 'info' && (
          <div className="customer-card">
            <h3>Thông tin cá nhân</h3>
            <p className="customer-card-desc">Cập nhật thông tin dùng để liên hệ với bạn.</p>

            <form onSubmit={handleSaveInfo} noValidate>
              <div className="customer-form-group">
                <label htmlFor="ho_ten">
                  Họ tên
                  {' '}
                  <span>*</span>
                </label>
                <input
                  id="ho_ten"
                  type="text"
                  className={infoFieldErrors.ho_ten ? 'input-invalid' : ''}
                  value={infoForm.ho_ten}
                  onChange={(e) => {
                    setInfoForm({ ...infoForm, ho_ten: e.target.value });
                    setInfoFieldErrors((prev) => ({ ...prev, ho_ten: undefined }));
                  }}
                  placeholder="Nhập họ tên của bạn"
                />
                {infoFieldErrors.ho_ten && (
                  <p className="form-field-error">{infoFieldErrors.ho_ten}</p>
                )}
              </div>

              <div className="customer-form-group">
                <label htmlFor="email_dang_ky">Email đăng nhập</label>
                <input
                  id="email_dang_ky"
                  type="email"
                  value={profile?.email_dang_ky || profile?.email || ''}
                  readOnly
                  className="readonly"
                />
                <p>Email dùng để đăng nhập hệ thống, không thể thay đổi.</p>
              </div>

              <div className="customer-form-group">
                <label htmlFor="so_dien_thoai">Số điện thoại</label>
                <input
                  id="so_dien_thoai"
                  type="tel"
                  className={infoFieldErrors.so_dien_thoai ? 'input-invalid' : ''}
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

              <button
                type="submit"
                className="customer-btn customer-btn-primary"
                disabled={savingInfo}
              >
                {savingInfo ? 'Đang lưu...' : 'Lưu thay đổi'}
              </button>
            </form>
          </div>
        )}

        {activeTab === 'settings' && (
          <div className="customer-settings-grid">
            <div className="customer-card customer-password-card">
              <h3>Đổi mật khẩu</h3>
              <p className="customer-card-desc">Thay đổi mật khẩu đăng nhập của bạn.</p>

              <form onSubmit={handleChangePassword} noValidate>
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
                  <div key={field.key} className="customer-form-group">
                    <label htmlFor={field.key}>{field.label}</label>
                    <div className="customer-pwd-wrap">
                      <input
                        id={field.key}
                        type={showPwd[field.key] ? 'text' : 'password'}
                        autoComplete={field.autoComplete}
                        className={pwdFieldErrors[field.key] ? 'input-invalid' : ''}
                        value={pwdForm[field.key]}
                        onChange={(e) => {
                          setPwdForm({ ...pwdForm, [field.key]: e.target.value });
                          setPwdFieldErrors((prev) => ({ ...prev, [field.key]: undefined }));
                        }}
                        placeholder={field.placeholder}
                      />
                      <button
                        type="button"
                        className="customer-pwd-toggle"
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

                <button
                  type="submit"
                  className="customer-btn customer-btn-primary"
                  disabled={savingPwd}
                >
                  {savingPwd ? 'Đang xử lý...' : 'Đổi mật khẩu'}
                </button>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default ProfilePage;
