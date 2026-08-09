import { Navigate } from 'react-router-dom';
import ROUTES from '../../constants/routes';

const PartnerForgotPasswordPage = () => (
  <Navigate to={ROUTES.FORGOT_PASSWORD} replace />
);

export default PartnerForgotPasswordPage;
