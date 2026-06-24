import { Navigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import ROUTES from '../constants/routes';

const ProtectedRoute = ({ children, allowedRoles }) => {
  const { token, user } = useSelector((s) => s.auth);
  if (!token) return <Navigate to={ROUTES.LOGIN} replace />;
  if (allowedRoles?.length && !allowedRoles.includes(user?.vai_tro)){
    return <Navigate to={ROUTES.HOME} replace />;
  }
  return children;
};

export default ProtectedRoute;