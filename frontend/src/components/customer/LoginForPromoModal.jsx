import { useCallback, useEffect, useRef, useState } from 'react';
import { useDispatch } from 'react-redux';
import { Link } from 'react-router-dom';
import { X } from 'lucide-react';
import { login, loginWithGoogle, clearError } from '../../store/slices/authSlice';
import ROUTES from '../../constants/routes';
import ROLES from '../../constants/roles';
import { validateEmail } from '../../utils/authValidation';
import Input from '../common/Input';

const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID;

/**
 * Modal đăng nhập trên trang thanh toán — chỉ để áp voucher.
 * Đóng (X) = không đăng nhập, không áp mã.
 */
const LoginForPromoModal = ({
  open,
  returnPath = '',
  onClose,
  onLoggedIn,
}) => {
  const dispatch = useDispatch();
  const googleBtnRef = useRef(null);
  const [googleReady, setGoogleReady] = useState(false);
  const [formData, setFormData] = useState({ email: '', mat_khau: '' });
  const [localError, setLocalError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!open) return;
    setFormData({ email: '', mat_khau: '' });
    setLocalError('');
    setSubmitting(false);
    dispatch(clearError());
  }, [open, dispatch]);

  const finishLogin = useCallback(async (authUser) => {
    if (!authUser) return;
    if (authUser.vai_tro !== ROLES.KHACH_HANG) {
      setLocalError('Chỉ tài khoản khách hàng mới dùng được voucher.');
      return;
    }
    await onLoggedIn?.(authUser);
  }, [onLoggedIn]);

  const handleGoogleCredential = useCallback(async (response) => {
    if (!response?.credential) {
      setLocalError('Đăng nhập Google thất bại.');
      return;
    }
    setLocalError('');
    setSubmitting(true);
    try {
      const result = await dispatch(loginWithGoogle(response.credential)).unwrap();
      if (result?.user) await finishLogin(result.user);
    } catch (err) {
      setLocalError(typeof err === 'string' ? err : (err?.message || 'Đăng nhập Google thất bại'));
    } finally {
      setSubmitting(false);
    }
  }, [dispatch, finishLogin]);

  useEffect(() => {
    if (!open || !GOOGLE_CLIENT_ID) return undefined;
    let cancelled = false;

    const renderButton = () => {
      if (cancelled || !window.google?.accounts?.id || !googleBtnRef.current) return;
      googleBtnRef.current.innerHTML = '';
      window.google.accounts.id.initialize({
        client_id: GOOGLE_CLIENT_ID,
        callback: handleGoogleCredential,
        auto_select: false,
        cancel_on_tap_outside: true,
      });
      window.google.accounts.id.renderButton(googleBtnRef.current, {
        theme: 'outline',
        size: 'large',
        text: 'signin_with',
        shape: 'rectangular',
        width: 360,
        locale: 'vi',
      });
      if (!cancelled) setGoogleReady(true);
    };

    if (window.google?.accounts?.id) {
      renderButton();
      return () => { cancelled = true; };
    }

    const existing = document.querySelector('script[data-google-gsi]');
    if (existing) {
      existing.addEventListener('load', renderButton);
      return () => {
        cancelled = true;
        existing.removeEventListener('load', renderButton);
      };
    }

    const script = document.createElement('script');
    script.src = 'https://accounts.google.com/gsi/client';
    script.async = true;
    script.defer = true;
    script.dataset.googleGsi = '1';
    script.onload = renderButton;
    document.head.appendChild(script);
    return () => { cancelled = true; };
  }, [open, handleGoogleCredential]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (submitting) return;
    const emailErr = validateEmail(formData.email, { required: true });
    if (emailErr) {
      setLocalError(emailErr);
      return;
    }
    if (!formData.mat_khau || formData.mat_khau.length < 6) {
      setLocalError('Email hoặc mật khẩu không đúng');
      return;
    }
    setLocalError('');
    setSubmitting(true);
    try {
      const result = await dispatch(login({
        email: formData.email.trim(),
        mat_khau: formData.mat_khau,
      })).unwrap();
      if (result?.user) await finishLogin(result.user);
    } catch (err) {
      setLocalError(
        typeof err === 'string'
          ? err
          : (err?.message || 'Email hoặc mật khẩu không đúng'),
      );
    } finally {
      setSubmitting(false);
    }
  };

  if (!open) return null;

  const authState = returnPath ? { from: returnPath } : undefined;

  return (
    <div className="login-for-promo-overlay" role="presentation" onClick={onClose}>
      <div
        className="login-for-promo-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="login-for-promo-title"
        onClick={(e) => e.stopPropagation()}
      >
        <header className="login-for-promo-modal__header">
          <div>
            <h2 id="login-for-promo-title">Đăng nhập để sử dụng voucher</h2>
            <p className="login-for-promo-modal__sub">
              Hãy đăng nhập để áp mã giảm giá.
            </p>
          </div>
          <button
            type="button"
            className="login-for-promo-modal__close"
            onClick={onClose}
            aria-label="Đóng"
          >
            <X size={20} strokeWidth={2.25} />
          </button>
        </header>

        <form className="login-for-promo-modal__body" onSubmit={handleSubmit} noValidate>
          {localError && (
            <div className="login-for-promo-modal__error" role="alert">
              {localError}
            </div>
          )}

          <Input
            label="Email"
            name="email"
            type="email"
            value={formData.email}
            onChange={(e) => setFormData((s) => ({ ...s, email: e.target.value }))}
            placeholder="email@example.com"
            autoComplete="email"
            disabled={submitting}
            required
          />
          <Input
            label="Mật khẩu"
            name="mat_khau"
            type="password"
            value={formData.mat_khau}
            onChange={(e) => setFormData((s) => ({ ...s, mat_khau: e.target.value }))}
            placeholder="••••••••"
            autoComplete="current-password"
            disabled={submitting}
            required
          />

          <div className="login-for-promo-modal__forgot">
            <Link to={ROUTES.FORGOT_PASSWORD} state={authState}>Quên mật khẩu?</Link>
          </div>

          <button
            type="submit"
            className="btn btn-primary login-for-promo-modal__submit"
            disabled={submitting}
          >
            {submitting ? 'Đang đăng nhập...' : 'Đăng nhập'}
          </button>

          {GOOGLE_CLIENT_ID && (
            <>
              <div className="login-for-promo-modal__divider">
                <span>hoặc</span>
              </div>
              <div
                ref={googleBtnRef}
                className="login-for-promo-modal__google"
                style={{ opacity: googleReady ? 1 : 0.55 }}
              />
            </>
          )}

          <p className="login-for-promo-modal__register">
            Chưa có tài khoản?
            {' '}
            <Link to={ROUTES.REGISTER} state={authState}>Đăng ký</Link>
          </p>
        </form>
      </div>
    </div>
  );
};

export default LoginForPromoModal;
