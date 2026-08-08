const prisma = require('../config/prisma');

const notifyCustomer = async (maNguoiDung, { tieu_de, noi_dung, loai = 'danh_gia', ma_dat_phong = null }) => {
  if (!maNguoiDung) return null;
  return prisma.thong_bao.create({
    data: {
      ma_nguoi_dung: Number(maNguoiDung),
      ma_dat_phong: ma_dat_phong ? Number(ma_dat_phong) : null,
      tieu_de,
      noi_dung,
      loai,
    },
  });
};
module.exports = {
  notifyCustomer,
};
