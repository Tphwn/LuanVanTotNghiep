import { useState, useEffect, useRef, useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { login, loginWithGoogle, clearError, logout } from '../../store/slices/authSlice';
import ROUTES from '../../constants/routes';
import ROLES from '../../constants/roles';
import getRedirectRoute from '../../utils/redirect';
import { validateEmail } from '../../utils/authValidation';
import { setFlashToast } from '../../utils/flashToast';
import {
  getForgotPasswordRouteByRole,
  PORTAL_COPY,
  SHARED_LOGIN_ROLES,
} from '../../utils/authPortal';
import Button from '../../components/common/Button';
import Input from '../../components/common/Input';
import Card from '../../components/common/Card';
import AuthSplitLayout from '../../components/auth/AuthSplitLayout';

const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID;

/**
 * @param {'shared'|'admin'} [props.mode]
 * @param {boolean} [props.showGoogle] - chỉ khách hàng (Google)
 * @param {boolean} [props.showRegister]
 * @param {boolean} [props.redirectIfLoggedIn]
 */
export const AuthLoginPage = ({
  mode = 'shared',
  showGoogle = false,
  showRegister = false,
  redirectIfLoggedIn = false,
}) => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const from = location.state?.from;
  const successMessage = location.state?.message;
  const { loading, error, user, token } = useSelector((state) => state.auth);
  const googleBtnRef = useRef(null);
  const [googleReady, setGoogleReady] = useState(false);
  const [googleError, setGoogleError] = useState('');
  const [localLoginError, setLocalLoginError] = useState('');
  const [formData, setFormData] = useState({ email: '', mat_khau: '' });
  const [sessionReady, setSessionReady] = useState(false);

  const isAdminPortal = mode === 'admin';
  const allowedRoles = isAdminPortal ? [ROLES.ADMIN] : SHARED_LOGIN_ROLES;
  const copy = isAdminPortal ? PORTAL_COPY[ROLES.ADMIN] : PORTAL_COPY.shared;
  const forgotPath = isAdminPortal
    ? getForgotPasswordRouteByRole(ROLES.ADMIN)
    : ROUTES.FORGOT_PASSWORD;
  const allowGoogle = showGoogle && !isAdminPortal && Boolean(GOOGLE_CLIENT_ID);
  useEffect(() => {
    dispatch(logout());
    dispatch(clearError());
    setSessionReady(true);
  }, [dispatch, mode]);

  const isAccountLocked = Boolean(
    (error || localLoginError) && (
      String(error || localLoginError).includes('bị khóa')
      || String(error || localLoginError).toLowerCase().includes('account locked')
    ),
  );

  const redirectIfAllowed = useCallback((authUser) => {
    if (!authUser) return;
    if (!allowedRoles.includes(authUser.vai_tro)) {
      dispatch(logout());
      setLocalLoginError('Tài khoản đăng nhập không hợp lệ.');
      return;
    }
    setFlashToast('Đăng nhập thành công');

    const isManagement =
      authUser.vai_tro === ROLES.ADMIN || authUser.vai_tro === ROLES.DOI_TAC;
    navigate(isManagement ? getRedirectRoute(authUser) : (from || getRedirectRoute(authUser)), {
      replace: true,
    });
  }, [allowedRoles, dispatch, from, navigate]);

  const handleGoogleCredential = useCallback(async (response) => {
    if (!allowGoogle) return;
    if (!response?.credential) {
      setGoogleError('Đăng nhập thất bại. Không nhận được thông tin từ Google.');
      return;
    }
    setGoogleError('');
    try {
      const result = await dispatch(loginWithGoogle(response.credential)).unwrap();
      if (result?.user) {
        if (result.user.vai_tro !== ROLES.KHACH_HANG) {
          dispatch(logout());
          setGoogleError('Đăng nhập Google chỉ dành cho khách hàng.');
          return;
        }
        redirectIfAllowed(result.user);
      }
    } catch (err) {
      setGoogleError(
        typeof err === 'string'
          ? `Đăng nhập thất bại. ${err}`
          : 'Đăng nhập thất bại.',
      );
    }
  }, [allowGoogle, dispatch, redirectIfAllowed]);

  useEffect(() => {
    if (!sessionReady || !allowGoogle) return undefined;

    let cancelled = false;

    const renderButton = () => {
      if (cancelled || !window.google?.accounts?.id || !googleBtnRef.current) return;
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
      return () => { cancelled = true; };
    }

    const existing = document.getElementById('google-gsi-script');
    if (existing) {
      if (existing.dataset.loaded === '1' || window.google?.accounts?.id) {
        renderButton();
        return () => { cancelled = true; };
      }
      const onLoad = () => renderButton();
      existing.addEventListener('load', onLoad);
      return () => {
        cancelled = true;
        existing.removeEventListener('load', onLoad);
      };
    }

    const script = document.createElement('script');
    script.id = 'google-gsi-script';
    script.src = 'https://accounts.google.com/gsi/client';
    script.async = true;
    script.defer = true;
    script.onload = () => {
      script.dataset.loaded = '1';
      renderButton();
    };
    script.onerror = () => {
      if (!cancelled) setGoogleError('Đăng nhập thất bại. Không tải được Google Sign-In.');
    };
    document.body.appendChild(script);
    return () => { cancelled = true; };
  }, [sessionReady, allowGoogle, handleGoogleCredential]);

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
    if (formData.mat_khau.length < 6) {
      setLocalLoginError('Thông tin đăng nhập không hợp lệ.');
      return;
    }
    setLocalLoginError('');
    try {
      const payload = {
        email: formData.email.trim(),
        mat_khau: formData.mat_khau,
      };
      if (isAdminPortal) {
        payload.vai_tro = ROLES.ADMIN;
      }
      const result = await dispatch(login(payload)).unwrap();
      if (result?.user) redirectIfAllowed(result.user);
    } catch (err) {
      if (err?.code === 'EMAIL_NOT_VERIFIED' && err.email && !isAdminPortal) {
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
    if (!sessionReady || !redirectIfLoggedIn) return;
    if (token && user && allowedRoles.includes(user.vai_tro)) {
      const isManagement = user.vai_tro === ROLES.ADMIN || user.vai_tro === ROLES.DOI_TAC;
      navigate(isManagement ? getRedirectRoute(user) : (from || getRedirectRoute(user)), {
        replace: true,
      });
    }
  }, [user, token, navigate, from, allowedRoles, redirectIfLoggedIn, sessionReady]);

  if (!sessionReady) {
    return (
      <AuthSplitLayout>
        <div style={{ textAlign: 'center', color: '#5a7a72', padding: 40 }}>
          Đang chuẩn bị trang đăng nhập...
        </div>
      </AuthSplitLayout>
    );
  }

  const displayError = localLoginError || error || googleError;

  return (
    <AuthSplitLayout>
      <Card className="auth-form-card" style={{ width: '100%', textAlign: 'left' }}>
        <div style={{ textAlign: 'center', marginBottom: 'var(--spacing-xl)' }}>
          <h2 style={{ margin: 0, fontSize: 'var(--font-size-title)', color: 'var(--color-text)' }}>
            {copy.title}
          </h2>
          <p style={{ margin: '6px 0 0', color: 'var(--color-text-secondary)', fontSize: 'var(--font-size-md)' }}>
            {copy.subtitle}
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

        {allowGoogle && (
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
            <Link to={forgotPath} style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-primary)' }}>
              Quên mật khẩu?
            </Link>
          </div>

          <Button type="submit" fullWidth loading={loading} size="lg">
            Đăng nhập
          </Button>
        </form>

        {showRegister && (
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
        )}
      </Card>
    </AuthSplitLayout>
  );
};

const LoginPage = () => (
  <AuthLoginPage
    mode="shared"
    showGoogle
    showRegister
  />
);

export default LoginPage;
