import { useState, useEffect, useRef, useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { login, loginWithGoogle, clearError } from '../../store/slices/authSlice';
import ROUTES from '../../constants/routes';
import getRedirectRoute from '../../utils/redirect';
import { validateEmail } from '../../utils/authValidation';
import { setFlashToast } from '../../utils/flashToast';
import Button from '../../components/common/Button';
import Input from '../../components/common/Input';
import Card from '../../components/common/Card';

const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID;

const LoginPage = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const from = location.state?.from;
  const successMessage = location.state?.message;
  const { loading, error, user } = useSelector((state) => state.auth);
  const googleBtnRef = useRef(null);
  const [googleReady, setGoogleReady] = useState(false);
  const [googleError, setGoogleError] = useState('');
  const [localLoginError, setLocalLoginError] = useState('');

  const [formData, setFormData] = useState({ email: '', mat_khau: '' });

  const isAccountLocked = Boolean(
    (error || localLoginError) && (
      String(error || localLoginError).includes('bị khóa')
      || String(error || localLoginError).toLowerCase().includes('account locked')
    ),
  );

  const handleGoogleCredential = useCallback(async (response) => {
    if (!response?.credential) {
      setGoogleError('Đăng nhập thất bại. Không nhận được thông tin từ Google.');
      return;
    }
    setGoogleError('');
    try {
      const result = await dispatch(loginWithGoogle(response.credential)).unwrap();
      if (result?.user) {
        setFlashToast('Đăng nhập thành công');
        navigate(from || getRedirectRoute(result.user), { replace: true });
      }
    } catch (err) {
      setGoogleError(
        typeof err === 'string'
          ? `Đăng nhập thất bại. ${err}`
          : 'Đăng nhập thất bại.',
      );
    }
  }, [dispatch, navigate, from]);

  useEffect(() => {
    if (!GOOGLE_CLIENT_ID || !googleBtnRef.current) return undefined;

    const renderButton = () => {
      if (!window.google?.accounts?.id || !googleBtnRef.current) return;
      window.google.accounts.id.initialize({
        client_id: GOOGLE_CLIENT_ID,
        callback: handleGoogleCredential,
        auto_select: false,
        cancel_on_tap_outside: true,
      });
      googleBtnRef.current.innerHTML = '';
      window.google.accounts.id.renderButton(googleBtnRef.current, {
        theme: 'outline',
        size: 'large',
        shape: 'rectangular',
        text: 'signin_with',
        width: 360,
        locale: 'vi',
      });
      setGoogleReady(true);
    };

    if (window.google?.accounts?.id) {
      renderButton();
      return undefined;
    }

    const existing = document.getElementById('google-gsi-script');
    if (existing) {
      existing.addEventListener('load', renderButton);
      return () => existing.removeEventListener('load', renderButton);
    }

    const script = document.createElement('script');
    script.id = 'google-gsi-script';
    script.src = 'https://accounts.google.com/gsi/client';
    script.async = true;
    script.defer = true;
    script.onload = renderButton;
    script.onerror = () => setGoogleError('Đăng nhập thất bại. Không tải được Google Sign-In.');
    document.body.appendChild(script);
    return undefined;
  }, [handleGoogleCredential]);

  const handleChange = (e) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
    if (error) dispatch(clearError());
    if (localLoginError) setLocalLoginError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const emailErr = validateEmail(formData.email);
    const pwdEmpty = !String(formData.mat_khau || '');
    if (emailErr || pwdEmpty) {
      setLocalLoginError('Thông tin đăng nhập không hợp lệ.');
      return;
    }
    // Login chỉ kiểm tra tối thiểu; ràng buộc chi tiết chỉ áp dụng khi đăng ký
    if (formData.mat_khau.length < 6) {
      setLocalLoginError('Thông tin đăng nhập không hợp lệ.');
      return;
    }
    setLocalLoginError('');
    try {
      const result = await dispatch(login({
        email: formData.email.trim(),
        mat_khau: formData.mat_khau,
      })).unwrap();
      if (result?.user) {
        setFlashToast('Đăng nhập thành công');
        navigate(from || getRedirectRoute(result.user), { replace: true });
      }
    } catch (err) {
      if (err?.code === 'EMAIL_NOT_VERIFIED' && err.email) {
        navigate(ROUTES.REGISTER, {
          replace: true,
          state: {
            pendingEmail: err.email,
            step: 'otp',
            info: err.message || 'Email chưa xác thực. Vui lòng nhập mã OTP.',
          },
        });
        return;
      }
      if (typeof err === 'string') {
        setLocalLoginError(err);
      } else if (err?.message) {
        setLocalLoginError(err.message);
      } else {
        setLocalLoginError('Email hoặc mật khẩu không đúng');
      }
    }
  };

  useEffect(() => {
    if (user) {
      navigate(from || getRedirectRoute(user), { replace: true });
    }
  }, [user, navigate, from]);

  const displayError = localLoginError || error || googleError;

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'linear-gradient(135deg, #e6f4ff 0%, #f0f2f5 100%)',
    }}
    >
      <Card style={{ width: '100%', maxWidth: '420px', textAlign: 'left' }}>
        <div style={{ textAlign: 'center', marginBottom: 'var(--spacing-xl)' }}>
          <h2 style={{ margin: 0, fontSize: 'var(--font-size-title)', color: 'var(--color-text)' }}>
            Đăng Nhập
          </h2>
          <p style={{ margin: '6px 0 0', color: 'var(--color-text-secondary)', fontSize: 'var(--font-size-md)' }}>
            Chào mừng trở lại Hotel Booking
          </p>
        </div>

        {successMessage && !displayError && (
          <div style={{
            background: '#f6ffed',
            border: '1px solid #b7eb8f',
            color: '#389e0d',
            padding: '12px 14px',
            borderRadius: 'var(--radius-md)',
            marginBottom: 'var(--spacing-md)',
            fontSize: 'var(--font-size-md)',
          }}
          >
            {successMessage}
          </div>
        )}

        {displayError && (
          <div style={{
            background: isAccountLocked ? '#fff7e6' : '#fff2f0',
            border: `1px solid ${isAccountLocked ? '#ffd591' : '#ffccc7'}`,
            color: isAccountLocked ? '#ad6800' : 'var(--color-danger)',
            padding: '12px 14px',
            borderRadius: 'var(--radius-md)',
            marginBottom: 'var(--spacing-md)',
            fontSize: 'var(--font-size-md)',
          }}
          >
            <div style={{ fontWeight: 600, marginBottom: 4 }}>
              {isAccountLocked ? 'Không thể đăng nhập' : 'Đăng nhập thất bại'}
            </div>
            <div>{displayError}</div>
          </div>
        )}

        {GOOGLE_CLIENT_ID && (
          <>
            <div
              ref={googleBtnRef}
              style={{
                display: 'flex',
                justifyContent: 'center',
                minHeight: 44,
                marginBottom: 16,
                opacity: googleReady ? 1 : 0.6,
              }}
            />
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: 12,
              marginBottom: 16,
              color: 'var(--color-text-secondary)',
              fontSize: 13,
            }}
            >
              <span style={{ flex: 1, height: 1, background: '#e5e7eb' }} />
              hoặc
              <span style={{ flex: 1, height: 1, background: '#e5e7eb' }} />
            </div>
          </>
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
            <Link to={ROUTES.FORGOT_PASSWORD} style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-primary)' }}>
              Quên mật khẩu?
            </Link>
          </div>

          <Button type="submit" fullWidth loading={loading} size="lg">
            Đăng nhập
          </Button>
        </form>

        <p style={{
          textAlign: 'center',
          marginTop: 'var(--spacing-lg)',
          fontSize: 'var(--font-size-md)',
          color: 'var(--color-text-secondary)',
        }}
        >
          Chưa có tài khoản?
          {' '}
          <Link to={ROUTES.REGISTER} style={{ color: 'var(--color-primary)', fontWeight: 500 }}>
            Đăng ký ngay
          </Link>
        </p>
      </Card>
    </div>
  );
};

export default LoginPage;
