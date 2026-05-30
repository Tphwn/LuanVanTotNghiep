import { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate, Link } from 'react-router-dom';
import { login, clearError } from '../../store/slices/authSlice';
import { ROUTES } from '../../constants/routes';
import ROLES from '../../constants/roles';

const LoginPage = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const { loading, error, user } = useSelector((state) => state.auth);

  const [formData, setFormData] = useState({
    email: '',
    mat_khau: '',
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));

    if (error) dispatch(clearError());
  };

  const handleSubmit = async (e) => {
    e.preventDefault(); 
    dispatch(login(formData));
  };

  useEffect(() => {
    if (user) {
      if (user.vai_tro === ROLES.ADMIN) navigate(ROUTES.ADMIN.DASHBOARD);
      else if (user.vai_tro === ROLES.DOI_TAC) navigate(ROUTES.PARTNER.DASHBOARD);
      else navigate(ROUTES.HOME);
    }
  }, [user]);

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
        maxWidth: '400px',
        boxShadow: '0 2px 12px rgba(0,0,0,0.08)',
      }}>
        <h2 style={{ textAlign: 'center', marginBottom: '1.5rem' }}>Đăng nhập</h2>

        {error && (
          <div style={{
            background: '#fff2f0',
            border: '1px solid #ffccc7',
            color: '#ff4d4f',
            padding: '10px',
            borderRadius: '6px',
            marginBottom: '1rem',
            fontSize: '14px',
          }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: '1rem' }}>
            <label style={{ display: 'block', marginBottom: '6px', fontSize: '14px' }}>
              Email
            </label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              placeholder="Nhập email"
              required
              style={{
                width: '100%',
                padding: '10px',
                border: '1px solid #d9d9d9',
                borderRadius: '6px',
                fontSize: '14px',
                boxSizing: 'border-box',
              }}
            />
          </div>

          <div style={{ marginBottom: '1.5rem' }}>
            <label style={{ display: 'block', marginBottom: '6px', fontSize: '14px' }}>
              Mật khẩu
            </label>
            <input
              type="password"
              name="mat_khau"
              value={formData.mat_khau}
              onChange={handleChange}
              placeholder="Nhập mật khẩu"
              required
              style={{
                width: '100%',
                padding: '10px',
                border: '1px solid #d9d9d9',
                borderRadius: '6px',
                fontSize: '14px',
                boxSizing: 'border-box',
              }}
            />
          </div>

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
            }}
          >
            {loading ? 'Đang đăng nhập...' : 'Đăng nhập'}
          </button>
        </form>

        <p style={{ textAlign: 'center', marginTop: '1rem', fontSize: '14px' }}>
          Chưa có tài khoản?{' '}
          <Link to={ROUTES.REGISTER} style={{ color: '#1677ff' }}>
            Đăng ký ngay
          </Link>
        </p>
      </div>
    </div>
  );
};

export default LoginPage;