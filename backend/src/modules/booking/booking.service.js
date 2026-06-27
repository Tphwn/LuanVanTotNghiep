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
        hoan_tien: { select: { trang_thai: true, so_tien_hoan: true } },
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

  // Xác nhận đơn (thanh toán tại khách sạn)
  confirm: async (id, doiTacId) => {
    const booking = await verifyOwner(id, doiTacId);
    if (booking.trang_thai !== 'cho_xac_nhan') {
      throw new Error('Chỉ xác nhận đơn đang chờ xác nhận');
    }
    await prisma.dat_phong.update({
      where: { ma_dat_phong: Number(id) },
      data: { trang_thai: 'da_xac_nhan' },
    });
    return bookingService.getDetailById(id);
  },

  // Xác nhận khách đã check-in
  checkIn: async (id, doiTacId) => {
    const booking = await verifyOwner(id, doiTacId);
    if (!['da_xac_nhan', 'cho_xac_nhan'].includes(booking.trang_thai)) {
      throw new Error('Chỉ check-in đơn đang chờ khách đến');
    }

    await prisma.$transaction(async (tx) => {
      await tx.dat_phong.update({
        where: { ma_dat_phong: Number(id) },
        data: { trang_thai: 'da_checkin' },
      });

      if (booking.phuong_thuc_tt === 'truc_tuyen') {
        await tx.thanh_toan.updateMany({
          where: { ma_dat_phong: Number(id) },
          data: { trang_thai: 'thanh_cong' },
        });
      }
    });

    return bookingService.getDetailById(id);
  },

  // Xác nhận khách đã check-out → hoàn thành
  checkOut: async (id, doiTacId) => {
    const booking = await verifyOwner(id, doiTacId);
    if (booking.trang_thai !== 'da_checkin') {
      throw new Error('Chỉ check-out đơn đã check-in');
    }
    await prisma.dat_phong.update({
      where: { ma_dat_phong: Number(id) },
      data: { trang_thai: 'hoan_thanh' },
    });
    return bookingService.getDetailById(id);
  },

  // Từ chối đơn
  reject: async (id, doiTacId, ly_do) => {
    await verifyOwner(id, doiTacId);
    await prisma.$transaction(async (tx) => {
      await tx.dat_phong.update({
        where: { ma_dat_phong: Number(id) },
        data: { trang_thai: 'tu_choi', ghi_chu: ly_do },
      });
      await processRefundOnCancel(tx, id, ly_do);
    });
    return bookingService.getDetailById(id);
  },

  // ── Admin ────────────────────────────────────────────────
  getAllForAdmin: async (filters = {}) => {
    const { trang_thai, keyword, ks_id, tu_ngay, den_ngay } = filters;
    const where = {};

    if (trang_thai && trang_thai !== 'all') where.trang_thai = trang_thai;
    if (ks_id) where.loai_phong = { ma_khach_san: Number(ks_id) };

    if (tu_ngay && den_ngay) {
      where.ngay_dat = { gte: new Date(tu_ngay), lte: new Date(den_ngay) };
    } else if (tu_ngay) {
      where.ngay_dat = { gte: new Date(tu_ngay) };
    } else if (den_ngay) {
      where.ngay_dat = { lte: new Date(den_ngay) };
    }

    if (keyword) {
      where.OR = [
        { ma_don_hang: { contains: keyword } },
        { ten_nguoi_nhan: { contains: keyword } },
        { sdt_nguoi_nhan: { contains: keyword } },
        { khach_hang: { ho_ten: { contains: keyword } } },
      ];
    }

    return prisma.dat_phong.findMany({
      where,
      include: {
        khach_hang: { select: { ho_ten: true, anh_dai_dien: true } },
        loai_phong: {
          select: {
            ten_loai: true,
            khach_san: { select: { ten: true, ma_khach_san: true } },
          },
        },
        thanh_toan: { select: { trang_thai: true, phuong_thuc: true, so_tien: true } },
        khuyen_mai: { select: { ma_code: true, ten: true } },
      },
      orderBy: { ngay_dat: 'desc' },
    });
  },

  getDetailForAdmin: async (id) => {
    return prisma.dat_phong.findUnique({
      where: { ma_dat_phong: Number(id) },
      include: {
        khach_hang: {
          select: {
            ho_ten: true,
            anh_dai_dien: true,
            tong_lan_dat: true,
            tong_tien_da_chi: true,
            nguoi_dung: { select: { email: true, so_dien_thoai: true } },
          },
        },
        loai_phong: {
          include: {
            khach_san: {
              select: {
                ten: true,
                dia_chi: true,
                so_sao: true,
                doi_tac: { select: { ten_cong_ty: true } },
              },
            },
          },
        },
        chi_tiet_dat_phong: { orderBy: { ngay: 'asc' } },
        thanh_toan: true,
        khuyen_mai: true,
        hoan_tien: true,
        thong_bao: { orderBy: { ngay_gui: 'desc' }, take: 10 },
      },
    });
  },

  cancelByAdmin: async (id, adminId, ly_do) => {
    const booking = await prisma.dat_phong.findUnique({
      where: { ma_dat_phong: Number(id) },
    });
    if (!booking) throw new Error('Không tìm thấy đơn đặt phòng');
    if (['hoan_thanh', 'da_huy'].includes(booking.trang_thai)) {
      throw new Error('Không thể hủy đơn đã hoàn thành hoặc đã hủy');
    }

    await prisma.$transaction(async (tx) => {
      await tx.dat_phong.update({
        where: { ma_dat_phong: Number(id) },
        data: { trang_thai: 'da_huy', ghi_chu: `[Admin hủy] ${ly_do}` },
      });
      await processRefundOnCancel(tx, id, ly_do);

      await tx.thong_bao.create({
        data: {
          ma_nguoi_dung: booking.ma_khach_hang,
          ma_dat_phong: Number(id),
          tieu_de: 'Đơn đặt phòng bị hủy bởi Admin',
          noi_dung: `Đơn #${booking.ma_don_hang} đã bị hủy. Lý do: ${ly_do}`,
          loai: 'dat_phong',
        },
      });
    });

    return bookingService.getDetailForAdmin(id);
  },

  getHotelsForAdminFilter: async () => {
    return prisma.khach_san.findMany({
      where: { trang_thai: 'hoat_dong' },
      select: { ma_khach_san: true, ten: true },
      orderBy: { ten: 'asc' },
    });
  },

  getStatsForAdmin: async () => {
    const [total, cho_xac_nhan, da_xac_nhan, hoan_thanh, da_huy] = await Promise.all([
      prisma.dat_phong.count(),
      prisma.dat_phong.count({ where: { trang_thai: 'cho_xac_nhan' } }),
      prisma.dat_phong.count({ where: { trang_thai: 'da_xac_nhan' } }),
      prisma.dat_phong.count({ where: { trang_thai: 'hoan_thanh' } }),
      prisma.dat_phong.count({ where: { trang_thai: 'da_huy' } }),
    ]);

    const now = new Date();
    const startMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const revenue = await prisma.dat_phong.aggregate({
      where: { trang_thai: 'hoan_thanh', ngay_dat: { gte: startMonth } },
      _sum: { thanh_toan_cuoi: true },
    });

    return {
      total,
      cho_xac_nhan,
      da_xac_nhan,
      hoan_thanh,
      da_huy,
      doanh_thu_thang: revenue._sum.thanh_toan_cuoi || 0,
    };
  },
};

const processRefundOnCancel = async (tx, bookingId, lyDo) => {
  const booking = await tx.dat_phong.findUnique({
    where: { ma_dat_phong: Number(bookingId) },
    include: { thanh_toan: true, hoan_tien: true },
  });

  if (!booking?.thanh_toan || booking.hoan_tien) return;

  const wasPaid =
    booking.phuong_thuc_tt === 'truc_tuyen'
    || booking.thanh_toan.trang_thai === 'thanh_cong';
  if (!wasPaid) return;

  await tx.hoan_tien.create({
    data: {
      ma_dat_phong: booking.ma_dat_phong,
      ma_thanh_toan: booking.thanh_toan.ma_thanh_toan,
      so_tien_hoan: booking.thanh_toan.so_tien,
      ly_do: lyDo || 'Hủy đơn đặt phòng',
      trang_thai: 'da_hoan',
      ngay_xu_ly: new Date(),
    },
  });
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
  if (Number(booking.loai_phong.khach_san.ma_doi_tac) !== Number(doiTacId)) {
    throw new Error('Không có quyền xử lý đơn này');
  }
  return booking;
};

module.exports = bookingService;