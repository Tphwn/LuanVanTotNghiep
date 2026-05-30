const authService = require('./auth.service');
const { success, error } = require('../../utils/response');
const MSG = require('../../constants/messages');
const HTTP = require('../../constants/httpStatus');

const register = async (req, res) => {
  try {
    console.log('>>> Body:', req.body);
    const data = await authService.register(req.body);
    console.log('>>> Data:', data);
    return success(res, data, MSG.REGISTER_SUCCESS, HTTP.CREATED);
  } catch (err) {
    console.log('>>> LỖI:', err);
    return error(res, err.message, err.statusCode || HTTP.SERVER_ERROR);
  }
};

const login = async (req, res) => {
  try {
    const data = await authService.login(req.body);
    return success(res, data, MSG.LOGIN_SUCCESS, HTTP.OK);
  } catch (err) {
    console.log('>>> LỖI login:', err);
    return error(res, err.message, err.statusCode || HTTP.SERVER_ERROR);
  }
};

const getMe = async (req, res) => {
  try {
    const data = await authService.getMe(req.user.id);
    return success(res, data, MSG.SUCCESS, HTTP.OK);
  } catch (err) {
    return error(res, err.message, err.statusCode || HTTP.SERVER_ERROR);
  }
};

module.exports = { register, login, getMe };