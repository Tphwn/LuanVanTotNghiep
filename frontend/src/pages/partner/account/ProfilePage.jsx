import { useEffect, useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';
import api from '../../../services/api';
import ManagementHeader from '../../../components/common/management/ManagementHeader';
import Toast from '../../../components/common/Toast';
import useToast from '../../../hooks/useToast';
import {
  AUTH_MSG,
  validatePhone,
  sanitizePhoneInput,
  validatePassword,
  validatePasswordConfirm,
  validateNewPasswordNotSame,
} from '../../../utils/authValidation';
import {
  validateBankAccountForm,
  sanitizeAccountNumberInput,
} from '../../../utils/bankAccountValidation';

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
  const [savingBank, setSavingBank] = useState(false);
  const [banks, setBanks] = useState([]);
  const [banksLoading, setBanksLoading] = useState(false);
  const { toast, showToast } = useToast();

  const [infoForm, setInfoForm] = useState({
    ten_hien_thi: '',
    so_dien_thoai: '',
    dia_chi: '',
  });
  const [infoFieldErrors, setInfoFieldErrors] = useState({});

  const [bankForm, setBankForm] = useState({
    so_tai_khoan: '',
    ten_chu_tai_khoan: '',
    ma_ngan_hang: '',
  });
  const [bankFieldErrors, setBankFieldErrors] = useState({});

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

  const syncBankForm = (data) => {
    const tk = data?.tai_khoan_ngan_hang || {};
    setBankForm({
      so_tai_khoan: tk.so_tai_khoan || '',
      ten_chu_tai_khoan: tk.ten_chu_tai_khoan || '',
      ma_ngan_hang: tk.ma_ngan_hang || '',
    });
  };

  const loadProfile = async () => {
    setLoading(true);
    try {
      const res = await api.get('/partner/account/profile');
      const data = res.data.data;
      setProfile(data);
      setInfoForm({
        ten_hien_thi: data.ten_hien_thi || data.ten_cong_ty || '',
        so_dien_thoai: data.so_dien_thoai || '',
        dia_chi: data.dia_chi || '',
      });
      syncBankForm(data);
    } catch (err) {
      showToast(err.response?.data?.message || 'Không tải được thông tin tài khoản', 'error');
    } finally {
      setLoading(false);
    }
  };

  const loadBanks = async () => {
    setBanksLoading(true);
    try {
      const res = await api.get('/partner/account/banks');
      setBanks(res.data.data || []);
    } catch (err) {
      showToast(err.response?.data?.message || 'Không tải được danh sách ngân hàng', 'error');
    } finally {
      setBanksLoading(false);
    }
  };

  useEffect(() => {
    loadProfile();
  }, []);

  useEffect(() => {
    if (activeTab === 'bank' && banks.length === 0 && !banksLoading) {
      loadBanks();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab]);

  const validateInfoForm = () => {
    const errors = {};
    const ten = infoForm.ten_hien_thi.trim();
    const phone = infoForm.so_dien_thoai.trim();

    if (!ten) {
      errors.ten_hien_thi = 'Tên công ty / đối tác không được để trống.';
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
      const diaChi = infoForm.dia_chi.trim();
      const res = await api.put('/partner/account/profile', {
        ten_hien_thi: ten,
        so_dien_thoai: phone,
        dia_chi: diaChi,
      });
      setProfile(res.data.data);
      setInfoForm({
        ten_hien_thi: res.data.data.ten_hien_thi || ten,
        so_dien_thoai: res.data.data.so_dien_thoai || phone,
        dia_chi: res.data.data.dia_chi || '',
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

  const handleSaveBank = async (e) => {
    e.preventDefault();
    const err = validateBankAccountForm(bankForm);
    if (err) {
      setBankFieldErrors({ [err.field]: err.message });
      showToast(err.message, 'error');
      return;
    }
    setBankFieldErrors({});
    setSavingBank(true);
    try {
      const res = await api.put('/partner/account/bank-account', {
        so_tai_khoan: bankForm.so_tai_khoan.trim(),
        ten_chu_tai_khoan: bankForm.ten_chu_tai_khoan.trim(),
        ma_ngan_hang: bankForm.ma_ngan_hang,
      });
      setProfile(res.data.data);
      syncBankForm(res.data.data);
      showToast(res.data.message || 'Cập nhật tài khoản ngân hàng thành công');
    } catch (error) {
      const msg = error.response?.data?.message || 'Cập nhật tài khoản ngân hàng thất bại';
      const mapped = validateBankAccountForm({
        so_tai_khoan: bankForm.so_tai_khoan,
        ten_chu_tai_khoan: bankForm.ten_chu_tai_khoan,
        ma_ngan_hang: bankForm.ma_ngan_hang,
      });
      if (mapped) setBankFieldErrors({ [mapped.field]: msg });
      else if (msg.toLowerCase().includes('ngân hàng')) {
        setBankFieldErrors({ ma_ngan_hang: msg });
      }
      showToast(msg, 'error');
    } finally {
      setSavingBank(false);
    }
  };

  const toggleShowPwd = (field) => {
    setShowPwd((prev) => ({ ...prev, [field]: !prev[field] }));
  };

  const selectedBank = banks.find(
    (b) => b.code === bankForm.ma_ngan_hang || b.bin === bankForm.ma_ngan_hang,
  ) || null;
  const selectedBankName = selectedBank?.short_name
    || selectedBank?.name
    || profile?.tai_khoan_ngan_hang?.ten_ngan_hang
    || '';
  const selectedBankLogo = selectedBank?.logo
    || profile?.tai_khoan_ngan_hang?.logo_ngan_hang
    || '';

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
              setBankFieldErrors({});
            }}
          >
            Hồ sơ cá nhân
          </button>
          <button
            type="button"
            className={`partner-account-tab${activeTab === 'bank' ? ' is-active' : ''}`}
            onClick={() => {
              setActiveTab('bank');
              setInfoFieldErrors({});
              setPwdFieldErrors({});
            }}
          >
            Tài khoản ngân hàng
          </button>
          <button
            type="button"
            className={`partner-account-tab${activeTab === 'security' ? ' is-active' : ''}`}
            onClick={() => {
              setActiveTab('security');
              setInfoFieldErrors({});
              setBankFieldErrors({});
            }}
          >
            Bảo mật tài khoản
          </button>
        </div>

        <div className="content-card partner-account-panel">
          {activeTab === 'info' ? (
            <form onSubmit={handleSaveInfo} className="partner-account-form" noValidate>
              <div className="partner-account-field">
                <label htmlFor="ten_hien_thi">Tên công ty / đối tác</label>
                <input
                  id="ten_hien_thi"
                  className={`search-input${infoFieldErrors.ten_hien_thi ? ' input-invalid' : ''}`}
                  value={infoForm.ten_hien_thi}
                  onChange={(e) => {
                    setInfoForm({ ...infoForm, ten_hien_thi: e.target.value });
                    setInfoFieldErrors((prev) => ({ ...prev, ten_hien_thi: undefined }));
                  }}
                  placeholder="Nhập tên công ty / đối tác"
                />
                {infoFieldErrors.ten_hien_thi && (
                  <p className="form-field-error">{infoFieldErrors.ten_hien_thi}</p>
                )}
              </div>

              <div className="partner-account-field-row">
                <div className="partner-account-field">
                  <label htmlFor="email_dang_ky">Email đăng nhập</label>
                  <input
                    id="email_dang_ky"
                    type="email"
                    className="search-input is-readonly"
                    value={profile?.email_dang_ky || ''}
                    readOnly
                    disabled
                  />
                </div>

                <div className="partner-account-field">
                  <label htmlFor="so_dien_thoai">Số điện thoại</label>
                  <input
                    id="so_dien_thoai"
                    type="tel"
                    className={`search-input${infoFieldErrors.so_dien_thoai ? ' input-invalid' : ''}`}
                    value={infoForm.so_dien_thoai}
                    onChange={(e) => {
                      setInfoForm({ ...infoForm, so_dien_thoai: sanitizePhoneInput(e.target.value) });
                      setInfoFieldErrors((prev) => ({ ...prev, so_dien_thoai: undefined }));
                    }}
                    inputMode="numeric"
                    maxLength={10}
                    placeholder="09xxxxxxxx"
                  />
                  {infoFieldErrors.so_dien_thoai && (
                    <p className="form-field-error">{infoFieldErrors.so_dien_thoai}</p>
                  )}
                </div>
              </div>

              <div className="partner-account-field-row">
                <div className="partner-account-field">
                  <label htmlFor="ma_so_thue">Mã số thuế</label>
                  <input
                    id="ma_so_thue"
                    className="search-input is-readonly"
                    value={profile?.ma_so_thue || '—'}
                    readOnly
                    disabled
                  />
                </div>

                <div className="partner-account-field">
                  <label htmlFor="phan_tram_hoa_hong">Tỉ lệ hoa hồng (%)</label>
                  <input
                    id="phan_tram_hoa_hong"
                    className="search-input is-readonly"
                    value={profile?.phan_tram_hoa_hong != null ? `${profile.phan_tram_hoa_hong}` : '15'}
                    readOnly
                    disabled
                  />  
                </div>
              </div>

              <div className="partner-account-field">
                <label htmlFor="dia_chi">Địa chỉ công ty</label>
                <input
                  id="dia_chi"
                  className="search-input"
                  value={infoForm.dia_chi}
                  onChange={(e) => setInfoForm({ ...infoForm, dia_chi: e.target.value })}
                  placeholder="Số nhà, đường, phường/xã, quận/huyện, tỉnh/thành..."
                />
              </div>

              <div className="partner-account-form-actions">
                <button type="submit" className="btn btn-primary" disabled={savingInfo}>
                  {savingInfo ? 'Đang lưu...' : 'Lưu thay đổi'}
                </button>
              </div>
            </form>
          ) : activeTab === 'bank' ? (
            <form onSubmit={handleSaveBank} className="partner-account-form" noValidate>
              

              <div className="partner-account-field">
                <label htmlFor="ten_chu_tai_khoan">Tên chủ tài khoản</label>
                <input
                  id="ten_chu_tai_khoan"
                  className={`search-input${bankFieldErrors.ten_chu_tai_khoan ? ' input-invalid' : ''}`}
                  value={bankForm.ten_chu_tai_khoan}
                  onChange={(e) => {
                    setBankForm({ ...bankForm, ten_chu_tai_khoan: e.target.value });
                    setBankFieldErrors((prev) => ({ ...prev, ten_chu_tai_khoan: undefined }));
                  }}
                  placeholder="VD: Nguyen Van A"
                />
                {bankFieldErrors.ten_chu_tai_khoan && (
                  <p className="form-field-error">{bankFieldErrors.ten_chu_tai_khoan}</p>
                )}
              </div>

              <div className="partner-account-field">
                <label htmlFor="so_tai_khoan">Số tài khoản</label>
                <input
                  id="so_tai_khoan"
                  className={`search-input${bankFieldErrors.so_tai_khoan ? ' input-invalid' : ''}`}
                  value={bankForm.so_tai_khoan}
                  onChange={(e) => {
                    setBankForm({
                      ...bankForm,
                      so_tai_khoan: sanitizeAccountNumberInput(e.target.value),
                    });
                    setBankFieldErrors((prev) => ({ ...prev, so_tai_khoan: undefined }));
                  }}
                  inputMode="numeric"
                  placeholder="Nhập số tài khoản"
                />
                {bankFieldErrors.so_tai_khoan && (
                  <p className="form-field-error">{bankFieldErrors.so_tai_khoan}</p>
                )}
              </div>

              <div className="partner-account-field">
                <label htmlFor="ma_ngan_hang">Ngân hàng</label>
                {banksLoading ? (
                  <p className="partner-account-hint">Đang tải danh sách ngân hàng...</p>
                ) : (
                  <select
                    id="ma_ngan_hang"
                    className={`search-input${bankFieldErrors.ma_ngan_hang ? ' input-invalid' : ''}`}
                    value={bankForm.ma_ngan_hang}
                    onChange={(e) => {
                      setBankForm({ ...bankForm, ma_ngan_hang: e.target.value });
                      setBankFieldErrors((prev) => ({ ...prev, ma_ngan_hang: undefined }));
                    }}
                  >
                    <option value="">Chọn ngân hàng</option>
                    {banks.map((b) => (
                      <option key={b.code || b.bin} value={b.code || b.bin}>
                        {b.short_name || b.name}
                      </option>
                    ))}
                  </select>
                )}
                {bankFieldErrors.ma_ngan_hang && (
                  <p className="form-field-error">{bankFieldErrors.ma_ngan_hang}</p>
                )}
                {(selectedBank || profile?.tai_khoan_ngan_hang?.logo_ngan_hang) && (
                  <div className="partner-bank-selected">
                    {selectedBankLogo ? (
                      <img
                        src={selectedBankLogo}
                        alt=""
                        className="partner-bank-logo"
                      />
                    ) : null}
                    <span>{selectedBankName}</span>
                  </div>
                )}
              </div>
              <p className="partner-account-hint" style={{ marginBottom: 12 }}>
                Tài khoản nhận tiền thanh toán doanh thu.
              </p>
              <div className="partner-account-form-actions">
                <button type="submit" className="btn btn-primary" disabled={savingBank || banksLoading}>
                  {savingBank ? 'Đang lưu...' : 'Cập nhật tài khoản'}
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
