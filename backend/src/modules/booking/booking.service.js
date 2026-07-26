const prisma = require('../../config/prisma');
const { autoCompleteExpiredCheckIns, isStayPeriodEnded } = require('../../utils/bookingHelpers');
const { ensureCommissionForBooking } = require('../../utils/commissionHelpers');

const ADMIN_HOTEL_LIST_SELECT = {
  select: {
    ten: true,
    ma_khach_san: true,
    gio_nhan_phong: true,
    gio_tra_phong: true,
  },
};

const ADMIN_HOTEL_DETAIL_SELECT = {
  select: {
    ten: true,
    dia_chi: true,
    so_sao: true,
    ma_khach_san: true,
    gio_nhan_phong: true,
    gio_tra_phong: true,
    chinh_sach_huy: {
      where: { trang_thai: 'hoat_dong' },
      orderBy: { so_ngay_truoc: 'desc' },
    },
    doi_tac: { select: { ten_cong_ty: true } },
  },
};

const HOTEL_INCLUDE = {
  select: {
    ten: true,
    dia_chi: true,
    ma_khach_san: true,
    gio_nhan_phong: true,
    gio_tra_phong: true,
    chinh_sach_huy: {
      where: { trang_thai: 'hoat_dong' },
      orderBy: { so_ngay_truoc: 'desc' },
    },
  },
};


