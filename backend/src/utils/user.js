const getUserId = (user) => Number(user?.id || user?.ma_nguoi_dung);

module.exports = { getUserId };
