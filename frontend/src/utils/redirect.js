import ROUTES from '../constants/routes';
import ROLES from '../constants/roles';

const getRedirectRoute = (user) => {
  if (!user) return ROUTES.HOME;
  if (user.vai_tro === ROLES.ADMIN) return ROUTES.ADMIN.DASHBOARD;
  if (user.vai_tro === ROLES.DOI_TAC) return ROUTES.PARTNER.DASHBOARD;
  return ROUTES.HOME;
};

export default getRedirectRoute;
