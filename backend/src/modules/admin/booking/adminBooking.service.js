const prisma = require('../../../config/prisma');

const adminBookingService = {

  // Lấy tất cả đơn đặt phòng với filter
  getAll: async (filters = {}) => {
    const { trang_thai, keyword, ks_id, tu_ngay, den_ngay } = filters;

    const where = {};

    if (trang_thai && trang_thai !== 'all') {
      where.trang_thai = trang_thai;
    }

    if (ks_id) {
      where.loai_phong = {
        ma_khach_san: Number(ks_id),
      };
    }

    if (tu_ngay && den_ngay) {
      where.ngay_dat = {
        gte: new Date(tu_ngay),
        lte: new Date(den_ngay),
      };
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
        {
          khach_hang: {
            ho_ten: { contains: keyword },
          },
        },
      ];
    }

    return await prisma.dat_phong.findMany({
      where,
      include: {
        khach_hang: {
          select: { ho_ten: true, anh_dai_dien: true },
        },
        loai_phong: {
          select: {
            ten_loai: true,
            khach_san: { select: { ten: true, ma_khach_san: true } },
          },
        },
        thanh_toan: {
          select: { trang_thai: true, phuong_thuc: true, so_tien: true },
        },
        khuyen_mai: {
          select: { ma_code: true, ten: true },
        },
      },
      orderBy: { ngay_dat: 'desc' },
    });
  },

  // Lấy chi tiết 1 đơn
  getById: async (id) => {
    return await prisma.dat_phong.findUnique({
      where: { ma_dat_phong: Number(id) },
      include: {
        khach_hang: {
          select: {
            ho_ten: true,
            anh_dai_dien: true,
            tong_lan_dat: true,
            tong_tien_da_chi: true,
            nguoi_dung: {
              select: { email: true, so_dien_thoai: true },
            },
          },
        },
        loai_phong: {
          include: {
            khach_san: {
              select: {
                ten: true,
                dia_chi: true,
                so_sao: true,
                doi_tac: {
                  select: { ten_cong_ty: true },
                },
              },
            },
          },
        },
        chi_tiet_dat_phong: {
          orderBy: { ngay: 'asc' },
        },
        thanh_toan: true,
        khuyen_mai: true,
        hoan_tien: true,
        thong_bao: {
          orderBy: { ngay_gui: 'desc' },
          take: 10,
        },
      },
    });
  },

  // Hủy đơn (admin can thiệp)
  cancelBooking: async (id, adminId, ly_do) => {
    const booking = await prisma.dat_phong.findUnique({
      where: { ma_dat_phong: Number(id) },
    });
    if (!booking) throw new Error('Không tìm thấy đơn đặt phòng');
    if (['hoan_thanh', 'da_huy'].includes(booking.trang_thai)) {
      throw new Error('Không thể hủy đơn đã hoàn thành hoặc đã hủy');
    }

    // Hủy đơn
    const updated = await prisma.dat_phong.update({
      where: { ma_dat_phong: Number(id) },
      data: {
        trang_thai: 'da_huy',
        ghi_chu: `[Admin hủy] ${ly_do}`,
      },
    });

    // Gửi thông báo cho khách
    await prisma.thong_bao.create({
      data: {
        ma_nguoi_dung: booking.ma_khach_hang,
        ma_dat_phong: Number(id),
        tieu_de: 'Đơn đặt phòng bị hủy bởi Admin',
        noi_dung: `Đơn #${booking.ma_don_hang} đã bị hủy. Lý do: ${ly_do}`,
        loai: 'dat_phong',
      },
    });

    return updated;
  },

  // Lấy danh sách KS để filter
  getAllHotels: async () => {
    return await prisma.khach_san.findMany({
      where: { trang_thai: 'hoat_dong' },
      select: { ma_khach_san: true, ten: true },
      orderBy: { ten: 'asc' },
    });
  },

  // Thống kê nhanh
  getStats: async () => {
    const [total, cho_xac_nhan, da_xac_nhan, hoan_thanh, da_huy] = await Promise.all([
      prisma.dat_phong.count(),
      prisma.dat_phong.count({ where: { trang_thai: 'cho_xac_nhan' } }),
      prisma.dat_phong.count({ where: { trang_thai: 'da_xac_nhan' } }),
      prisma.dat_phong.count({ where: { trang_thai: 'hoan_thanh' } }),
      prisma.dat_phong.count({ where: { trang_thai: 'da_huy' } }),
    ]);

    // Doanh thu tháng này
    const now = new Date();
    const startMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const revenue = await prisma.dat_phong.aggregate({
      where: {
        trang_thai: 'hoan_thanh',
        ngay_dat: { gte: startMonth },
      },
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

module.exports = adminBookingService;