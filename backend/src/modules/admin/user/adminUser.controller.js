const userService = require('./adminUser.service');

const getUsers = async (req, res, next) => {
  try {
    const users = await userService.getUsers();

    res.json({
      success: true,
      data: users,
    });
  } catch (error) {
    next(error);
  }
};

const getUserById = async (req, res, next) => {
  try {
    console.log("PARAMS:", req.params);

    const { id } = req.params;

    if (!id) {
      return res.status(400).json({
        success: false,
        message: 'Missing user id parameter',
      });
    }

    const user = await userService.getUserById(Number(id));

    res.json({
      success: true,
      data: user,
    });
  } catch (error) {
    next(error);
  }
};

const lockUser = async (req, res, next) => {
  try {
    await userService.lockUser(
      req.params.id
    );

    res.json({
      success: true,
      message: 'Đã khóa tài khoản',
    });
  } catch (error) {
    next(error);
  }
};

const unlockUser = async (req, res, next) => {
  try {
    await userService.unlockUser(
      req.params.id
    );

    res.json({
      success: true,
      message: 'Đã mở khóa tài khoản',
    });
  } catch (error) {
    next(error);
  }
};

const createPartner = async (req, res, next) => {
  try {

    const result =
      await userService.createPartner(
        req.body,
        req.user.id
      );

    res.status(201).json({
      success: true,
      data: result,
    });

  } catch (error) {
    next(error);
  }
};

module.exports = {
  getUsers,
  getUserById,
  lockUser,
  unlockUser,
  createPartner,
};