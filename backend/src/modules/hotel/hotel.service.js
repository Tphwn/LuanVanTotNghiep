const prisma = require('../../config/prisma');

const hotelService = {

  // Lấy danh sách KS của đối tác đang đăng nhập
  getMyHotels: async (doiTacId) => {
    return await prisma.khach_san.findMany({
      where: { ma_doi_tac: doiTacId },
      include: {
        dia_diem: true,
        khach_san_tien_nghi: {
          include: { tien_nghi: true },
        },
      },
      orderBy: { ngay_tao: 'desc' },
    });
  },

  // Lấy chi tiết 1 khách sạn
  getById: async (id) => {
    return await prisma.khach_san.findUnique({
      where: { ma_khach_san: Number(id) },
      include: {
        dia_diem: true,
        khach_san_tien_nghi: {
          include: { tien_nghi: true },
        },
        chinh_sach_huy: true,
        loai_phong: {
          where: { trang_thai: 'hoat_dong' },
          include: {
            loai_phong_tien_nghi: {
              include: { tien_nghi: true },
            },
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

    return await prisma.khach_san.create({
      data: {
        ten,
        dia_chi,
        mo_ta,
        so_sao: Number(so_sao),
        gio_nhan_phong: gio_nhan_phong ? new Date(`1970-01-01T${gio_nhan_phong}`) : null,
        gio_tra_phong:  gio_tra_phong  ? new Date(`1970-01-01T${gio_tra_phong}`)  : null,
        ma_doi_tac: doiTacId,
        ma_dia_diem: Number(ma_dia_diem),
        trang_thai: 'cho_duyet',
        khach_san_tien_nghi: {
          create: tien_nghi_ids.map(id => ({
            ma_tien_nghi: Number(id),
          })),
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

    return await prisma.khach_san.update({
      where: {
        ma_khach_san: Number(id),
        ma_doi_tac: doiTacId, 
      },
      data: {
        ten,
        dia_chi,
        mo_ta,
        so_sao: Number(so_sao),
        gio_nhan_phong: gio_nhan_phong ? new Date(`1970-01-01T${gio_nhan_phong}`) : null,
        gio_tra_phong:  gio_tra_phong  ? new Date(`1970-01-01T${gio_tra_phong}`)  : null,
        khach_san_tien_nghi: {
          create: tien_nghi_ids.map(id => ({
            ma_tien_nghi: Number(id),
          })),
        },
      },
      include: {
        dia_diem: true,
        khach_san_tien_nghi: { include: { tien_nghi: true } },
      },
    });
  },

  getDiaDiem: async () => {
    return await prisma.dia_diem.findMany({
      orderBy: { ten_dia_diem: 'asc' },
    });
  },

  getAmenitiesForHotel: async () => {
    return await prisma.tien_nghi.findMany({
      where: {
        loai: { in: ['khach_san', 'ca_hai'] },
        trang_thai: 'hoat_dong',
      },
      orderBy: { ten: 'asc' },
    });
  },
};

module.exports = hotelService;