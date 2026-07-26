import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import authService from '../../services/authService';
import ROUTES from '../../constants/routes';
import ROLES from '../../constants/roles';
import Button from '../../components/common/Button';
import Input from '../../components/common/Input';
import Card from '../../components/common/Card';
import {
  validateEmail,
  validatePassword,
  validatePasswordConfirm,
} from '../../utils/authValidation';
import { getLoginRouteByRole, PORTAL_COPY } from '../../utils/authPortal';

/**
 * @param {'shared'|'admin'} [props.mode]
 */
export const AuthForgotPasswordPage = ({ mode = 'shared' }) => {
  const navigate = useNavigate();
  const [step, setStep] = useState('email');
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [resetToken, setResetToken] = useState('');
  const [matKhau, setMatKhau] = useState('');
  const [xacNhan, setXacNhan] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [info, setInfo] = useState('');

  const isAdminPortal = mode === 'admin';
  const copy = isAdminPortal ? PORTAL_COPY[ROLES.ADMIN] : PORTAL_COPY.shared;
  const loginPath = isAdminPortal
    ? getLoginRouteByRole(ROLES.ADMIN)
    : ROUTES.LOGIN;

  const buildRolePayload = () => (
    isAdminPortal ? { vai_tro: ROLES.ADMIN } : {}
  );

  const handleSendOtp = async (e) => {
    e.preventDefault();
    const emailErr = validateEmail(email);
    if (emailErr) {
      setError(emailErr);
      return;
    }
    setLoading(true);
    setError('');
    try {
      const res = await authService.forgotPassword({
        email: email.trim(),
        ...buildRolePayload(),
      });
      setInfo(res.data?.data?.message || res.data?.message || 'Mã OTP đã được gửi.');
      setStep('otp');
      setOtp('');
    } catch (err) {
      setError(err.response?.data?.message || 'Không gửi được OTP');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const res = await authService.verifyResetOtp({
        email: email.trim(),
        otp: otp.trim(),
        ...buildRolePayload(),
      });
      const token = res.data?.data?.reset_token || res.data?.reset_token;
      if (!token) {
        setError('Không nhận được token đặt lại mật khẩu');
        return;
      }
      setResetToken(token);
      setInfo('Xác thực thành công. Nhập mật khẩu mới.');
      setStep('password');
    } catch (err) {
      setError(err.response?.data?.message || 'OTP không hợp lệ');
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    const pwdErr = validatePassword(matKhau)
      || validatePasswordConfirm(matKhau, xacNhan);
    if (pwdErr) {
      setError(pwdErr);
      return;
    }
    setLoading(true);
    setError('');
    try {
      await authService.resetPassword({ reset_token: resetToken, mat_khau: matKhau });
      navigate(loginPath, {
        replace: true,
        state: { message: 'Đặt lại mật khẩu thành công. Vui lòng đăng nhập.' },
      });
    } catch (err) {
      setError(err.response?.data?.message || 'Đặt lại mật khẩu thất bại');
    } finally {
      setLoading(false);
    }
  };

  const handleResendOtp = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await authService.resendOtp({
        email: email.trim(),
        purpose: 'reset',
        ...buildRolePayload(),
      });
      setInfo(res.data?.data?.message || res.data?.message || 'Đã gửi lại mã OTP.');
    } catch (err) {
      setError(err.response?.data?.message || 'Không gửi lại được OTP');
    } finally {
      setLoading(false);
    }
  };

  const titles = {
    email: 'Quên mật khẩu',
    otp: 'Nhập mã OTP',
    password: 'Đặt mật khẩu mới',
  };

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'linear-gradient(135deg, #e6f4ff 0%, #f0f2f5 100%)',
      padding: 'var(--spacing-lg)',
    }}
    >
      <Card style={{ width: '100%', maxWidth: '420px', textAlign: 'left' }}>
        <div style={{ textAlign: 'center', marginBottom: 'var(--spacing-xl)' }}>
          <h2 style={{ margin: 0, fontSize: 'var(--font-size-title)', color: 'var(--color-text)' }}>
            {titles[step]}
          </h2>
          <p style={{ margin: '6px 0 0', color: 'var(--color-text-secondary)', fontSize: 'var(--font-size-md)' }}>
            {step === 'email' && copy.forgotHint}
            {step === 'otp' && `Mã OTP đã gửi tới ${email}`}
            {step === 'password' && 'Mật khẩu mới tối thiểu 6 ký tự'}
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
          }}
          >
            {error}
          </div>
        )}

        {info && (
          <div style={{
            background: '#f6ffed',
            border: '1px solid #b7eb8f',
            color: '#389e0d',
            padding: '10px 14px',
            borderRadius: 'var(--radius-md)',
            marginBottom: 'var(--spacing-md)',
            fontSize: 'var(--font-size-md)',
          }}
          >
            {info}
          </div>
        )}

        {step === 'email' && (
          <form onSubmit={handleSendOtp}>
            <Input
              label="Email"
              name="email"
              type="email"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                setError('');
              }}
              placeholder="example@gmail.com"
              required
            />
            <Button type="submit" fullWidth loading={loading} size="lg">
              Gửi mã OTP
            </Button>
          </form>
        )}

        {step === 'otp' && (
          <form onSubmit={handleVerifyOtp}>
            <Input
              label="Mã OTP"
              name="otp"
              type="text"
              inputMode="numeric"
              maxLength={6}
              value={otp}
              onChange={(e) => {
                setOtp(e.target.value.replace(/\D/g, '').slice(0, 6));
                setError('');
              }}
              placeholder="6 chữ số"
              required
            />
            <Button type="submit" fullWidth loading={loading} size="lg">
              Xác thực OTP
            </Button>
            <button
              type="button"
              onClick={handleResendOtp}
              disabled={loading}
              style={{
                display: 'block',
                width: '100%',
                marginTop: 12,
                border: 'none',
                background: 'transparent',
                color: 'var(--color-primary)',
                cursor: loading ? 'not-allowed' : 'pointer',
                fontSize: 'var(--font-size-sm)',
              }}
            >
              Gửi lại mã OTP
            </button>
          </form>
        )}

        {step === 'password' && (
          <form onSubmit={handleResetPassword}>
            <Input
              label="Mật khẩu mới"
              name="mat_khau"
              type="password"
              value={matKhau}
              onChange={(e) => {
                setMatKhau(e.target.value);
                setError('');
              }}
              placeholder="Tối thiểu 6 ký tự"
              required
            />
            <Input
              label="Xác nhận mật khẩu"
              name="xac_nhan"
              type="password"
              value={xacNhan}
              onChange={(e) => {
                setXacNhan(e.target.value);
                setError('');
              }}
              placeholder="Nhập lại mật khẩu"
              required
            />
            <Button type="submit" fullWidth loading={loading} size="lg">
              Đặt lại mật khẩu
            </Button>
          </form>
        )}

        <p style={{
          textAlign: 'center',
          marginTop: 'var(--spacing-lg)',
          fontSize: 'var(--font-size-md)',
          color: 'var(--color-text-secondary)',
        }}
        >
          <Link to={loginPath} style={{ color: 'var(--color-primary)' }}>
            Quay lại đăng nhập
          </Link>
        </p>
      </Card>
    </div>
  );
};

const ForgotPasswordPage = () => (
  <AuthForgotPasswordPage mode="shared" />
);

export default ForgotPasswordPage;