const PAID_ONLINE_FILTER = {
  thanh_toan: { is: { trang_thai: 'thanh_cong' } },
};

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

    await autoCompleteExpiredCheckIns({ ma_loai_phong: { in: roomIds } });

    const where = {
      ma_loai_phong: { in: roomIds },
      ...PAID_ONLINE_FILTER,
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
            khach_san: HOTEL_INCLUDE,
          },
        },
        thanh_toan: true,
        hoan_tien: {
          select: {
            trang_thai: true,
            so_tien_hoan: true,
            ly_do: true,
            ngay_yeu_cau: true,
          },
        },
      },
      orderBy: { ngay_dat: 'desc' },
    });
  },

  getDetailById: async (id) => {
    await autoCompleteExpiredCheckIns({ ma_dat_phong: Number(id) });

    const booking = await prisma.dat_phong.findUnique({
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
            khach_san: HOTEL_INCLUDE,
          },
        },
        chi_tiet_dat_phong: true,
        thanh_toan: true,
        khuyen_mai: true,
        hoan_tien: true,
      },
    });

    // Đối tác chỉ xem đơn đã thanh toán thành công
    if (booking && booking.thanh_toan?.trang_thai !== 'thanh_cong') {
      return null;
    }
    return booking;
  },

  // Xác nhận khách đã check-in
  checkIn: async (id, doiTacId) => {
    const booking = await verifyOwner(id, doiTacId);
    if (!['da_xac_nhan', 'cho_xac_nhan'].includes(booking.trang_thai)) {
      throw new Error('Chỉ check-in đơn đang chờ khách đến');
    }
    if (isStayPeriodEnded(booking.ngay_tra_phong)) {
      throw new Error('Đơn đã qua ngày trả phòng, không thể check-in');
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

  checkOut: async (id, doiTacId) => {
    const booking = await verifyOwner(id, doiTacId);
    if (booking.trang_thai !== 'da_checkin') {
      throw new Error('Chỉ check-out đơn đã check-in');
    }
    if (isStayPeriodEnded(booking.ngay_tra_phong)) {
      throw new Error('Đơn đã qua ngày trả phòng, không thể check-out');
    }
    await prisma.dat_phong.update({
      where: { ma_dat_phong: Number(id) },
      data: { trang_thai: 'hoan_thanh' },
    });
    await ensureCommissionForBooking(id);
    return bookingService.getDetailById(id);
  },

  // ── Admin ────────────────────────────────────────────────
  getAllForAdmin: async (filters = {}) => {
    const { trang_thai, keyword, ks_id, ma_doi_tac, tu_ngay, den_ngay } = filters;
    const where = {
      ...PAID_ONLINE_FILTER,
    };

    if (trang_thai === 'da_xac_nhan') {
      where.trang_thai = { in: ['da_xac_nhan', 'cho_xac_nhan'] };
    } else if (trang_thai === 'da_huy') {
      where.trang_thai = { in: ['da_huy', 'tu_choi'] };
    } else if (trang_thai && trang_thai !== 'all') {
      where.trang_thai = trang_thai;
    }

    const roomWhere = {};
    if (ks_id) roomWhere.ma_khach_san = Number(ks_id);
    if (ma_doi_tac) {
      roomWhere.khach_san = { ...(roomWhere.khach_san || {}), ma_doi_tac: Number(ma_doi_tac) };
    }
    if (Object.keys(roomWhere).length) where.loai_phong = roomWhere;

    if (tu_ngay && den_ngay) {
      where.ngay_nhan_phong = { gte: new Date(tu_ngay) };
      where.ngay_tra_phong = { lte: new Date(den_ngay) };
    } else if (tu_ngay) {
      where.ngay_nhan_phong = { gte: new Date(tu_ngay) };
    } else if (den_ngay) {
      where.ngay_tra_phong = { lte: new Date(den_ngay) };
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
            khach_san: ADMIN_HOTEL_LIST_SELECT,
          },
        },
        thanh_toan: true,
        hoan_tien: {
          select: {
            trang_thai: true,
            so_tien_hoan: true,
            ly_do: true,
            ngay_yeu_cau: true,
          },
        },
        khuyen_mai: { select: { ma_code: true, ten: true } },
      },
      orderBy: { ngay_dat: 'desc' },
    });
  },

  getDetailForAdmin: async (id) => {
    const { processRefundOnCancel, isAdminCancelledBooking, extractCancelReason } = require('../../utils/refundHelpers');
    const existing = await prisma.dat_phong.findUnique({
      where: { ma_dat_phong: Number(id) },
      select: {
        ma_dat_phong: true,
        trang_thai: true,
        ghi_chu: true,
        thanh_toan: { select: { trang_thai: true } },
        hoan_tien: { select: { ma_hoan_tien: true } },
      },
    });
    if (!existing || existing.thanh_toan?.trang_thai !== 'thanh_cong') {
      return null;
    }
    if (
      ['da_huy', 'tu_choi'].includes(existing.trang_thai)
      && !existing.hoan_tien
    ) {
      await prisma.$transaction(async (tx) => {
        await processRefundOnCancel(
          tx,
          existing.ma_dat_phong,
          extractCancelReason(existing.ghi_chu),
          { fullRefund: isAdminCancelledBooking(existing) },
        );
      });
    }

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
            khach_san: ADMIN_HOTEL_DETAIL_SELECT,
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
    if (!ly_do || !String(ly_do).trim()) {
      throw new Error('Phải kèm lý do mới được hủy');
    }

    const booking = await prisma.dat_phong.findUnique({
      where: { ma_dat_phong: Number(id) },
    });
    if (!booking) throw new Error('Không tìm thấy đơn đặt phòng');
    if (['hoan_thanh', 'da_huy', 'tu_choi', 'da_checkin'].includes(booking.trang_thai)) {
      throw new Error('Không thể hủy đơn đã check-in, đã hoàn thành hoặc đã hủy');
    }

    const reason = String(ly_do).trim();

    await prisma.$transaction(async (tx) => {
      await tx.dat_phong.update({
        where: { ma_dat_phong: Number(id) },
        data: { trang_thai: 'da_huy', ghi_chu: `[Admin hủy] ${reason}` },
      });
      await processRefundOnCancel(tx, id, reason, { fullRefund: true });

      await tx.thong_bao.create({
        data: {
          ma_nguoi_dung: booking.ma_khach_hang,
          ma_dat_phong: Number(id),
          tieu_de: 'Đơn đặt phòng bị hủy bởi Admin',
          noi_dung: `Đơn #${booking.ma_don_hang} đã bị hủy. Lý do: ${reason}`,
          loai: 'dat_phong',
        },
      });
    });

    return bookingService.getDetailForAdmin(id);
  },

  getHotelsForAdminFilter: async () => {
    return prisma.khach_san.findMany({
      where: { trang_thai: 'hoat_dong' },
      select: { ma_khach_san: true, ten: true, ma_doi_tac: true },
      orderBy: { ten: 'asc' },
    });
  },

  getPartnersForAdminFilter: async () => {
    return prisma.doi_tac.findMany({
      where: {
        khach_san: { some: { trang_thai: 'hoat_dong' } },
      },
      select: { ma_doi_tac: true, ten_cong_ty: true },
      orderBy: { ten_cong_ty: 'asc' },
    });
  },

  getStatsForAdmin: async () => {
    const paidWhere = { ...PAID_ONLINE_FILTER };
    const [
      total,
      cho_xac_nhan,
      da_xac_nhan,
      da_checkin,
      hoan_thanh,
      da_huy,
      tu_choi,
    ] = await Promise.all([
      prisma.dat_phong.count({ where: paidWhere }),
      prisma.dat_phong.count({ where: { ...paidWhere, trang_thai: 'cho_xac_nhan' } }),
      prisma.dat_phong.count({ where: { ...paidWhere, trang_thai: 'da_xac_nhan' } }),
      prisma.dat_phong.count({ where: { ...paidWhere, trang_thai: 'da_checkin' } }),
      prisma.dat_phong.count({ where: { ...paidWhere, trang_thai: 'hoan_thanh' } }),
      prisma.dat_phong.count({ where: { ...paidWhere, trang_thai: 'da_huy' } }),
      prisma.dat_phong.count({ where: { ...paidWhere, trang_thai: 'tu_choi' } }),
    ]);

    const now = new Date();
    const startMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const revenue = await prisma.dat_phong.aggregate({
      where: {
        ...paidWhere,
        trang_thai: 'hoan_thanh',
        ngay_dat: { gte: startMonth },
      },
      _sum: { thanh_toan_cuoi: true },
    });

    return {
      total,
      cho_xac_nhan,
      da_xac_nhan: da_xac_nhan + cho_xac_nhan,
      da_checkin,
      hoan_thanh,
      da_huy: da_huy + tu_choi,
      doanh_thu_thang: revenue._sum.thanh_toan_cuoi || 0,
    };
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
  if (Number(booking.loai_phong.khach_san.ma_doi_tac) !== Number(doiTacId)) {
    throw new Error('Không có quyền xử lý đơn này');
  }
  return booking;
};

module.exports = bookingService;