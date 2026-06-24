import { useEffect, useRef, useState } from 'react';
import customerAccountService from '../../services/customerAccountService';
import { resolveUploadUrl } from '../../utils/media';
import '../../assets/styles/account.css';
import { CUSTOMER_PROFILE_UPDATED } from '../../components/customer/account/CustomerAccountSidebar';

const formatDate = (date) => {
  return date ? new Date(date).toLocaleString('vi-VN') : '—';
};

function ProfilePage() {
  const fileRef = useRef(null);

  const [activeTab, setActiveTab] = useState('info');
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  const [savingInfo, setSavingInfo] = useState(false);
  const [savingPwd, setSavingPwd] = useState(false);
  const [savingPhone, setSavingPhone] = useState(false);

  const [toast, setToast] = useState(null);
  const [pwdError, setPwdError] = useState('');
  const [pwdSuccess, setPwdSuccess] = useState('');

  const [avatarPreview, setAvatarPreview] = useState(null);
  const [avatarFile, setAvatarFile] = useState(null);

  const [infoForm, setInfoForm] = useState({
    ho_ten: '',
    so_dien_thoai: '',
  });

  const [phoneForm, setPhoneForm] = useState({
    so_dien_thoai: '',
  });

  const [pwdForm, setPwdForm] = useState({
    mat_khau_cu: '',
    mat_khau_moi: '',
    xac_nhan_mat_khau: '',
  });

  const showToast = (message, type = 'success') => {
    setToast({ message, type });

    setTimeout(() => {
      setToast(null);
    }, 3500);
  };

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

      setPhoneForm({
        so_dien_thoai: data.so_dien_thoai || '',
      });

      setAvatarPreview(
        data.anh_dai_dien ? resolveUploadUrl(data.anh_dai_dien) : null,
      );
    } catch (err) {
      showToast(err.response?.data?.message || 'Không tải được thông tin tài khoản', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProfile();
  }, []);

  const handleAvatarChange = (e) => {
    const file = e.target.files?.[0];

    if (!file) return;

    setAvatarFile(file);
    setAvatarPreview(URL.createObjectURL(file));
    e.target.value = '';
  };

  const handleSaveInfo = async (e) => {
    e.preventDefault();

    if (!infoForm.ho_ten.trim()) {
      showToast('Họ tên không được để trống', 'error');
      return;
    }

    setSavingInfo(true);

    try {
      const formData = new FormData();

      formData.append('ho_ten', infoForm.ho_ten.trim());
      formData.append('so_dien_thoai', infoForm.so_dien_thoai.trim());

      if (avatarFile) {
        formData.append('avatar', avatarFile);
      }

      const res = await customerAccountService.updateProfile(formData);

      setProfile(res.data.data);
      setAvatarFile(null);

      setPhoneForm({
        so_dien_thoai: res.data.data.so_dien_thoai || '',
      });

      showToast('Cập nhật thông tin thành công');
      window.dispatchEvent(new Event(CUSTOMER_PROFILE_UPDATED));
    } catch (err) {
      showToast(err.response?.data?.message || 'Cập nhật thông tin thất bại', 'error');
    } finally {
      setSavingInfo(false);
    }
  };

  const handleChangePhone = async (e) => {
    e.preventDefault();

    if (!phoneForm.so_dien_thoai.trim()) {
      showToast('Số điện thoại không được để trống', 'error');
      return;
    }

    setSavingPhone(true);

    try {
      const res = await customerAccountService.changePhone({
        so_dien_thoai: phoneForm.so_dien_thoai.trim(),
      });

      setProfile(res.data.data);

      setInfoForm((prev) => ({
        ...prev,
        so_dien_thoai: res.data.data.so_dien_thoai || '',
      }));

      showToast('Cập nhật số điện thoại thành công');
    } catch (err) {
      showToast(err.response?.data?.message || 'Cập nhật số điện thoại thất bại', 'error');
    } finally {
      setSavingPhone(false);
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();

    setPwdError('');
    setPwdSuccess('');

    const mat_khau_cu = pwdForm.mat_khau_cu.trim();
    const mat_khau_moi = pwdForm.mat_khau_moi.trim();
    const xac_nhan_mat_khau = pwdForm.xac_nhan_mat_khau.trim();

    if (!mat_khau_cu || !mat_khau_moi || !xac_nhan_mat_khau) {
      setPwdError('Vui lòng nhập đầy đủ các trường mật khẩu');
      return;
    }

    if (mat_khau_moi.length < 6) {
      setPwdError('Mật khẩu mới phải có ít nhất 6 ký tự');
      return;
    }

    if (mat_khau_moi !== xac_nhan_mat_khau) {
      setPwdError('Xác nhận mật khẩu không khớp');
      return;
    }

    if (mat_khau_cu === mat_khau_moi) {
      setPwdError('Mật khẩu mới phải khác mật khẩu hiện tại');
      return;
    }

    setSavingPwd(true);

    try {
      await customerAccountService.changePassword({
        mat_khau_cu,
        mat_khau_moi,
        xac_nhan_mat_khau,
      });

      setPwdSuccess('Đổi mật khẩu thành công');
      showToast('Đổi mật khẩu thành công');

      setPwdForm({
        mat_khau_cu: '',
        mat_khau_moi: '',
        xac_nhan_mat_khau: '',
      });
    } catch (err) {
      const message = err.response?.data?.message || 'Đổi mật khẩu thất bại';

      setPwdError(message);
      showToast(message, 'error');
    } finally {
      setSavingPwd(false);
    }
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
        {toast && (
          <div className={`customer-toast ${toast.type}`}>
            {toast.message}
          </div>
        )}

        <div className="customer-account-header">
          <h1>Tài khoản của tôi</h1>
        </div>

        <div className="customer-account-tabs">
          <button
            type="button"
            className={activeTab === 'info' ? 'active' : ''}
            onClick={() => setActiveTab('info')}
          >
            Thông tin cá nhân
          </button>

          <button
            type="button"
            className={activeTab === 'settings' ? 'active' : ''}
            onClick={() => setActiveTab('settings')}
          >
            Cài đặt tài khoản
          </button>
        </div>

        {activeTab === 'info' && (
          <div className="customer-card">
            <h3>Thông tin cá nhân</h3>

            <form onSubmit={handleSaveInfo}>
              <div className="customer-form-group">
                <label>Ảnh đại diện</label>

                <div className="customer-avatar-row">
                  <div className="customer-avatar-small">
                    {avatarPreview ? (
                      <img src={avatarPreview} alt="" />
                    ) : (
                      <span>{profile?.ho_ten?.charAt(0)?.toUpperCase() || 'K'}</span>
                    )}
                  </div>

                  <button
                    type="button"
                    className="customer-btn customer-btn-outline"
                    onClick={() => fileRef.current?.click()}
                  >
                    Chọn ảnh
                  </button>

                  <input
                    ref={fileRef}
                    type="file"
                    accept="image/*"
                    hidden
                    onChange={handleAvatarChange}
                  />
                </div>
              </div>

              <div className="customer-form-group">
                <label>
                  Họ tên <span>*</span>
                </label>

                <input
                  type="text"
                  value={infoForm.ho_ten}
                  onChange={(e) => setInfoForm({ ...infoForm, ho_ten: e.target.value })}
                  placeholder="Nhập họ tên của bạn"
                />
              </div>

              <div className="customer-form-group">
                <label>Email đăng nhập</label>

                <input
                  type="email"
                  value={profile?.email_dang_ky || profile?.email || ''}
                  readOnly
                  className="readonly"
                />

                <p>Email dùng để đăng nhập hệ thống, không thể thay đổi.</p>
              </div>

              <div className="customer-form-group">
                <label>Số điện thoại</label>

                <input
                  type="tel"
                  value={infoForm.so_dien_thoai}
                  onChange={(e) => setInfoForm({ ...infoForm, so_dien_thoai: e.target.value })}
                  placeholder="09xxxxxxxx"
                />
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

              {pwdError && (
                <div className="customer-alert error">
                  {pwdError}
                </div>
              )}

              {pwdSuccess && (
                <div className="customer-alert success">
                  {pwdSuccess}
                </div>
              )}

              <form onSubmit={handleChangePassword}>
                <div className="customer-form-group">
                  <label>Mật khẩu hiện tại</label>

                  <input
                    type="password"
                    autoComplete="current-password"
                    value={pwdForm.mat_khau_cu}
                    onChange={(e) => {
                      setPwdForm({ ...pwdForm, mat_khau_cu: e.target.value });
                      setPwdError('');
                    }}
                    placeholder="Nhập mật khẩu hiện tại"
                  />
                </div>

                <div className="customer-form-group">
                  <label>Mật khẩu mới</label>

                  <input
                    type="password"
                    autoComplete="new-password"
                    value={pwdForm.mat_khau_moi}
                    onChange={(e) => {
                      setPwdForm({ ...pwdForm, mat_khau_moi: e.target.value });
                      setPwdError('');
                    }}
                    placeholder="Ít nhất 6 ký tự"
                  />
                </div>

                <div className="customer-form-group">
                  <label>Xác nhận mật khẩu mới</label>

                  <input
                    type="password"
                    autoComplete="new-password"
                    value={pwdForm.xac_nhan_mat_khau}
                    onChange={(e) => {
                      setPwdForm({ ...pwdForm, xac_nhan_mat_khau: e.target.value });
                      setPwdError('');
                    }}
                    placeholder="Nhập lại mật khẩu mới"
                  />
                </div>

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