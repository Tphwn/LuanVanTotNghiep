const prisma = require('../../config/prisma');

const bookingService = {

  // Lấy danh sách đặt phòng của KS đối tác
  getByPartner: async (doiTacId, filters = {}) => {
    const { trang_thai, keyword, tu_ngay, den_ngay } = filters;

    // Lấy tất cả KS của đối tác
    const hotels = await prisma.khach_san.findMany({
      where: { ma_doi_tac: doiTacId },
      select: { ma_khach_san: true },
    });
    const hotelIds = hotels.map(h => h.ma_khach_san);

    // Lấy tất cả loại phòng thuộc KS đó
    const rooms = await prisma.loai_phong.findMany({
      where: { ma_khach_san: { in: hotelIds } },
      select: { ma_loai_phong: true },
    });
    const roomIds = rooms.map(r => r.ma_loai_phong);

    const where = {
      ma_loai_phong: { in: roomIds },
    };

    if (trang_thai && trang_thai !== 'all') where.trang_thai = trang_thai;
    if (tu_ngay) where.ngay_dat = { gte: new Date(tu_ngay) };
    if (den_ngay) where.ngay_dat = { ...where.ngay_dat, lte: new Date(den_ngay) };

    return await prisma.dat_phong.findMany({
      where,
      include: {
        khach_hang: {
          select: { ho_ten: true, anh_dai_dien: true },
        },
        loai_phong: {
          include: {
            khach_san: { select: { ten: true } },
          },
        },
        thanh_toan: true,
      },
      orderBy: { ngay_dat: 'desc' },
    });
  },

  // Lấy chi tiết 1 đơn
  getDetailById: async (id) => {
    return await prisma.dat_phong.findUnique({
      where: { ma_dat_phong: Number(id) },
      include: {
        khach_hang: {
          select: {
            ho_ten: true,
            anh_dai_dien: true,
            nguoi_dung: {
              select: { email: true, so_dien_thoai: true },
            },
          },
        },
        loai_phong: {
          include: {
            khach_san: {
              select: { ten: true, dia_chi: true },
            },
          },
        },
        chi_tiet_dat_phong: true,
        thanh_toan: true,
        khuyen_mai: true,
        hoan_tien: true,
      },
    });
  },

  // Xác nhận đơn
  confirm: async (id, doiTacId) => {
    await verifyOwner(id, doiTacId);
    return await prisma.dat_phong.update({
      where: { ma_dat_phong: Number(id) },
      data: { trang_thai: 'da_xac_nhan' },
    });
  },

  // Từ chối đơn
  reject: async (id, doiTacId, ly_do) => {
    await verifyOwner(id, doiTacId);
    return await prisma.dat_phong.update({
      where: { ma_dat_phong: Number(id) },
      data: { trang_thai: 'tu_choi', ghi_chu: ly_do },
    });
  },
};

// Helper: kiểm tra đơn có thuộc KS của đối tác không
const verifyOwner = async (bookingId, doiTacId) => {
  const booking = await prisma.dat_phong.findUnique({
    where: { ma_dat_phong: Number(bookingId) },
    include: {
      loai_phong: {
        include: { khach_san: { select: { ma_doi_tac: true } } },
      },
    },
  });
  if (!booking) throw new Error('Không tìm thấy đơn đặt phòng');
  if (booking.loai_phong.khach_san.ma_doi_tac !== doiTacId) {
    throw new Error('Không có quyền xử lý đơn này');
  }
  return booking;
};

module.exports = bookingService;