import { Navigate, useLocation } from 'react-router-dom';
import { useSelector } from 'react-redux';
import ROUTES from '../constants/routes';
import getRedirectRoute from '../utils/redirect';
import { getLoginRouteByAllowedRoles, getLoginRouteFromPath } from '../utils/authPortal';

const ProtectedRoute = ({ children, allowedRoles }) => {
  const { token, user } = useSelector((s) => s.auth);
  const location = useLocation();

  if (!token || !user) {
    const loginPath = allowedRoles?.length
      ? getLoginRouteByAllowedRoles(allowedRoles)
      : getLoginRouteFromPath(location.pathname);
    return (
      <Navigate
        to={loginPath}
        replace
        state={{ from: location.pathname + location.search }}
      />
    );
  }

  if (allowedRoles?.length && !allowedRoles.includes(user?.vai_tro)) {
    return <Navigate to={getRedirectRoute(user) || ROUTES.HOME} replace />;
  }

  return children;
};

export default ProtectedRoute;
