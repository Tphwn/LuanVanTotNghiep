import { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { register, verifyRegisterOtp, clearError } from '../../store/slices/authSlice';
import authService from '../../services/authService';
import ROUTES from '../../constants/routes';
import ROLES from '../../constants/roles';
import getRedirectRoute from '../../utils/redirect';
import {
  validateEmail,
  validatePhone,
  validatePassword,
  validatePasswordConfirm,
} from '../../utils/authValidation';
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
  const [formError, setFormError] = useState('');
  const [fieldErrors, setFieldErrors] = useState({});
  const [resendLoading, setResendLoading] = useState(false);

  const [formData, setFormData] = useState({
    ho_ten: '', email: '', so_dien_thoai: '', mat_khau: '', xac_nhan_mat_khau: '',
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (error) dispatch(clearError());
    if (formError) setFormError('');
    if (fieldErrors[name]) {
      setFieldErrors((prev) => ({ ...prev, [name]: undefined }));
    }
  };

  const validateRegisterFields = () => {
    const errors = {};
    if (!formData.ho_ten.trim() || formData.ho_ten.trim().length < 2) {
      errors.ho_ten = 'Họ tên không được để trống (tối thiểu 2 ký tự).';
    }

    const emailErr = validateEmail(formData.email);
    if (emailErr) errors.email = emailErr;

    const phoneErr = validatePhone(formData.so_dien_thoai);
    if (phoneErr) errors.so_dien_thoai = phoneErr;

    const pwdErr = validatePassword(formData.mat_khau);
    if (pwdErr) errors.mat_khau = pwdErr;

    const confirmErr = validatePasswordConfirm(formData.mat_khau, formData.xac_nhan_mat_khau);
    if (confirmErr) errors.xac_nhan_mat_khau = confirmErr;

    return errors;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errors = validateRegisterFields();
    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      setFormError(' Vui lòng điền đúng thông tin.');
      return;
    }

    setFieldErrors({});
    setFormError('');
    const { xac_nhan_mat_khau, ...dataToSend } = formData;
    try {
      const result = await dispatch(register({
        ...dataToSend,
        email: dataToSend.email.trim(),
        so_dien_thoai: dataToSend.so_dien_thoai.trim(),
        ho_ten: dataToSend.ho_ten.trim(),
      })).unwrap();
      if (result?.needs_otp) {
        setPendingEmail(result.email || dataToSend.email.trim());
        setInfo(result.message || 'Đã gửi mã OTP tới email của bạn.');
        setStep('otp');
        setOtp('');
      }
    } catch (err) {
      const msg = typeof err === 'string' ? err : 'Đăng ký thất bại';
      if (msg.includes('Email')) setFieldErrors({ email: msg });
      else if (msg.includes('điện thoại') || msg.includes('Số điện thoại')) {
        setFieldErrors({ so_dien_thoai: msg });
      }
      setFormError(msg);
    }
  };

  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    setFormError('');
    if (!otp.trim() || otp.trim().length !== 6) {
      setFormError('Mã OTP gồm 6 chữ số.');
      return;
    }
    try {
      const result = await dispatch(verifyRegisterOtp({
        email: pendingEmail,
        otp: otp.trim(),
      })).unwrap();
      if (result?.user) {
        navigate(getRedirectRoute(result.user), { replace: true });
      }
    } catch (err) {
      setFormError(typeof err === 'string' ? err : 'Xác thực OTP thất bại');
    }
  };

  const handleResendOtp = async () => {
    setResendLoading(true);
    setFormError('');
    try {
      const res = await authService.resendOtp({ email: pendingEmail, purpose: 'register' });
      setInfo(res.data?.data?.message || res.data?.message || 'Đã gửi lại mã OTP.');
    } catch (err) {
      setFormError(err.response?.data?.message || 'Không gửi lại được OTP');
    } finally {
      setResendLoading(false);
    }
  };

  useEffect(() => {
    // Chỉ khách hàng đã login mới bỏ qua trang đăng ký
    if (user?.vai_tro === ROLES.KHACH_HANG && step !== 'otp') {
      navigate(getRedirectRoute(user), { replace: true });
    }
  }, [user, navigate, step]);

  const displayError = formError || error;

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

        {displayError && (
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
            <div style={{ fontWeight: 600, marginBottom: 4 }}>Đăng ký thất bại</div>
            <div>{displayError}</div>
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
          <form onSubmit={handleSubmit} noValidate>
            <Input
              label="Họ tên"
              name="ho_ten"
              type="text"
              value={formData.ho_ten}
              onChange={handleChange}
              placeholder="Nguyễn Văn A"
              error={fieldErrors.ho_ten}
              required
            />
            <Input
              label="Email"
              name="email"
              type="email"
              value={formData.email}
              onChange={handleChange}
              placeholder="example@gmail.com"
              error={fieldErrors.email}
              required
            />
            <Input
              label="Số điện thoại"
              name="so_dien_thoai"
              type="tel"
              value={formData.so_dien_thoai}
              onChange={handleChange}
              placeholder="09xxxxxxxx"
              error={fieldErrors.so_dien_thoai}
              required
            />
            <Input
              label="Mật khẩu"
              name="mat_khau"
              type="password"
              value={formData.mat_khau}
              onChange={handleChange}
              placeholder="Tối thiểu 6 ký tự, có chữ và số"
              error={fieldErrors.mat_khau}
              required
            />
            <Input
              label="Xác nhận mật khẩu"
              name="xac_nhan_mat_khau"
              type="password"
              value={formData.xac_nhan_mat_khau}
              onChange={handleChange}
              placeholder="Nhập lại mật khẩu"
              error={fieldErrors.xac_nhan_mat_khau}
              required
            />
            <Button
              type="submit"
              fullWidth
              loading={loading}
              size="lg"
              style={{ marginTop: 'var(--spacing-sm)' }}
            >
              Đăng ký
            </Button>
          </form>
        ) : (
          <form onSubmit={handleVerifyOtp} noValidate>
            <Input
              label="Mã OTP"
              name="otp"
              type="text"
              value={otp}
              onChange={(e) => {
                setOtp(e.target.value.replace(/\D/g, '').slice(0, 6));
                if (error) dispatch(clearError());
                if (formError) setFormError('');
              }}
              placeholder="6 chữ số"
              required
            />
            <Button
              type="submit"
              fullWidth
              loading={loading}
              size="lg"
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
                setFormError('');
                setFieldErrors({});
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

        <p style={{
          textAlign: 'center',
          marginTop: 'var(--spacing-lg)',
          fontSize: 'var(--font-size-md)',
          color: 'var(--color-text-secondary)',
        }}
        >
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
