import { Navigate } from 'react-router-dom';
import ROUTES from '../../constants/routes';

/** Quên mật khẩu đối tác đã gộp vào /forgot-password — giữ route cũ để redirect. */
const PartnerForgotPasswordPage = () => (
  <Navigate to={ROUTES.FORGOT_PASSWORD} replace />
);

export default PartnerForgotPasswordPage;
