

import { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate, Link } from 'react-router-dom';
import { register, clearError } from '../../store/slices/authSlice';
import { ROUTES } from '../../constants/routes';

const RegisterPage = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { loading, error, user } = useSelector((state) => state.auth);

  const [formData, setFormData] = useState({
    ho_ten: '',
    email: '',
    so_dien_thoai: '',
    mat_khau: '',
    xac_nhan_mat_khau: '',
  });

  const [localError, setLocalError] = useState('');

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (error) dispatch(clearError());
    if (localError) setLocalError('');
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    if (formData.mat_khau !== formData.xac_nhan_mat_khau) {
      setLocalError('Mật khẩu xác nhận không khớp');
      return;
    }
    const { xac_nhan_mat_khau, ...dataToSend } = formData;
    dispatch(register(dataToSend));
  };
  useEffect(() => {
    if (user) navigate(ROUTES.HOME);
  }, [user]);

  const inputStyle = {
    width: '100%',
    padding: '10px',
    border: '1px solid #d9d9d9',
    borderRadius: '6px',
    fontSize: '14px',
    boxSizing: 'border-box',
  };

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: '#f5f5f5',
    }}>
      <div style={{
        background: '#fff',
        padding: '2rem',
        borderRadius: '12px',
        width: '100%',
        maxWidth: '420px',
        boxShadow: '0 2px 12px rgba(0,0,0,0.08)',
      }}>
        <h2 style={{ textAlign: 'center', marginBottom: '1.5rem' }}>Đăng ký</h2>
        {(error || localError) && (
          <div style={{
            background: '#fff2f0',
            border: '1px solid #ffccc7',
            color: '#ff4d4f',
            padding: '10px',
            borderRadius: '6px',
            marginBottom: '1rem',
            fontSize: '14px',
          }}>
            {error || localError}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          {[
            { label: 'Họ tên', name: 'ho_ten', type: 'text', placeholder: 'Nguyễn Văn A' },
            { label: 'Email', name: 'email', type: 'email', placeholder: 'example@gmail.com' },
            { label: 'Số điện thoại', name: 'so_dien_thoai', type: 'text', placeholder: '09xxxxxxxx' },
            { label: 'Mật khẩu', name: 'mat_khau', type: 'password', placeholder: 'Tối thiểu 6 ký tự' },
            { label: 'Xác nhận mật khẩu', name: 'xac_nhan_mat_khau', type: 'password', placeholder: 'Nhập lại mật khẩu' },
          ].map((field) => (
            <div key={field.name} style={{ marginBottom: '1rem' }}>
              <label style={{ display: 'block', marginBottom: '6px', fontSize: '14px' }}>
                {field.label}
              </label>
              <input
                type={field.type}
                name={field.name}
                value={formData[field.name]}
                onChange={handleChange}
                placeholder={field.placeholder}
                required
                style={inputStyle}
              />
            </div>
          ))}

          <button
            type="submit"
            disabled={loading}
            style={{
              width: '100%',
              padding: '10px',
              background: loading ? '#ccc' : '#1677ff',
              color: '#fff',
              border: 'none',
              borderRadius: '6px',
              fontSize: '15px',
              cursor: loading ? 'not-allowed' : 'pointer',
              marginTop: '0.5rem',
            }}
          >
            {loading ? 'Đang đăng ký...' : 'Đăng ký'}
          </button>
        </form>

        <p style={{ textAlign: 'center', marginTop: '1rem', fontSize: '14px' }}>
          Đã có tài khoản?{' '}
          <Link to={ROUTES.LOGIN} style={{ color: '#1677ff' }}>
            Đăng nhập
          </Link>
        </p>
      </div>
    </div>
  );
};

export default RegisterPage;