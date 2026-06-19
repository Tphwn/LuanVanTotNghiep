const ROLES = require('../constants/roles');
const { error } = require('../utils/response');
const MSG = require('../constants/messages');
const HTTP = require('../constants/httpStatus');

const admin = (req, res, next) => {
  if (req.user?.vai_tro !== ROLES.ADMIN) {
    return error(res, MSG.FORBIDDEN, HTTP.FORBIDDEN);
  }
  next();
};

module.exports = admin;
