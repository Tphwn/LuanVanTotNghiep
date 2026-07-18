const prisma = require('../config/prisma');

const getAdminUserIds = async () => {
  const admins = await prisma.nguoi_dung.findMany({
    where: { vai_tro: 'admin', trang_thai: 'hoat_dong' },
    select: { ma_nguoi_dung: true },
  });
  return admins.map((a) => a.ma_nguoi_dung);
};

const notifyAdmins = async ({ tieu_de, noi_dung, loai = 'tien_nghi' }) => {
  const adminIds = await getAdminUserIds();
  if (!adminIds.length) return [];

  return prisma.$transaction(
    adminIds.map((ma_nguoi_dung) => prisma.thong_bao.create({
      data: { ma_nguoi_dung, tieu_de, noi_dung, loai },
    })),
  );
};

const notifyAmenityProposal = async ({
  tenDeXuat,
  loaiDeXuat,
  moTa,
  tenDoiTac,
}) => {
  const phamVi = {
    khach_san: 'khách sạn',
    phong: 'loại phòng',
    ca_hai: 'khách sạn & loại phòng',
  }[loaiDeXuat] || 'hệ thống';

  return notifyAdmins({
    tieu_de: `Đề xuất tiện nghi mới: ${tenDeXuat}`,
    noi_dung: [
      `Đối tác "${tenDoiTac || '—'}" đề xuất thêm tiện nghi "${tenDeXuat}" (${phamVi}).`,
      moTa ? `Ghi chú: ${moTa}` : null,
      'Vào Quản lý tiện nghi để thêm vào danh mục nếu phù hợp.',
    ].filter(Boolean).join(' '),
    loai: 'tien_nghi',
  });
};

module.exports = {
  notifyAdmins,
  notifyAmenityProposal,
};
