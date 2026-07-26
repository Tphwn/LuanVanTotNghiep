import { Navigate, useLocation } from 'react-router-dom';
import { useSelector } from 'react-redux';
import ROUTES from '../constants/routes';
import getRedirectRoute from '../utils/redirect';
import { getLoginRouteFromPath } from '../utils/authPortal';

const RoleRoute = ({ children, allowedRoles }) => {
  const { token, user } = useSelector((state) => state.auth);
  const location = useLocation();

  if (!token || !user) {
    return (
      <Navigate
        to={getLoginRouteFromPath(location.pathname)}
        replace
        state={{ from: location.pathname + location.search }}
      />
    );
  }

  if (!allowedRoles.includes(user?.vai_tro)) {
    // Sai role: đưa về khu vực đúng của tài khoản (không kẹt trang lỗi quyền)
    return <Navigate to={getRedirectRoute(user) || ROUTES.HOME} replace />;
  }

  return children;
};

export default RoleRoute;
