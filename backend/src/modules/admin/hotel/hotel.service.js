const prisma = require('../../../config/prisma');

const hotelService = {
  getHotels: async () => {
    return prisma.khach_san.findMany({
      include: {
        dia_diem: true,
        doi_tac: {
          select: {
            ma_doi_tac: true,
            ten_cong_ty: true,
            trang_thai: true,
          },
        },
        khach_san_tien_nghi: {
          include: { tien_nghi: true },
        },
      },
      orderBy: { ngay_tao: 'desc' },
    });
  },

  getById: async (id) => {
    return prisma.khach_san.findUnique({
      where: { ma_khach_san: Number(id) },
      include: {
        dia_diem: true,
        doi_tac: {
          select: {
            ma_doi_tac: true,
            ten_cong_ty: true,
            ma_nguoi_dung: true,
          },
        },
        khach_san_tien_nghi: {
          include: { tien_nghi: true },
        },
        chinh_sach_huy: true,
        loai_phong: true,
      },
    });
  },

  approveHotel: async (id, adminId) => {
    return prisma.khach_san.update({
      where: { ma_khach_san: Number(id) },
      data: {
        trang_thai: 'hoat_dong',
        duyet_boi_admin_id: Number(adminId),
        ngay_duyet: new Date(),
      },
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
    return prisma.khach_san.update({
      where: { ma_khach_san: Number(id) },
      data: {
        trang_thai: 'bi_khoa',
      },
    });
  },

  unlockHotel: async (id) => {
    return prisma.khach_san.update({
      where: { ma_khach_san: Number(id) },
      data: {
        trang_thai: 'hoat_dong',
      },
    });
  },
};

module.exports = hotelService;
