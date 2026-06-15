import { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { login, clearError } from '../../store/slices/authSlice';
import ROUTES from '../../constants/routes';
import getRedirectRoute from '../../utils/redirect';
import Button from '../../components/common/Button';
import Input from '../../components/common/Input';
import Card from '../../components/common/Card';

const LoginPage = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const from = location.state?.from;
  const { loading, error, user } = useSelector((state) => state.auth);

  const [formData, setFormData] = useState({ email: '', mat_khau: '' });

  const handleChange = (e) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
    if (error) dispatch(clearError());
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const result = await dispatch(login(formData)).unwrap();
      if (result?.user) {
        navigate(from || getRedirectRoute(result.user), { replace: true });
      }
    } catch (err) {
      console.error('Login failed:', err);
    }
  };

  useEffect(() => {
    if (user) {
      navigate(from || getRedirectRoute(user), { replace: true });
    }
  }, [user, navigate, from]);

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'linear-gradient(135deg, #e6f4ff 0%, #f0f2f5 100%)',
    }}>
     <Card style={{ width: '100%', maxWidth: '420px', textAlign: 'left' }}>

        <div style={{ textAlign: 'center', marginBottom: 'var(--spacing-xl)' }}>
          <div style={{ fontSize: '40px', marginBottom: '8px' }}>🏨</div>
          <h2 style={{ margin: 0, fontSize: 'var(--font-size-title)', color: 'var(--color-text)' }}>
            Đăng Nhập
          </h2>
          <p style={{ margin: '6px 0 0', color: 'var(--color-text-secondary)', fontSize: 'var(--font-size-md)' }}>
            Chào mừng trở lại Hotel Booking
          </p>
        </div>

        {error && (
          <div style={{
            background: '#fff2f0',
            border: '1px solid #ffccc7',
            color: 'var(--color-danger)',
            padding: '10px 14px',
            borderRadius: 'var(--radius-md)',
            marginBottom: 'var(--spacing-md)',
            fontSize: 'var(--font-size-md)',
          }}>
            ⚠️ {error}
          </div>
        )}
        <form onSubmit={handleSubmit}>
          <Input
            label="Email"
            name="email"
            type="email"
            value={formData.email}
            onChange={handleChange}
            placeholder="example@gmail.com"
            required
          />
          <Input
            label="Mật khẩu"
            name="mat_khau"
            type="password"
            value={formData.mat_khau}
            onChange={handleChange}
            placeholder="Nhập mật khẩu"
            required
          />

          <div style={{ marginBottom: 'var(--spacing-md)', textAlign: 'right' }}>
            <Link to="/forgot-password" style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-primary)' }}>
              Quên mật khẩu?
            </Link>
          </div>

          <Button type="submit" fullWidth loading={loading} size="lg">
            Đăng nhập
          </Button>
        </form>

        <p style={{ textAlign: 'center', marginTop: 'var(--spacing-lg)', fontSize: 'var(--font-size-md)', color: 'var(--color-text-secondary)' }}>
          Chưa có tài khoản?{' '}
          <Link to={ROUTES.REGISTER} style={{ color: 'var(--color-primary)', fontWeight: 500 }}>
            Đăng ký ngay
          </Link>
        </p>
      </Card>
    </div>
  );
};

export default LoginPage;