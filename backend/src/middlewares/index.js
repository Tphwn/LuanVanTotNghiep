const auth = require('./auth.middleware');
const admin = require('./admin.middleware');
const { checkRole } = require('./role.middleware');

const adminGuard = [auth, admin];

module.exports = {
  auth,
  admin,
  adminGuard,
  checkRole,
};
