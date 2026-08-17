const prisma = require('../config/prisma');
const MSG = require('../constants/messages');

const assertUserActive = async (userId) => {
  const id = Number(userId);
  if (!Number.isInteger(id) || id <= 0) {
    throw { statusCode: 401, message: MSG.UNAUTHORIZED };
  }

  const user = await prisma.nguoi_dung.findUnique({
    where: { ma_nguoi_dung: id },
    select: { trang_thai: true, vai_tro: true },
  });

  if (!user) {
    throw { statusCode: 404, message: MSG.NOT_FOUND };
  }

  if (user.trang_thai === 'bi_khoa') {
    throw {
      statusCode: 403,
      message: MSG.ACCOUNT_LOCKED,
      code: 'ACCOUNT_LOCKED',
    };
  }

  return user;
};

module.exports = {
  assertUserActive,
};
