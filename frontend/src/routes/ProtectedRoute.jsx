import { Navigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { ROUTES } from '../constants/routes';

const ProtectedRoute = ({ children }) => {
  const { token } = useSelector((state) => state.auth);
  if (!token) return <Navigate to={ROUTES.LOGIN} replace />;
  return children;
};

export default ProtectedRoute;