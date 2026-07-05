const prisma = require('../../config/prisma');
const { attachHotelImages } = require('../../utils/images');
const {
  getHotelLockState,
  isLockedByPartner,
} = require('../../utils/partnerLockHelpers');

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
    const hotel = await prisma.khach_san.findUnique({
      where: { ma_khach_san: Number(id) },
      include: {
        dia_diem: true,
        doi_tac: {
          include: {
            nguoi_dung_doi_tac_ma_nguoi_dungTonguoi_dung: {
              select: { email: true, so_dien_thoai: true },
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
            trang_thai: true,
          },
          orderBy: { ten_loai: 'asc' },
        },
        _count: { select: { loai_phong: true } },
      },
    });
    if (!hotel) return null;

    const hinh_anh = await prisma.hinh_anh.findMany({
      where: { loai_doi_tuong: 'khach_san', ma_doi_tuong: hotel.ma_khach_san },
      orderBy: { thu_tu: 'asc' },
    });

    return { ...hotel, hinh_anh };
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

  lockHotel: async (id) => {
    const hotelId = Number(id);
    const hotel = await prisma.khach_san.findUnique({
      where: { ma_khach_san: hotelId },
      select: { khoa_do_doi_tac: true },
    });

    if (!hotel) {
      throw { statusCode: 404, message: 'Không tìm thấy khách sạn' };
    }

    return prisma.khach_san.update({
      where: { ma_khach_san: hotelId },
      data: {
        trang_thai: 'bi_khoa',
        ...(hotel.khoa_do_doi_tac ? {} : { khoa_do_doi_tac: false }),
      },
    });
  },

  unlockHotel: async (id) => {
    const hotelId = Number(id);
    const hotel = await getHotelLockState(prisma, hotelId);

    if (!hotel) {
      throw { statusCode: 404, message: 'Không tìm thấy khách sạn' };
    }

    if (isLockedByPartner(hotel)) {
      throw {
        statusCode: 400,
        message: 'Khách sạn đang bị đối tác khóa. Bạn không thể mở khóa.',
      };
    }

    return prisma.khach_san.update({
      where: { ma_khach_san: hotelId },
      data: {
        trang_thai: 'hoat_dong',
        khoa_do_doi_tac: false,
      },
    });
  },
};

module.exports = hotelService;
