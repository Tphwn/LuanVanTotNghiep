import { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { register, verifyRegisterOtp, clearError } from '../../store/slices/authSlice';
import authService from '../../services/authService';
import ROUTES from '../../constants/routes';
import getRedirectRoute from '../../utils/redirect';
import Button from '../../components/common/Button';
import Input from '../../components/common/Input';
import Card from '../../components/common/Card';

const RegisterPage = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const { loading, error, user } = useSelector((state) => state.auth);

  const [step, setStep] = useState(location.state?.step === 'otp' ? 'otp' : 'form');
  const [pendingEmail, setPendingEmail] = useState(location.state?.pendingEmail || '');
  const [otp, setOtp] = useState('');
  const [info, setInfo] = useState(location.state?.info || '');
  const [localError, setLocalError] = useState('');
  const [resendLoading, setResendLoading] = useState(false);

  const [formData, setFormData] = useState({
    ho_ten: '', email: '', so_dien_thoai: '', mat_khau: '', xac_nhan_mat_khau: '',
  });

  const handleChange = (e) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
    if (error) dispatch(clearError());
    if (localError) setLocalError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (formData.mat_khau !== formData.xac_nhan_mat_khau) {
      setLocalError('Mật khẩu xác nhận không khớp');
      return;
    }
    const { xac_nhan_mat_khau, ...dataToSend } = formData;
    try {
      const result = await dispatch(register(dataToSend)).unwrap();
      if (result?.needs_otp) {
        setPendingEmail(result.email || dataToSend.email);
        setInfo(result.message || 'Đã gửi mã OTP tới email của bạn.');
        setStep('otp');
        setOtp('');
      }
    } catch (err) {
      setLocalError(typeof err === 'string' ? err : 'Đăng ký thất bại');
    }
  };

  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    setLocalError('');
    try {
      const result = await dispatch(verifyRegisterOtp({
        email: pendingEmail,
        otp: otp.trim(),
      })).unwrap();
      if (result?.user) {
        navigate(getRedirectRoute(result.user), { replace: true });
      }
    } catch (err) {
      setLocalError(typeof err === 'string' ? err : 'Xác thực OTP thất bại');
    }
  };

  const handleResendOtp = async () => {
    setResendLoading(true);
    setLocalError('');
    try {
      const res = await authService.resendOtp({ email: pendingEmail, purpose: 'register' });
      setInfo(res.data?.data?.message || res.data?.message || 'Đã gửi lại mã OTP.');
    } catch (err) {
      setLocalError(err.response?.data?.message || 'Không gửi lại được OTP');
    } finally {
      setResendLoading(false);
    }
  };

  useEffect(() => {
    if (user && step !== 'otp') {
      navigate(getRedirectRoute(user), { replace: true });
    }
  }, [user, navigate, step]);

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
      <Card style={{ width: '100%', maxWidth: '460px', textAlign: 'left' }}>
        <div style={{ textAlign: 'center', marginBottom: 'var(--spacing-xl)' }}>
          <h2 style={{ margin: 0, fontSize: 'var(--font-size-title)', color: 'var(--color-text)' }}>
            {step === 'otp' ? 'Xác thực email' : 'ĐĂNG KÝ TÀI KHOẢN'}
          </h2>
          <p style={{ margin: '6px 0 0', color: 'var(--color-text-secondary)', fontSize: 'var(--font-size-md)' }}>
            {step === 'otp'
              ? `Nhập mã OTP đã gửi tới ${pendingEmail}`
              : 'Đăng ký để trải nghiệm dịch vụ'}
          </p>
        </div>

        {(error || localError) && (
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
            {error || localError}
          </div>
        )}

        {info && step === 'otp' && (
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

        {step === 'form' ? (
          <form onSubmit={handleSubmit}>
            <Input label="Họ tên" name="ho_ten" type="text" value={formData.ho_ten} onChange={handleChange}
              placeholder="Nguyễn Văn A" required
            />
            <Input label="Email" name="email" type="email" value={formData.email} onChange={handleChange}
              placeholder="example@gmail.com" required
            />
            <Input label="Số điện thoại" name="so_dien_thoai" type="tel" value={formData.so_dien_thoai} onChange={handleChange}
              placeholder="09xxxxxxxx" required
            />
            <Input label="Mật khẩu" name="mat_khau" type="password" value={formData.mat_khau} onChange={handleChange}
              placeholder="Tối thiểu 6 ký tự" required
            />
            <Input label="Xác nhận mật khẩu" name="xac_nhan_mat_khau" type="password" value={formData.xac_nhan_mat_khau} onChange={handleChange}
              placeholder="Nhập lại mật khẩu" required
            />
            <Button type="submit" fullWidth loading={loading} size="lg"
              style={{ marginTop: 'var(--spacing-sm)' }}
            >
              Đăng ký
            </Button>
          </form>
        ) : (
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
                if (error) dispatch(clearError());
                if (localError) setLocalError('');
              }}
              placeholder="6 chữ số"
              required
            />
            <Button type="submit" fullWidth loading={loading} size="lg"
              style={{ marginTop: 'var(--spacing-sm)' }}
            >
              Xác thực
            </Button>
            <Button
              type="button"
              fullWidth
              variant="outline"
              loading={resendLoading}
              onClick={handleResendOtp}
              style={{ marginTop: 10 }}
            >
              Gửi lại mã OTP
            </Button>
            <button
              type="button"
              onClick={() => {
                setStep('form');
                setInfo('');
                setOtp('');
                dispatch(clearError());
              }}
              style={{
                display: 'block',
                width: '100%',
                marginTop: 12,
                border: 'none',
                background: 'transparent',
                color: 'var(--color-primary)',
                cursor: 'pointer',
                fontSize: 'var(--font-size-md)',
              }}
            >
              Quay lại form đăng ký
            </button>
          </form>
        )}

        <p style={{ textAlign: 'center', marginTop: 'var(--spacing-lg)', fontSize: 'var(--font-size-md)', color: 'var(--color-text-secondary)' }}>
          Đã có tài khoản?
          {' '}
          <Link to={ROUTES.LOGIN} style={{ color: 'var(--color-primary)', fontWeight: 500 }}>
            Đăng nhập
          </Link>
        </p>
      </Card>
    </div>
  );
};

export default RegisterPage;
