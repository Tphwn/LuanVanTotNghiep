const { error } = require('../utils/response');
const MSG = require('../constants/messages');
const HTTP = require('../constants/httpStatus');

const checkRole = (roles = []) => {
  return (req, res, next) => {
    if (!req.user) return error(res, MSG.UNAUTHORIZED, HTTP.UNAUTHORIZED);
    if (!roles.includes(req.user.vai_tro)) {
      return error(res, MSG.FORBIDDEN, HTTP.FORBIDDEN);
    }
    next();
  };
};

module.exports = { checkRole };