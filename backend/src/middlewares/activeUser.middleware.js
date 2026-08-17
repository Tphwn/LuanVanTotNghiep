const { assertUserActive } = require('../utils/accountStatus');
const { error } = require('../utils/response');
const MSG = require('../constants/messages');
const HTTP = require('../constants/httpStatus');

const requireActiveUser = async (req, res, next) => {
  try {
    const userId = req.user?.id ?? req.user?.ma_nguoi_dung;
    const activeUser = await assertUserActive(userId);
    req.user = {
      ...req.user,
      vai_tro: activeUser.vai_tro,
      trang_thai: activeUser.trang_thai,
    };
    next();
  } catch (err) {
    if (err.statusCode === 403 && err.code === 'ACCOUNT_LOCKED') {
      return res.status(HTTP.FORBIDDEN).json({
        success: false,
        message: err.message,
        code: err.code,
      });
    }
    if (err.statusCode === 404) {
      return error(res, err.message, HTTP.NOT_FOUND);
    }
    if (err.statusCode === 401) {
      return error(res, err.message, HTTP.UNAUTHORIZED);
    }
    return next(err);
  }
};

module.exports = requireActiveUser;
