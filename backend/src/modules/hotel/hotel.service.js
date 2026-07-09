const prisma = require('../../config/prisma');
const { attachHotelImages } = require('../../utils/images');
const {
  lockAdminHotelResources,
  unlockAdminHotelResources,
} = require('../../utils/partnerLockHelpers');
const { notifyHotelLocked, notifyHotelUnlocked } = require('../../utils/partnerNotify');

const hotelService = {
  // ── Partner ──────────────────────────────────────────────
  getMyHotels: async (doiTacId) => {
    return prisma.khach_san.findMany({
      where: { ma_doi_tac: doiTacId },
      include: {
        dia_diem: true,
        khach_san_tien_nghi: { include: { tien_nghi: true } },
      },
      orderBy: { ngay_tao: 'desc' },
    });
  },

  getById: async (id) => {
    return prisma.khach_san.findUnique({
      where: { ma_khach_san: Number(id) },
      include: {
        dia_diem: true,
        khach_san_tien_nghi: { include: { tien_nghi: true } },
        chinh_sach_huy: true,
        loai_phong: {
          where: { trang_thai: 'hoat_dong' },
          include: {
            loai_phong_tien_nghi: { include: { tien_nghi: true } },
          },
        },
      },
    });
  },

  create: async (data, doiTacId) => {
    const {
      ten, dia_chi, mo_ta, so_sao,
      gio_nhan_phong, gio_tra_phong,
      ma_dia_diem, tien_nghi_ids = [],
    } = data;

    return prisma.khach_san.create({
      data: {
        ten,
        dia_chi,
        mo_ta,
        so_sao: Number(so_sao),
        gio_nhan_phong: gio_nhan_phong ? new Date(`1970-01-01T${gio_nhan_phong}`) : null,
        gio_tra_phong: gio_tra_phong ? new Date(`1970-01-01T${gio_tra_phong}`) : null,
        ma_doi_tac: doiTacId,
        ma_dia_diem: Number(ma_dia_diem),
        trang_thai: 'cho_duyet',
        khach_san_tien_nghi: {
          create: tien_nghi_ids.map((id) => ({ ma_tien_nghi: Number(id) })),
        },
      },
      include: {
        dia_diem: true,
        khach_san_tien_nghi: { include: { tien_nghi: true } },
      },
    });
  },

  update: async (id, data, doiTacId) => {
    const {
      ten, dia_chi, mo_ta, so_sao,
      gio_nhan_phong, gio_tra_phong,
      tien_nghi_ids = [],
    } = data;

    await prisma.khach_san_tien_nghi.deleteMany({
      where: { ma_khach_san: Number(id) },
    });

    return prisma.khach_san.update({
      where: { ma_khach_san: Number(id), ma_doi_tac: doiTacId },
      data: {
        ten,
        dia_chi,
        mo_ta,
        so_sao: Number(so_sao),
        gio_nhan_phong: gio_nhan_phong ? new Date(`1970-01-01T${gio_nhan_phong}`) : null,
        gio_tra_phong: gio_tra_phong ? new Date(`1970-01-01T${gio_tra_phong}`) : null,
        khach_san_tien_nghi: {
          create: tien_nghi_ids.map((tid) => ({ ma_tien_nghi: Number(tid) })),
        },
      },
      include: {
        dia_diem: true,
        khach_san_tien_nghi: { include: { tien_nghi: true } },
      },
    });
  },

  getDiaDiem: async () => {
    return prisma.dia_diem.findMany({ orderBy: { ten_dia_diem: 'asc' } });
  },

  getAmenitiesForHotel: async () => {
    return prisma.tien_nghi.findMany({
      where: { loai: { in: ['khach_san', 'ca_hai'] }, trang_thai: 'hoat_dong' },
      orderBy: { ten: 'asc' },
    });
  },

  getAllForAdmin: async () => {
    const hotels = await prisma.khach_san.findMany({
      include: {
        dia_diem: true,
        doi_tac: {
          select: {
            ten_cong_ty: true,
            ma_doi_tac: true,
            nguoi_dung_doi_tac_ma_nguoi_dungTonguoi_dung: {
              select: { trang_thai: true },
            },
          },
        },
        _count: { select: { loai_phong: true } },
      },
      orderBy: [{ ngay_tao: 'asc' }, { ma_khach_san: 'asc' }],
    });
    return attachHotelImages(hotels);
  },

  getDetailForAdmin: async (id) => {
    const hotelId = Number(id);
    const hotel = await prisma.khach_san.findUnique({
      where: { ma_khach_san: hotelId },
      include: {
        dia_diem: true,
        doi_tac: {
          include: {
            nguoi_dung_doi_tac_ma_nguoi_dungTonguoi_dung: {
              select: {
                ma_nguoi_dung: true,
                email: true,
                so_dien_thoai: true,
                trang_thai: true,
              },
            },
          },
        },
        khach_san_tien_nghi: { include: { tien_nghi: true } },
        loai_phong: {
          select: {
            ma_loai_phong: true,
            ten_loai: true,
            gia_co_ban: true,
            suc_chua: true,
            so_luong_phong: true,
            so_luong_mo_ban: true,
            trang_thai: true,
            ngay_tao: true,
          },
          orderBy: { ten_loai: 'asc' },
        },
        _count: { select: { loai_phong: true } },
      },
    });
    if (!hotel) return null;

    const [hinh_anh, dat_phong, danh_gia, bookingAgg, reviewAgg] = await Promise.all([
      prisma.hinh_anh.findMany({
        where: { loai_doi_tuong: 'khach_san', ma_doi_tuong: hotelId },
        orderBy: { thu_tu: 'asc' },
      }),
      prisma.dat_phong.findMany({
        where: { loai_phong: { ma_khach_san: hotelId } },
        select: {
          ma_dat_phong: true,
          ma_don_hang: true,
          ngay_nhan_phong: true,
          ngay_tra_phong: true,
          thanh_toan_cuoi: true,
          trang_thai: true,
          ngay_dat: true,
          khach_hang: { select: { ho_ten: true } },
          loai_phong: { select: { ten_loai: true } },
        },
        orderBy: { ngay_dat: 'desc' },
        take: 30,
      }),
      prisma.danh_gia.findMany({
        where: { dat_phong: { loai_phong: { ma_khach_san: hotelId } } },
        select: {
          ma_danh_gia: true,
          so_sao: true,
          noi_dung: true,
          ngay_danh_gia: true,
          trang_thai: true,
          phan_hoi_doi_tac: true,
          khach_hang: { select: { ho_ten: true } },
          dat_phong: {
            select: {
              ma_don_hang: true,
              loai_phong: { select: { ten_loai: true } },
            },
          },
        },
        orderBy: { ngay_danh_gia: 'desc' },
        take: 30,
      }),
      prisma.dat_phong.aggregate({
        where: { loai_phong: { ma_khach_san: hotelId } },
        _count: { ma_dat_phong: true },
        _sum: { thanh_toan_cuoi: true },
      }),
      prisma.danh_gia.aggregate({
        where: { dat_phong: { loai_phong: { ma_khach_san: hotelId } } },
        _count: { ma_danh_gia: true },
        _avg: { so_sao: true },
      }),
    ]);

    const avgRating = reviewAgg._avg.so_sao
      ? Math.round(Number(reviewAgg._avg.so_sao) * 10) / 10
      : null;

    return {
      ...hotel,
      hinh_anh,
      dat_phong,
      danh_gia,
      thong_ke_nhanh: {
        tong_loai_phong: hotel.loai_phong?.length || hotel._count?.loai_phong || 0,
        tong_don_dat: bookingAgg._count.ma_dat_phong || 0,
        tong_doanh_thu: Number(bookingAgg._sum.thanh_toan_cuoi || 0),
        tong_danh_gia: reviewAgg._count.ma_danh_gia || 0,
        diem_trung_binh: avgRating,
      },
    };
  },

  /**
   * Kích hoạt loại phòng bị ẩn do logic cũ (tạo khi KS còn chờ duyệt).
   * Chỉ chạy khi KS vừa được duyệt — admin khóa loại phòng sau đó dùng chức năng riêng.
   */
  activateRoomsAfterHotelApproval: async (hotelId, tx = prisma) => {
    const hotel = await tx.khach_san.findUnique({
      where: { ma_khach_san: Number(hotelId) },
      select: { ngay_duyet: true },
    });

    const stuckRooms = await tx.loai_phong.findMany({
      where: {
        ma_khach_san: Number(hotelId),
        so_luong_mo_ban: 0,
        so_luong_phong: { gt: 0 },
        OR: [
          { trang_thai: 'an' },
          {
            trang_thai: 'hoat_dong',
            ...(hotel?.ngay_duyet ? { ngay_tao: { lte: hotel.ngay_duyet } } : {}),
          },
        ],
      },
    });

    await Promise.all(
      stuckRooms.map((room) => tx.loai_phong.update({
        where: { ma_loai_phong: room.ma_loai_phong },
        data: {
          trang_thai: 'hoat_dong',
          so_luong_mo_ban: room.so_luong_phong,
        },
      }))
    );

    return stuckRooms.length;
  },

  approveHotel: async (id, adminId) => {
    return prisma.$transaction(async (tx) => {
      const hotel = await tx.khach_san.update({
        where: { ma_khach_san: Number(id) },
        data: {
          trang_thai: 'hoat_dong',
          duyet_boi_admin_id: Number(adminId),
          ngay_duyet: new Date(),
        },
      });

      await hotelService.activateRoomsAfterHotelApproval(id, tx);
      return hotel;
    });
  },

  rejectHotel: async (id, adminId, lyDo) => {
    return prisma.khach_san.update({
      where: { ma_khach_san: Number(id) },
      data: {
        trang_thai: 'tu_choi',
        ly_do_tu_choi: lyDo,
        duyet_boi_admin_id: Number(adminId),
        ngay_duyet: new Date(),
      },
    });
  },

  requestInfoHotel: async (id, adminId, ghiChu) => {
    return prisma.khach_san.update({
      where: { ma_khach_san: Number(id) },
      data: {
        trang_thai: 'yeu_cau_sua',
        ly_do_tu_choi: ghiChu,
        duyet_boi_admin_id: Number(adminId),
        ngay_duyet: new Date(),
      },
    });
  },

  lockHotel: async (id, lyDoKhoa) => {
    const reason = lyDoKhoa?.trim();
    if (!reason) {
      throw { statusCode: 400, message: 'Vui lòng nhập lý do khóa' };
    }

    const hotel = await prisma.$transaction((tx) => lockAdminHotelResources(tx, id, reason));
    await notifyHotelLocked(hotel.ma_doi_tac, { tenKhachSan: hotel.ten, lyDo: reason });
    return hotel;
  },

  unlockHotel: async (id) => {
    const hotel = await prisma.$transaction((tx) => unlockAdminHotelResources(tx, id));
    await notifyHotelUnlocked(hotel.ma_doi_tac, { tenKhachSan: hotel.ten });
    return hotel;
  },
};

module.exports = hotelService;
