const { verifyToken } = require('../utils/jwt');
const { error } = require('../utils/response');
const MSG = require('../constants/messages');
const HTTP = require('../constants/httpStatus');

const auth = (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return error(res, MSG.UNAUTHORIZED, HTTP.UNAUTHORIZED);
    }
    const token = authHeader.split(' ')[1];
    req.user = verifyToken(token);
    next();
  } catch {
    return error(res, MSG.TOKEN_INVALID, HTTP.UNAUTHORIZED);
  }
};

module.exports = auth;
module.exports.protect = auth;
