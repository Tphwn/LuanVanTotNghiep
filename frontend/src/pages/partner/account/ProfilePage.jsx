import { useEffect, useRef, useState } from 'react';
import api from '../../../services/api';
import { resolveUploadUrl } from '../../../utils/media';
import ManagementHeader from '../../../components/common/management/ManagementHeader';

const formatDate = (d) => (d ? new Date(d).toLocaleString('vi-VN') : '—');

const ProfilePage = () => {
  const [activeTab, setActiveTab] = useState('info');
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [savingInfo, setSavingInfo] = useState(false);
  const [savingPwd, setSavingPwd] = useState(false);
  const [savingPhone, setSavingPhone] = useState(false);
  const [toast, setToast] = useState(null);
  const [pwdError, setPwdError] = useState('');
  const [pwdSuccess, setPwdSuccess] = useState('');
  const fileRef = useRef(null);

  const [infoForm, setInfoForm] = useState({
    ten_hien_thi: '', email_lien_he: '', so_dien_thoai: '',
  });
  const [avatarPreview, setAvatarPreview] = useState(null);
  const [avatarFile, setAvatarFile] = useState(null);

  const [pwdForm, setPwdForm] = useState({
    mat_khau_cu: '', mat_khau_moi: '', xac_nhan_mat_khau: '',
  });
  const [phoneForm, setPhoneForm] = useState({ so_dien_thoai: ''});

  const showToast = (msg, type ='success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3500);
  };

  const loadProfile = async () => {
    setLoading(true);
    try {
      const res = await api.get('/partner/account/profile');
      const data = res.data.data;
      setProfile(data);
      setInfoForm({
        ten_hien_thi: data.ten_hien_thi || '',
        email_lien_he: data.email_lien_he || data.email_dang_ky || '',
        so_dien_thoai: data.so_dien_thoai || '',
      });
      setPhoneForm({ so_dien_thoai: data.so_dien_thoai || ''});
      setAvatarPreview(data.anh_dai_dien ? resolveUploadUrl(data.anh_dai_dien) : null);
    } catch (err) {
      showToast(err.response?.data?.message ||'Lỗi tải thông tin', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadProfile(); }, []);

  const handleAvatarChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setAvatarFile(file);
    setAvatarPreview(URL.createObjectURL(file));
    e.target.value = '';
  };

  const handleSaveInfo = async (e) => {
    e.preventDefault();
    if (!infoForm.ten_hien_thi.trim()) return showToast('Tên hiển thị không được để trống', 'error');

    setSavingInfo(true);
    try {
      const formData = new FormData();
      formData.append('ten_hien_thi', infoForm.ten_hien_thi.trim());
      formData.append('email_lien_he', infoForm.email_lien_he.trim());
      formData.append('so_dien_thoai', infoForm.so_dien_thoai.trim());
      if (avatarFile) formData.append('avatar', avatarFile);

      const res = await api.put('/partner/account/profile', formData);
      setProfile(res.data.data);
      setPhoneForm({ so_dien_thoai: res.data.data.so_dien_thoai });
      setAvatarFile(null);
      showToast('Cập nhật thông tin thành công');
    } catch (err) {
      showToast(err.response?.data?.message || 'Cập nhật thất bại', 'error');
    } finally {
      setSavingInfo(false);
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
      await api.put('/partner/account/password', { mat_khau_cu, mat_khau_moi, xac_nhan_mat_khau });
      setPwdSuccess('Đổi mật khẩu thành công');
      setPwdForm({ mat_khau_cu: '', mat_khau_moi: '', xac_nhan_mat_khau: ''});
      showToast('Đổi mật khẩu thành công');
    } catch (err) {
      const msg = err.response?.data?.message || 'Đổi mật khẩu thất bại';
      setPwdError(msg);
      showToast(msg, 'error');
    } finally {
      setSavingPwd(false);
    }
  };

  const handleChangePhone = async (e) => {
    e.preventDefault();
    setSavingPhone(true);
    try {
      const res = await api.put('/partner/account/phone', phoneForm);
      setProfile(res.data.data);
      setInfoForm((prev) => ({ ...prev, so_dien_thoai: res.data.data.so_dien_thoai }));
      showToast('Đổi số điện thoại thành công');
    } catch (err) {
      showToast(err.response?.data?.message || 'Đổi số điện thoại thất bại', 'error');
    } finally {
      setSavingPhone(false);
    }
  };

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: 60, color: '#5a7a72'}}> Đang tải thông tin...</div>
    );
  }

  return (
    <div className="mgmt-page">
      <ManagementHeader
        title="Quản lý Tài khoản"
        subtitle="Cập nhật thông tin cá nhân và cài đặt bảo mật"
      />

      {toast && (
        <div style={{
          background: toast.type ==='success'?'#e8f5f1':'#fff0f0',
          border: `1px solid ${toast.type === 'success'?'#8FD9C4':'#ffb3b3'}`,
          color: toast.type === 'success'?'#3C7363':'#e05c5c',
          padding: '10px 16px', borderRadius: 8, marginBottom: 16, fontSize: 14,
        }}>
          {toast.type === 'success'?'':''} {toast.msg}
        </div>
      )}

      {/* Profile header card */}
      <div className="content-card"style={{ marginBottom: 20, display: 'flex', alignItems: 'center', gap: 20 }}>
        <div style={{
          width: 80, height: 80, borderRadius: '50%', overflow: 'hidden',
          background: '#e8f5f1', flexShrink: 0,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 32, border: '3px solid #3C7363',
        }}>
          {avatarPreview ? (
            <img src={avatarPreview} alt="Avatar"style={{ width: '100%', height: '100%', objectFit: 'cover'}} />
          ) :''}
        </div>
        <div>
          <h2 style={{ margin: '0 0 4px', color: '#1a2e28', fontSize: 20 }}>
            {profile?.ten_hien_thi || 'Đối tác'}
          </h2>
          <p style={{ margin: 0, color: '#5a7a72', fontSize: 14 }}>{profile?.email_dang_ky}</p>
          <p style={{ margin: '4px 0 0', color: '#888', fontSize: 12 }}>
            Đăng nhập lần cuối: {formatDate(profile?.dang_nhap_cuoi)}
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
        {[
          { key: 'info', label: 'Thông tin tài khoản'},
          { key:'settings', label: 'Cài đặt tài khoản'},
        ].map((tab) => (
          <button
            key={tab.key}
            type="button"className={`btn btn-sm ${activeTab === tab.key ?'btn-primary':'btn-ghost'}`}
            onClick={() => setActiveTab(tab.key)}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === 'info'&& (
        <div className="content-card"style={{ maxWidth: 640 }}>
          <h3 style={{ margin:'0 0 20px', fontSize: 16, color: '#3C7363'}}>Thông tin tài khoản</h3>

          <form onSubmit={handleSaveInfo}>
            {/* Avatar upload */}
            <div style={{ marginBottom: 20 }}>
              <label style={{ display:'block', fontSize: 13, fontWeight: 500, marginBottom: 8 }}>
                Ảnh đại diện
              </label>
              <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                <div style={{
                  width: 64, height: 64, borderRadius: '50%', overflow: 'hidden',
                  background: '#f0f7f5', border: '2px solid #d4ede6',
                }}>
                  {avatarPreview ? (
                    <img src={avatarPreview} alt=""style={{ width: '100%', height: '100%', objectFit: 'cover'}} />
                  ) : (
                    <div style={{ width:'100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24 }}></div>
                  )}
                </div>
                <button type="button"className="btn btn-outline btn-sm"onClick={() => fileRef.current?.click()}>
                  Chọn ảnh
                </button>
                <input ref={fileRef} type="file"accept="image/*"hidden onChange={handleAvatarChange} />
              </div>
            </div>

            <div style={{ marginBottom: 16 }}>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 500, marginBottom: 6 }}>
                Tên hiển thị <span style={{ color: '#e05c5c'}}>*</span>
              </label>
              <input
                className="search-input"style={{ width:'100%'}}
                value={infoForm.ten_hien_thi}
                onChange={(e) => setInfoForm({ ...infoForm, ten_hien_thi: e.target.value })}
                placeholder="Tên công ty / tên hiển thị"/>
            </div>

            <div style={{ marginBottom: 16 }}>
              <label style={{ display:'block', fontSize: 13, fontWeight: 500, marginBottom: 6 }}>
                Email liên hệ
              </label>
              <input
                type="email"className="search-input"style={{ width: '100%'}}
                value={infoForm.email_lien_he}
                onChange={(e) => setInfoForm({ ...infoForm, email_lien_he: e.target.value })}
                placeholder="email-lienhe@example.com"/>
              <p style={{ fontSize: 11, color:'#888', marginTop: 4 }}>
                Email dùng để khách hàng / hệ thống liên hệ với bạn
              </p>
            </div>

            <div style={{ marginBottom: 24 }}>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 500, marginBottom: 6 }}>
                Số điện thoại
              </label>
              <input
                type="tel"className="search-input"style={{ width: '100%'}}
                value={infoForm.so_dien_thoai}
                onChange={(e) => setInfoForm({ ...infoForm, so_dien_thoai: e.target.value })}
                placeholder="09xxxxxxxx"/>
            </div>

            <button type="submit"className="btn btn-primary"disabled={savingInfo}>
              {savingInfo ?'Đang lưu...':'Lưu thay đổi'}
            </button>
          </form>
        </div>
      )}

      {activeTab === 'settings'&& (
        <div style={{ display:'grid', gridTemplateColumns: '1fr 1fr', gap: 20, maxWidth: 900 }}>
          {/* Email đăng ký */}
          <div className="content-card">
            <h3 style={{ margin: '0 0 16px', fontSize: 16, color: '#3C7363'}}>Email đăng ký</h3>
            <p style={{ fontSize: 13, color:'#5a7a72', marginBottom: 12 }}>
              Đây là email bạn dùng để đăng nhập hệ thống, không thể thay đổi.
            </p>
            <input
              className="search-input"style={{ width: '100%', background: '#f5f5f5', color: '#666'}}
              value={profile?.email_dang_ky ||''}
              readOnly
            />
            <p style={{ fontSize: 11, color: '#888', marginTop: 8 }}>
              Tạo tài khoản: {formatDate(profile?.ngay_tao)}
            </p>
          </div>

          {/* Đổi SĐT */}
          <div className="content-card">
            <h3 style={{ margin: '0 0 16px', fontSize: 16, color: '#3C7363'}}>Đổi số điện thoại</h3>
            <form onSubmit={handleChangePhone}>
              <div style={{ marginBottom: 16 }}>
                <label style={{ display:'block', fontSize: 13, fontWeight: 500, marginBottom: 6 }}>
                  Số điện thoại mới
                </label>
                <input
                  type="tel"className="search-input"style={{ width: '100%'}}
                  value={phoneForm.so_dien_thoai}
                  onChange={(e) => setPhoneForm({ so_dien_thoai: e.target.value })}
                  placeholder="09xxxxxxxx"/>
              </div>
              <button type="submit"className="btn btn-outline"disabled={savingPhone}>
                {savingPhone ?'Đang cập nhật...':'Cập nhật số điện thoại'}
              </button>
            </form>
          </div>

          {/* Đổi mật khẩu */}
          <div className="content-card"style={{ gridColumn: '1 / -1'}}>
            <h3 style={{ margin:'0 0 16px', fontSize: 16, color: '#3C7363'}}>Đổi mật khẩu</h3>

            {pwdError && (
              <div style={{
                background:'#fff0f0', border: '1px solid #ffb3b3', color: '#e05c5c',
                padding: '10px 14px', borderRadius: 8, marginBottom: 14, fontSize: 13,
              }}>
                 {pwdError}
              </div>
            )}
            {pwdSuccess && (
              <div style={{
                background: '#e8f5f1', border: '1px solid #8FD9C4', color: '#3C7363',
                padding: '10px 14px', borderRadius: 8, marginBottom: 14, fontSize: 13,
              }}>
                 {pwdSuccess}
              </div>
            )}

            <form onSubmit={handleChangePassword} style={{ maxWidth: 400 }}>
              <div style={{ marginBottom: 14 }}>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 500, marginBottom: 6 }}>
                  Mật khẩu hiện tại
                </label>
                <input
                  type="password"autoComplete="current-password"className="search-input"style={{ width: '100%'}}
                  value={pwdForm.mat_khau_cu}
                  onChange={(e) => { setPwdForm({ ...pwdForm, mat_khau_cu: e.target.value }); setPwdError(''); }}
                  placeholder="Nhập mật khẩu đăng nhập hiện tại"/>
              </div>
              <div style={{ marginBottom: 14 }}>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 500, marginBottom: 6 }}>
                  Mật khẩu mới
                </label>
                <input
                  type="password"autoComplete="new-password"className="search-input"style={{ width: '100%'}}
                  value={pwdForm.mat_khau_moi}
                  onChange={(e) => { setPwdForm({ ...pwdForm, mat_khau_moi: e.target.value }); setPwdError(''); }}
                  placeholder="Ít nhất 6 ký tự"/>
              </div>
              <div style={{ marginBottom: 20 }}>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 500, marginBottom: 6 }}>
                  Xác nhận mật khẩu mới
                </label>
                <input
                  type="password"autoComplete="new-password"className="search-input"style={{ width: '100%'}}
                  value={pwdForm.xac_nhan_mat_khau}
                  onChange={(e) => { setPwdForm({ ...pwdForm, xac_nhan_mat_khau: e.target.value }); setPwdError(''); }}
                  placeholder="Nhập lại mật khẩu mới"/>
              </div>
              <button type="submit"className="btn btn-primary" disabled={savingPwd}>
                {savingPwd ? 'Đang xử lý...':'Đổi mật khẩu'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProfilePage;
