import { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate, Link } from 'react-router-dom';
import { register, clearError } from '../../store/slices/authSlice';
import ROUTES from '../../constants/routes';
import getRedirectRoute from '../../utils/redirect';
import Button from '../../components/common/Button';
import Input from '../../components/common/Input';
import Card from '../../components/common/Card';

const RegisterPage = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { loading, error, user } = useSelector((state) => state.auth);

  const [formData, setFormData] = useState({
    ho_ten: '', email: '', so_dien_thoai: '', mat_khau: '', xac_nhan_mat_khau: '',
  });
  const [localError, setLocalError] = useState('');

  const handleChange = (e) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
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
    if (user) {
      navigate(getRedirectRoute(user), { replace: true });
    }
  }, [user, navigate]);

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'linear-gradient(135deg, #e6f4ff 0%, #f0f2f5 100%)',
      padding: 'var(--spacing-lg)',
    }}>
     <Card style={{ width: '100%', maxWidth: '460px', textAlign: 'left'}}>

        <div style={{ textAlign:'center', marginBottom: 'var(--spacing-xl)'}}>
          <div style={{ fontSize:'40px', marginBottom: '8px'}}></div>
          <h2 style={{ margin: 0, fontSize:'var(--font-size-title)', color: 'var(--color-text)'}}>
          ĐĂNG KÝ TÀI KHOẢN
          </h2>
          <p style={{ margin:'6px 0 0', color: 'var(--color-text-secondary)', fontSize: 'var(--font-size-md)'}}>
            Đăng ký để trải nghiệm dịch vụ
          </p>
        </div>

        {(error || localError) && (
          <div style={{
            background:'#fff2f0',
            border: '1px solid #ffccc7',
            color: 'var(--color-danger)',
            padding: '10px 14px',
            borderRadius: 'var(--radius-md)',
            marginBottom: 'var(--spacing-md)',
            fontSize: 'var(--font-size-md)',
          }}>
             {error || localError}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <Input label="Họ tên"name="ho_ten"type="text"value={formData.ho_ten} onChange={handleChange}
            placeholder="Nguyễn Văn A"required />

          <Input label="Email"name="email"type="email"value={formData.email} onChange={handleChange}
            placeholder="example@gmail.com"required />

          <Input label="Số điện thoại"name="so_dien_thoai"type="tel"value={formData.so_dien_thoai} onChange={handleChange}
            placeholder="09xxxxxxxx"required />

          <Input label="Mật khẩu"name="mat_khau"type="password"value={formData.mat_khau} onChange={handleChange}
            placeholder="Tối thiểu 6 ký tự"required />

          <Input label="Xác nhận mật khẩu"name="xac_nhan_mat_khau"type="password"value={formData.xac_nhan_mat_khau} onChange={handleChange}
            placeholder="Nhập lại mật khẩu"required />

          <Button type="submit"fullWidth loading={loading} size="lg"
            style={{ marginTop: 'var(--spacing-sm)'}}>
            Đăng ký
          </Button>
        </form>

        <p style={{ textAlign:'center', marginTop: 'var(--spacing-lg)', fontSize: 'var(--font-size-md)', color: 'var(--color-text-secondary)'}}>
          Đã có tài khoản?{' '}
          <Link to={ROUTES.LOGIN} style={{ color: 'var(--color-primary)', fontWeight: 500 }}>
            Đăng nhập
          </Link>
        </p>
      </Card>
    </div>
  );
};

export default RegisterPage;