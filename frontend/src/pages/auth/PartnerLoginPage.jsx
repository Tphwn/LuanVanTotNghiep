import { Navigate } from 'react-router-dom';
import ROUTES from '../../constants/routes';

const PartnerLoginPage = () => <Navigate to={ROUTES.LOGIN} replace />;

export default PartnerLoginPage;
